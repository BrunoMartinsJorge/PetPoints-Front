import type { OnInit , OnDestroy } from '@angular/core';
import { Component, inject } from '@angular/core';
import { PrimeNGModule } from '../../../../shared/modules/prime-ng/prime-ng-module';
import type { ConsultasAtendenteDto } from '../consultas-clinica/models/ConsultasAtendenteDto';
import type { IndeferirConsultaForm } from '../consultas-clinica/forms/IndeferirConsultaForm';
import { ConsultasServices } from '../consultas-clinica/service/consultas-services';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import {
  DashboardAtendimentoService,
  type CardsDashboardAtendenteDto,
} from './service/dashboard-atendimento-service';
import { Subscription } from 'rxjs';
import { SolicitacoesAtendimentoWsService } from '../../../../shared/services/ws/solicitacoes-atendimento-ws-service';
import type { SolicitacoesAtendimentosDto } from '../chat-atendimento/models/SolicitacoesAtendimentosDto';
import type { SolicitacaoRemovidaDto } from '../chat-atendimento/models/SolicitacaoRemovidaDto';
import { AtendimentosAtendenteeService } from '../chat-atendimento/services/atendimentos-atendentee-service';
import type { ChatAtendimentoDto } from '../chat-atendimento/models/ChatAtendimentoDto';
import { CardResumo } from '../../../../shared/components/card-resumo/card-resumo';
import { BagStatusConsulta } from "../../../../shared/components/bag-status-consulta/bag-status-consulta";

@Component({
  selector: 'app-dashboard-atendente',
  imports: [PrimeNGModule, CardResumo, BagStatusConsulta],
  templateUrl: './dashboard-atendente.html',
  styleUrl: './dashboard-atendente.scss',
})
export class DashboardAtendente implements OnInit, OnDestroy {
  private readonly toast = inject(MessageService);
  private readonly serviceConsultas = inject(ConsultasServices);
  private readonly confirmService = inject(ConfirmationService);
  private readonly service = inject(DashboardAtendimentoService);
  private readonly router = inject(Router);
  private readonly solicitacoesWs = inject(SolicitacoesAtendimentoWsService);
  private readonly serviceNotificacoes = inject(AtendimentosAtendenteeService);

  public cards: CardsDashboardAtendenteDto = {
    atendimentosFinalizados: 0,
    consultasParticipadas: 0,
    rankingAvaliacao: 0,
  };

  public consultaSelecionada: ConsultasAtendenteDto | null = null;
  public solicitacaoConsultaSelecionada: IndeferirConsultaForm = {
    idConsulta: 0,
    motivo: '',
  };

  public consultas: ConsultasAtendenteDto[] = [];
  public carregandoConsultas = false;

  public solicitacoesConsultas: ConsultasAtendenteDto[] = [];
  public carregandoSolicitacoes = false;

  public desabilitarAcoes = false;

  public visibilidadeSolicitacaoConsulta = false;
  public visibilidadeDialogDetalhesConsulta = false;

  public listaSolicitacoesAtendimentos: SolicitacoesAtendimentosDto[] = [];
  public carregandoSolicitacoesAtendimentos = false;

  private readonly subscriptions = new Subscription();

  public ngOnInit(): void {
    this.buscarConsultas();
    this.buscarSolicitacoes();
    this.buscarCards();
    this.escutarSolicitacoesEmTempoReal();
    this.buscarSolicitacoesAtendimentos();
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.solicitacoesWs.disconnect();
  }

  private buscarCards(): void {
    this.cards = {
      atendimentosFinalizados: 0,
      consultasParticipadas: 0,
      rankingAvaliacao: 0,
    };
    this.service.buscarCardsAtendente().subscribe((response) => {
      this.cards = response;
    });
  }

  public fecharDialogDetalhesConsulta(): void {
    this.consultaSelecionada = null;
    this.visibilidadeDialogDetalhesConsulta = false;
  }

  public selecionarSolicitacaoConsulta(consulta: ConsultasAtendenteDto): void {
    this.solicitacaoConsultaSelecionada.idConsulta = consulta.id;
    this.visibilidadeSolicitacaoConsulta = true;
  }

  public gerarTextoCancelamentoIndeferimento(
    consulta: ConsultasAtendenteDto,
  ): string {
    if (consulta.status.toString() == 'Cancelado') {
      return (
        'Motivo Cancelamento: ' + (consulta.motivoCancelamento || 'Sem motivo')
      );
    } else {
      return (
        'Motivo Indeferimento: ' +
        (consulta.motivoIndeferimento || 'Sem motivo')
      );
    }
  }

  public buscarConsultas(): void {
    this.consultas = [];
    this.carregandoConsultas = true;
    this.serviceConsultas.buscarHistoricoConsultas().subscribe({
      next: (response: ConsultasAtendenteDto[]) => {
        this.consultas = response;
        this.carregandoConsultas = false;
      },
      error: () => {
        this.carregandoConsultas = false;
      },
    });
  }

  public buscarSolicitacoes(): void {
    this.solicitacoesConsultas = [];
    this.carregandoSolicitacoes = true;
    this.serviceConsultas.buscarSolicitacoesConsultas().subscribe({
      next: (response: ConsultasAtendenteDto[]) => {
        this.solicitacoesConsultas = response;
        this.carregandoSolicitacoes = false;
      },
      error: () => {
        this.carregandoSolicitacoes = false;
      },
    });
  }

  public aprovarConsulta(consulta: ConsultasAtendenteDto): void {
    this.desabilitarAcoes = true;
    this.confirmService.confirm({
      header: 'Aprovar Consulta',
      message: 'Tem certeza que deseja aprovar essa consulta?',
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'danger',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Aprovar',
        severity: 'success',
      },

      accept: () => {
        this.serviceConsultas
          .aprovarSolicitacaoConsulta(consulta.id)
          .subscribe({
            next: () => {
              this.toast.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Consulta aprovada com sucesso!',
              });
              this.buscarSolicitacoes();
              this.buscarConsultas();
              this.buscarCards();
              this.visibilidadeSolicitacaoConsulta = false;
              this.solicitacaoConsultaSelecionada = {
                idConsulta: 0,
                motivo: '',
              };
              this.desabilitarAcoes = false;
            },
            error: () => {
              this.desabilitarAcoes = false;
            },
          });
      },
    });
  }

  public get habilitarBotaoEnviarReprova(): boolean {
    return (
      this.solicitacaoConsultaSelecionada.motivo.trim().length > 0 &&
      this.solicitacaoConsultaSelecionada.idConsulta > 0
    );
  }

  public reprovarConsulta(): void {
    if (!this.habilitarBotaoEnviarReprova) return;
    this.desabilitarAcoes = true;
    this.confirmService.confirm({
      header: 'Reprovar Consulta',
      message: 'Tem certeza que deseja reprovar essa consulta?',
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'success',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Reprovar',
        severity: 'danger',
      },

      accept: () => {
        this.serviceConsultas
          .reprovarSolicitacaoConsulta(this.solicitacaoConsultaSelecionada)
          .subscribe({
            next: () => {
              this.toast.add({
                severity: 'warn',
                summary: 'Sucesso',
                detail: 'Consulta reprovada com sucesso!',
              });
              this.buscarConsultas();
              this.buscarSolicitacoes();
              this.visibilidadeSolicitacaoConsulta = false;
              this.solicitacaoConsultaSelecionada = {
                idConsulta: 0,
                motivo: '',
              };
              this.desabilitarAcoes = false;
            },
            error: () => {
              this.desabilitarAcoes = false;
            },
          });
      },
    });
  }

  public selecionarConsulta(consulta: ConsultasAtendenteDto): void {
    this.consultaSelecionada = consulta;
    this.serviceConsultas.redirecionado = true;
    this.serviceConsultas.idConsultaSelecionada = consulta.id;
    this.router.navigate(['/atendente/consultas-clinica']);
  }

  private escutarSolicitacoesEmTempoReal(): void {
    this.solicitacoesWs.connect();

    this.subscriptions.add(
      this.solicitacoesWs.novaSolicitacao$.subscribe({
        next: (solicitacao: SolicitacoesAtendimentosDto) => {
          const jaExiste = this.listaSolicitacoesAtendimentos.some(
            (s) => s.id === solicitacao.id,
          );
          if (jaExiste) return;
          this.listaSolicitacoesAtendimentos = [
            solicitacao,
            ...this.listaSolicitacoesAtendimentos,
          ];
          this.toast.add({
            severity: 'info',
            summary: 'Nova solicitação',
            detail: `${solicitacao.solicitante} abriu uma nova solicitação de atendimento!`,
          });
        },
      }),
    );

    this.subscriptions.add(
      this.solicitacoesWs.solicitacaoRemovida$.subscribe({
        next: (removida: SolicitacaoRemovidaDto) => {
          this.listaSolicitacoesAtendimentos =
            this.listaSolicitacoesAtendimentos.filter(
              (s) => s.id !== removida.id,
            );
        },
      }),
    );
  }

  private buscarSolicitacoesAtendimentos(): void {
    this.listaSolicitacoesAtendimentos = [];
    this.carregandoSolicitacoesAtendimentos = true;
    this.serviceNotificacoes.listarSolicitacoesAtendimentos().subscribe({
      next: (solicitacoes) => {
        this.listaSolicitacoesAtendimentos = solicitacoes;
        this.carregandoSolicitacoesAtendimentos = false;
      },
    });
  }

  public aceitarSolicitacaoAtendimento(idSolicitacao: number): void {
    this.serviceNotificacoes.idAtendimentoSelecionado = null;
    this.serviceNotificacoes.aceitarSolicitacaoAtendimento(idSolicitacao).subscribe({
      next: (response: ChatAtendimentoDto) => {
        this.toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Solicitação de atendimento aceita com sucesso!',
        });
        this.listaSolicitacoesAtendimentos =
          this.listaSolicitacoesAtendimentos.filter(
            (s) => s.id !== idSolicitacao,
          );
        this.serviceNotificacoes.idAtendimentoSelecionado = response.chatId;
        this.router.navigate([
          'atendente/atendimento-selecionado/',
          response.chatId,
        ]);
      },
    });
  }
}
