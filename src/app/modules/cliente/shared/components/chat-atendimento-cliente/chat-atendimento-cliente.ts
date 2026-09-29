import type { OnInit, OnDestroy } from '@angular/core';
import { Component, inject } from '@angular/core';
import { PrimeNGModule } from '../../../../../shared/modules/prime-ng/prime-ng-module';
import type { MensagemAtendimento } from '../../../../../shared/models/ChatModels';
import { AtendimentosClienteService } from './services/atendimentos-cliente-service';
import type { ChatAtendimentoDto } from './models/ChatAtendimentoDto';
import { MessageService } from 'primeng/api';
import { ChatAtendimentoWsService } from '../../../../../shared/services/ws/chat-atendimento-ws-service';
import type { Subscription } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { RatingModule } from 'primeng/rating';
import type { AvaliacaoForm } from '../../../../../shared/form/AvaliacaoForm';
import type { EquipeAtendimentoDto } from './models/EquipeAtendimentoDto';
import { StatusAtendimentoEnum } from '../../../../../shared/models/enums/StatusAtendimentoEnum';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-chat-atendimento-cliente',
  imports: [PrimeNGModule, RatingModule],
  providers: [MessageService],
  templateUrl: './chat-atendimento-cliente.html',
  styleUrl: './chat-atendimento-cliente.scss',
})
export class ChatAtendimentoCliente implements OnInit, OnDestroy {
  private readonly service = inject(AtendimentosClienteService);
  private readonly toast = inject(MessageService);

  public visibilidadeDialogChatAtendimento = false;
  public visibilidadeDialogFinalizarAtendimento = false;
  public atendimentos: ChatAtendimentoDto[] = [];
  public chatSelecionado: ChatAtendimentoDto | null = null;
  public modoAtendimento: 'SOLICITACAO' | 'LISTA' = 'LISTA';
  public mensagemChatSelecionado: MensagemAtendimento[] = [];

  public mensagemSolicitacaoAtendimento = '';
  public novaMensagem = '';

  public equipeAtendimento: EquipeAtendimentoDto[] = [];
  public buscaAtendimentos = '';
  private readonly avataresSemImagem = new Set<number>();

  public enviandoAvaliacao = false;

  public avaliacaoAtendimento = {
    pontuacao: 0,
    observacoes: '',
  };

  private buscarAtendimentosCliente(): void {
    this.atendimentos = [];
    this.service.buscarAtendimentosCliente().subscribe({
      next: (atendimentos: ChatAtendimentoDto[]) => {
        this.atendimentos = atendimentos;
      },
    });
  }

  private buscarEquipeAtendimento(): void {
    this.equipeAtendimento = [];
    this.service.buscarEquipeAtendimento().subscribe({
      next: (equipe: EquipeAtendimentoDto[]) => (this.equipeAtendimento = equipe),
    });
  }

  /** Mostra no máximo quatro rostos na pilha de avatares, como no restante da tela. */
  public get equipeVisivel(): EquipeAtendimentoDto[] {
    return this.equipeAtendimento.slice(0, 4);
  }

  public get atendentesRestantes(): number {
    return Math.max(0, this.equipeAtendimento.length - this.equipeVisivel.length);
  }

  /** Atendimentos ordenados do mais recente para o mais antigo e filtrados pela busca. */
  public get atendimentosFiltrados(): ChatAtendimentoDto[] {
    const busca = this.buscaAtendimentos.trim().toLowerCase();
    const filtrados = busca
      ? this.atendimentos.filter(
          (atendimento) =>
            atendimento.mensagem?.toLowerCase().includes(busca) ||
            atendimento.atendente?.toLowerCase().includes(busca),
        )
      : this.atendimentos;
    return [...filtrados].sort(
      (a, b) =>
        new Date(b.solicitadoEm).getTime() - new Date(a.solicitadoEm).getTime(),
    );
  }

  public get atendimentoEmAndamento(): boolean {
    return this.chatSelecionado?.status === StatusAtendimentoEnum.EM_ANDAMENTO;
  }

  public get aguardandoAtendente(): boolean {
    return this.chatSelecionado?.status === StatusAtendimentoEnum.PENDENTE;
  }

  public rotuloStatus(status: string): string {
    switch (status) {
      case StatusAtendimentoEnum.PENDENTE:
        return 'Aguardando atendente';
      case StatusAtendimentoEnum.EM_ANDAMENTO:
        return 'Em andamento';
      case StatusAtendimentoEnum.FINALIZADO:
        return 'Finalizado';
      default:
        return status;
    }
  }

  public urlAvatar(idUsuario: number | undefined): string {
    return environment.apiUrl + '/arquivos/usuario/' + idUsuario;
  }

  /** Sem foto no perfil o endpoint responde erro; aí o avatar cai para as iniciais. */
  public marcarAvatarComErro(idUsuario: number | undefined): void {
    if (idUsuario === undefined) return;
    this.avataresSemImagem.add(idUsuario);
  }

  public avatarComErro(idUsuario: number | undefined): boolean {
    if (idUsuario === undefined) return true;
    return this.avataresSemImagem.has(idUsuario);
  }

  public pegarIniciais(nome: string): string {
    const limpo = (nome ?? '').trim();
    if (!limpo) return '?';
    const partes = limpo.split(' ').filter((parte) => parte.length > 0);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  /** Primeira mensagem do atendimento, encurtada para caber no card. */
  public resumoMensagem(mensagem: string): string {
    const limpo = (mensagem ?? '').trim();
    if (limpo.length <= 90) return limpo;
    return limpo.substring(0, 90) + '...';
  }

  public abrirNovaMensagem(): void {
    this.modoAtendimento = 'SOLICITACAO';
  }

  public voltarParaListaAtendimentos(): void {
    this.mensagemSolicitacaoAtendimento = '';
    this.modoAtendimento = 'LISTA';
  }

  public async selecionarAtendimento(
    atendimento: ChatAtendimentoDto,
  ): Promise<void> {
    this.chatSelecionado = atendimento;

    const historico = await firstValueFrom(
      this.service.buscarMensagensChatAtendimento(atendimento.chatId),
    );

    this.ws.abrirChat(atendimento.chatId, historico);
    this.buscarAvaliacao();
  }

  public enviarSolicitacaoAtendimento(): void {
    if (
      this.mensagemSolicitacaoAtendimento == null ||
      this.mensagemSolicitacaoAtendimento.trim() === ''
    ) {
      return;
    }

    this.service
      .solicitarAtendimento(this.mensagemSolicitacaoAtendimento)
      .subscribe({
        next: () => {
          this.toast.add({
            severity: 'success',
            summary: 'Solicitação enviada',
            detail: 'Sua solicitação de atendimento foi enviada com sucesso.',
          });
          this.mensagemSolicitacaoAtendimento = '';
          this.buscarAtendimentosCliente();
          this.modoAtendimento = 'LISTA';
        },
      });
  }

  public finalizarAtendimento(): void {
    if (!this.chatSelecionado || !this.podeAvaliarAtendimento) return;
    this.enviandoAvaliacao = true;
    const payload: AvaliacaoForm = {
      pontuacao: this.avaliacaoAtendimento.pontuacao,
      observacoes: this.avaliacaoAtendimento.observacoes,
    };
    this.service
      .finalizarAtendimento(payload, this.chatSelecionado.chatId)
      .subscribe({
        next: () => {
          if (this.chatSelecionado)
            this.selecionarAtendimento(this.chatSelecionado);
          this.visibilidadeDialogFinalizarAtendimento = false;
          this.toast.add({
            severity: 'success',
            summary: 'Finalizado',
            detail: 'Seu atendimento foi finalizado com sucesso!.',
          });
          this.enviandoAvaliacao = false;
        },
        error: () => {
          this.enviandoAvaliacao = false;
        },
      });
  }

  private buscarAvaliacao(): void {
    if (!this.chatSelecionado) return;
    this.avaliacaoAtendimento = {
    pontuacao: 0,
    observacoes: '',
  };

    this.service
      .buscarAvaliacao(this.chatSelecionado.chatId)
      .subscribe({
        next: (avaliacao) => {
          this.avaliacaoAtendimento.observacoes = avaliacao.mensagem;
          this.avaliacaoAtendimento.pontuacao = avaliacao.pontuacao;
        },
      });
  }

  private readonly ws = inject(ChatAtendimentoWsService);

  private wsSub?: Subscription;
  private statusSub?: Subscription;
  private statusUsuarioSub?: Subscription;

  public async ngOnInit(): Promise<void> {
    this.ws.connect();
    this.buscarAtendimentosCliente();
    this.buscarEquipeAtendimento();
    this.wsSub = this.ws.mensagens$.subscribe(
      (m) => (this.mensagemChatSelecionado = m),
    );
    this.statusSub = this.ws.status$.subscribe((evento) => {
      if (!evento || !this.chatSelecionado) return;
      if (evento.idChat !== this.chatSelecionado.chatId) return;
      this.chatSelecionado = {
        ...this.chatSelecionado,
        status: evento.status as StatusAtendimentoEnum,
        atendente: evento.atendente ?? this.chatSelecionado.atendente,
      };
      this.atendimentos = this.atendimentos.map((atendimento) =>
        atendimento.chatId === evento.idChat
          ? {
              ...atendimento,
              status: evento.status as StatusAtendimentoEnum,
              atendente: evento.atendente ?? atendimento.atendente,
            }
          : atendimento,
      );
    });

    this.ws.escutarMeuStatus();
    this.statusUsuarioSub = this.ws.statusUsuario$.subscribe((evento) => {
      if (!evento) return;
      this.atendimentos = this.atendimentos.map((atendimento) =>
        atendimento.chatId === evento.idChat
          ? {
              ...atendimento,
              status: evento.status as StatusAtendimentoEnum,
              atendente: evento.atendente ?? atendimento.atendente,
            }
          : atendimento,
      );
      if (
        this.chatSelecionado &&
        this.chatSelecionado.chatId === evento.idChat
      ) {
        this.chatSelecionado = {
          ...this.chatSelecionado,
          status: evento.status as StatusAtendimentoEnum,
          atendente: evento.atendente ?? this.chatSelecionado.atendente,
        };
      }
    });
    if (!this.chatSelecionado) return;
    const historico = await firstValueFrom(
      this.service.buscarMensagensChatAtendimento(this.chatSelecionado.chatId),
    );
    if (!this.chatSelecionado) return;
    this.ws.abrirChat(this.chatSelecionado.chatId, historico);
  }

  public ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    this.statusSub?.unsubscribe();
    this.statusUsuarioSub?.unsubscribe();
    this.ws.disconnect();
  }

  public voltarParaLista(): void {
    this.novaMensagem = '';
    this.mensagemSolicitacaoAtendimento = '';
    this.modoAtendimento = 'LISTA';
    this.chatSelecionado = null;
    this.avaliacaoAtendimento = {
      pontuacao: 0,
      observacoes: '',
    };
  }

  public abrirDialogFinalizarAtendimento(): void {
    this.visibilidadeDialogFinalizarAtendimento = true;
    this.avaliacaoAtendimento = {
      pontuacao: 0,
      observacoes: '',
    };
  }

  public get solicitacaoAtendimentoValida(): boolean {
    return this.mensagemSolicitacaoAtendimento.trim().length > 0;
  }

  public get mensagemAtendimentoValida(): boolean {
    return this.novaMensagem.trim().length > 0;
  }

  public enviar(): void {
    const texto = this.novaMensagem.trim();
    if (!texto || !this.chatSelecionado) return;

    this.ws.enviar({
      idChat: this.chatSelecionado.chatId,
      idDestinatario: this.chatSelecionado.chatId,
      mensagem: this.novaMensagem,
    });
    this.novaMensagem = '';
  }

  public get podeAvaliarAtendimento(): boolean {
    if (this.avaliacaoAtendimento == null || this.avaliacaoAtendimento.observacoes == null) return false;
    return this.avaliacaoAtendimento.observacoes.trim().length >= 10;
  }
}
