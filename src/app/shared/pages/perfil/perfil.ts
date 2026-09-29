import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { TokenService } from '../../../core/services/token-service';
import { PrimeNGModule } from '../../modules/prime-ng/prime-ng-module';
import { Imagem } from '../../components/imagem/imagem';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import type { InformacoesUsuarioDto } from './model/InformacoesUsuarioDto';
import { PerfilService } from './service/perfil-service';
import { GeneroEnumOpcoesFormulario } from '../../models/enums/GeneroEnum';
import type { FileSelectEvent } from 'primeng/fileupload';
import type { EditarPerfilForm } from './form/EditarPerfilForm';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import type { RankingFuncionarioDto } from './model/RankingFuncionarioDto';
import type { ConsultasAtendenteVeterinarioDto } from './model/ConsultasAtendenteVeterinarioDto';
import { Router } from '@angular/router';
import { ConsultasServices } from '../../../modules/atendente/features/consultas-clinica/service/consultas-services';
import { MinhasMovimentacoesService } from '../../../modules/estoquista/pages/minhas-movimentacoes/service/minhas-movimentacoes-service';
import type { MinhasMovimentacoesDto } from '../../../modules/estoquista/pages/minhas-movimentacoes/model/MinhasMovimentacoesDto';
import { BagTipoMovimentacao } from '../../components/bag-tipo-movimentacao/bag-tipo-movimentacao';
import { MeusPagamentosService } from '../../../modules/cliente/pages/meus-pagamentos/service/meus-pagamentos-service';
import type { PagamentosDto } from '../../../modules/cliente/pages/meus-pagamentos/models/PagamentosDto';
import { TipoPagamentoEnum } from '../../models/enums/TipoPagamentoEnum';
import type { RelatorioFinanceiroClienteDto } from './model/RelatorioFinanceiroClienteDto';
import type { MinhasAvaliacoesDto } from './model/MinhasAvaliacoesDto';
import type { AvaliacaoConsultaDto } from '../../../modules/atendente/features/consultas-clinica/models/AvaliacaoConsultaDto';
import type { LogDto } from '../../../modules/gerente/pages/logs-sistema/models/LogDto';
import type { MovimentacoesDto } from '../../../modules/gerente/pages/movimentacoes-clinica/model/MovimentacoesDto';
import { LogsService } from '../../../modules/gerente/pages/logs-sistema/service/logs-service';
import { MovimentacoesClinicaService } from '../../../modules/gerente/pages/movimentacoes-clinica/service/movimentacoes-clinica-service';
import { BagLog } from '../../../modules/gerente/pages/logs-sistema/components/bag-log/bag-log';
import { AgendaConsultas } from '../../components/agenda-consultas/agenda-consultas';
import { urlArquivo } from '../../utils/imagem-url';
import { BagStatusConsulta } from '../../components/bag-status-consulta/bag-status-consulta';

@Component({
  selector: 'app-perfil',
  imports: [
    PrimeNGModule,
    Imagem,
    ReactiveFormsModule,
    ConfirmDialog,
    BagTipoMovimentacao,
    BagLog,
    AgendaConsultas,
    BagStatusConsulta,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil implements OnInit {
  private readonly service = inject(PerfilService);
  private readonly tokenService = inject(TokenService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly toast = inject(MessageService);
  private readonly router = inject(Router);

  private readonly atendenteConsultaService = inject(ConsultasServices);
  private readonly estoquistaMovimentacoesService = inject(
    MinhasMovimentacoesService,
  );
  private readonly clienteService = inject(MeusPagamentosService);
  private readonly gerenteLogsService = inject(LogsService);
  private readonly gerenteMovimentacoesService = inject(
    MovimentacoesClinicaService,
  );

  public readonly tiposGeneros = GeneroEnumOpcoesFormulario;
  public informacoesUsuario!: FormGroup;
  public novaImagem = {
    file: null as File | null,
    url: '',
  };
  private dadosUsuario: InformacoesUsuarioDto | null = null;
  public carregandoUsuario = false;

  public podeEditar = false;

  public rankingAvaliacao: RankingFuncionarioDto | null = null;
  public carregandoRankingAvaliacao = false;

  public avaliacoes: AvaliacaoConsultaDto[] = [];
  public carregandoAvaliacoes = false;

  public consultasAtendenteVeterinario: ConsultasAtendenteVeterinarioDto[] = [];
  public consultaAtendenteVeterinarioSelecionada: ConsultasAtendenteVeterinarioDto | null =
    null;
  public carregandoConsultasAtendenteVeterinario = false;

  public movimentacoesEstoquista: MinhasMovimentacoesDto[] = [];
  public carregandoMovimentacoesEstoquista = false;

  public logsSistema: LogDto[] = [];
  public carregandoLogsSistema = false;

  public movimentacoes: MovimentacoesDto[] = [];
  public carregandoMovimentacoes = false;

  public dataMaxima = new Date();

  public pagamentosPendentes: RelatorioFinanceiroClienteDto = {
    pagamentosPendentes: 0,
    saldoPendente: 0,
    meusPagamentosAtrasadosPendentes: [],
  };
  public carregandoInformacoesPagamentos = false;

  public minhasAvaliacoes: MinhasAvaliacoesDto[] = [];
  public carregandoMinhasAvaliacoes = false;

  ngOnInit(): void {
    this.setarUrlTipoUsuario();
    this.buscarDadosUsuario();
  }

  private setarUrlTipoUsuario(): void {
    this.service.setUrlTipoUsuario(this.getTipoUsuario);
  }

  private buscarDadosUsuario(): void {
    this.dadosUsuario = null;
    this.carregandoUsuario = true;
    this.service.buscarInformacoesUsuario().subscribe({
      next: (dados: InformacoesUsuarioDto) => {
        this.dadosUsuario = dados;
        this.gerarInformacoesUsuario();
        this.carregandoUsuario = false;
        this.buscarInformacoesRankingAvaliacoes();
        this.buscarInformacoesAvaliacoes();
        this.buscarConsultasAtendenteVeterinario();
        this.buscarMovimentacoesEstoquista();
        this.buscarPagamentosPendentesAtrasados();
        this.buscarMinhasAvaliacoes();
        this.buscarLogs();
        this.buscarMovimentacoes();
      },
    });
  }

  public carregarArquivo(event: FileSelectEvent): void {
    const file: File = event.currentFiles[0];
    if (file) this.novaImagem = { file, url: URL.createObjectURL(file) };
  }

  private gerarInformacoesUsuario(): void {
    if (this.dadosUsuario === null) return;
    const form = new FormGroup({
      nome: new FormControl(this.dadosUsuario.nome || '', [
        Validators.required,
      ]),
      email: new FormControl(this.dadosUsuario.email || '', [
        Validators.required,
        Validators.email,
      ]),
      imagem: new FormControl(this.dadosUsuario.imagem || ''),
      genero: new FormControl(this.dadosUsuario.genero || '', [
        Validators.required,
      ]),
      dataNascimento: new FormControl(
        this.dadosUsuario.dataNascimento || new Date(),
        [Validators.required],
      ),
      telefone: new FormControl(this.dadosUsuario.telefone || '', [
        Validators.required,
      ]),
      cpf: new FormControl(this.dadosUsuario.cpf || '', [Validators.required]),
    });
    this.informacoesUsuario = form;
    this.informacoesUsuario.disable();
  }

  public alterarPermissaoEdicao(): void {
    this.podeEditar = !this.podeEditar;
    if (!this.podeEditar) {
      this.gerarInformacoesUsuario();
    } else {
      this.informacoesUsuario.enable();
    }
  }

  public get maiorIdade(): boolean {
    const dataNascimento: Date = this.informacoesUsuario.get('dataNascimento')?.value;
    if (!dataNascimento) return false;
    const hoje = new Date();
    const limite = new Date(
      hoje.getFullYear() - 18,
      hoje.getMonth(),
      hoje.getDate(),
    );

    return dataNascimento <= limite;
  }

  public get getImagemUsuario(): string {
    const token = this.tokenService.getToken;
    if (!token) return '';
    return urlArquivo(this.tokenService.decodeToken(token).imagem);
  }

  public get getTipoUsuario(): string {
    const token = this.tokenService.getToken;
    if (!token) return '';
    return this.tokenService.decodeToken(token).permissao;
  }

  /**
   *
   * @param tipoPagamento {TipoPagamentoEnum} tipoPagamento - Tipo ou forma de pagamento escolhida
   * @description Metodo responsável por retornar o icone referente ao tipo de pagamento
   * @returns {string} iconePagamento - icone referente ao tipo de pagamento
   */
  public iconePagamento(tipoPagamento: TipoPagamentoEnum): string {
    if (tipoPagamento === TipoPagamentoEnum.PIX)
      return 'fa fas fas fas fa-qrcode';
    else if (tipoPagamento === TipoPagamentoEnum.DINHEIRO)
      return 'fa fas fa-money-bill';
    else return 'fa fas fas fa-money-check';
  }

  /**
   *
   * @description Metodo responsável por buscar as informações do ranking de avaliação de atendentes e veterinários
   */
  private buscarInformacoesRankingAvaliacoes(): void {
    if (
      this.getTipoUsuario !== 'ATENDENTE' &&
      this.getTipoUsuario !== 'VETERINARIO'
    )
      return;
    this.rankingAvaliacao = null;
    this.carregandoRankingAvaliacao = true;
    this.service.buscarInformacoesRankingAvaliacoes().subscribe({
      next: (response: RankingFuncionarioDto) => {
        this.rankingAvaliacao = response;
        this.carregandoRankingAvaliacao = false;
      },
      error: () => {
        this.carregandoRankingAvaliacao = false;
      },
    });
  }

  /**
   *
   * @description - Metodo responsável por selecionar um pagamento e redirecionar o cliente para a tela de pagamentos
   * @param {PagamentosDto} pagamento - Pagamento selecionado
   */
  public selecionarPagamento(pagamento: PagamentosDto): void {
    this.clienteService.idPagamentoSelecionado = pagamento.id;
    this.clienteService.redirecionadoParaPagamento = true;
    this.router.navigate([`/cliente/meus-pagamentos`]);
  }

  private buscarPagamentosPendentesAtrasados(): void {
    if (this.getTipoUsuario != 'CLIENTE') return;
    this.pagamentosPendentes = {
      pagamentosPendentes: 0,
      saldoPendente: 0,
      meusPagamentosAtrasadosPendentes: [],
    };
    this.carregandoInformacoesPagamentos = true;
    this.service.buscarRelatorioFinanceiroCliente().subscribe({
      next: (response: RelatorioFinanceiroClienteDto) => {
        this.pagamentosPendentes = response;
        this.carregandoInformacoesPagamentos = false;
      },
      error: () => {
        this.carregandoInformacoesPagamentos = false;
      },
    });
  }

  private buscarInformacoesAvaliacoes(): void {
    if (
      this.getTipoUsuario !== 'ATENDENTE' &&
      this.getTipoUsuario !== 'VETERINARIO'
    )
      return;
    this.avaliacoes = [];
    this.carregandoAvaliacoes = true;
    this.service.buscarAvaliacoes().subscribe({
      next: (response: AvaliacaoConsultaDto[]) => {
        this.avaliacoes = response;
        this.carregandoAvaliacoes = false;
      },
      error: () => {
        this.carregandoAvaliacoes = false;
      },
    });
  }

  private buscarConsultasAtendenteVeterinario(): void {
    if (
      this.getTipoUsuario !== 'ATENDENTE' &&
      this.getTipoUsuario !== 'VETERINARIO'
    )
      return;
    this.consultasAtendenteVeterinario = [];
    this.carregandoConsultasAtendenteVeterinario = true;
    this.service.buscarConsultasAtendenteVeterinario().subscribe({
      next: (response: ConsultasAtendenteVeterinarioDto[]) => {
        this.consultasAtendenteVeterinario = response;
        this.carregandoConsultasAtendenteVeterinario = false;
      },
      error: () => {
        this.carregandoConsultasAtendenteVeterinario = false;
      },
    });
  }

  public selecionarConsulta(consulta: ConsultasAtendenteVeterinarioDto): void {
    this.consultaAtendenteVeterinarioSelecionada = consulta;
    if (this.getTipoUsuario === 'ATENDENTE') {
      this.atendenteConsultaService.redirecionado = true;
      this.atendenteConsultaService.idConsultaSelecionada = consulta.id;
      this.router.navigate(['/atendente/consultas-clinica']);
    }
  }

  public gerarTextoCancelamentoIndeferimento(
    consulta: ConsultasAtendenteVeterinarioDto,
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

  private buscarMovimentacoesEstoquista(): void {
    if (this.getTipoUsuario !== 'ESTOQUISTA') return;
    this.movimentacoesEstoquista = [];
    this.carregandoMovimentacoesEstoquista = true;
    this.estoquistaMovimentacoesService.listarMinhasMovimentacoes().subscribe({
      next: (response: MinhasMovimentacoesDto[]) => {
        this.movimentacoesEstoquista = response;
        this.carregandoMovimentacoesEstoquista = false;
      },
      error: () => {
        this.carregandoMovimentacoesEstoquista = false;
      },
    });
  }

  private buscarMinhasAvaliacoes(): void {
    if (this.getTipoUsuario !== 'CLIENTE') return;
    this.minhasAvaliacoes = [];
    this.carregandoMinhasAvaliacoes = true;
    this.service.buscarAvaliacoesCliente().subscribe({
      next: (response: MinhasAvaliacoesDto[]) => {
        this.minhasAvaliacoes = response;
        this.carregandoMinhasAvaliacoes = false;
      },
      error: () => {
        this.carregandoMinhasAvaliacoes = false;
      },
    });
  }

  private converterStringData(data: string): Date {
    return new Date(data);
  }

  private buscarLogs(): void {
    if (this.getTipoUsuario !== 'GERENTE') return;
    this.logsSistema = [];
    this.carregandoLogsSistema = true;
    this.gerenteLogsService.buscarLogs().subscribe({
      next: (response: LogDto[]) => {
        this.logsSistema = response;
        this.carregandoLogsSistema = false;
      },
      error: () => {
        this.carregandoLogsSistema = false;
      },
    });
  }

  private buscarMovimentacoes(): void {
    if (this.getTipoUsuario !== 'GERENTE') return;
    this.movimentacoes = [];
    this.carregandoMovimentacoes = true;
    this.gerenteMovimentacoesService.listarMovimentacoes().subscribe({
      next: (response: MovimentacoesDto[]) => {
        this.movimentacoes = response;
        this.carregandoMovimentacoes = false;
      },
      error: () => {
        this.carregandoMovimentacoes = false;
      },
    });
  }

  public enviarAlteracoes(): void {
    if (this.informacoesUsuario.invalid) return;
    const form: EditarPerfilForm = this.informacoesUsuario.value;
    form.dataNascimento = this.converterStringData(
      this.informacoesUsuario.value.dataNascimento,
    );
    this.service.enviarAlteracoes(form, this.novaImagem.file).subscribe({
      next: () => {
        this.buscarDadosUsuario();
        this.alterarPermissaoEdicao();
      },
    });
  }

  public desativarPerfil(event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      header: 'Desativar Perfil',
      rejectButtonProps: {
        label: 'Manter Ativo',
        icon: 'pi pi-times',
        variant: 'outlined',
        size: 'small',
      },
      acceptButtonProps: {
        label: 'Desativar',
        severity: 'danger',
        icon: 'fa fa-user-minus',
        size: 'small',
      },
      accept: () => {
        this.service.desativarPerfil().subscribe({
          next: () => {
            this.router.navigate(['/login']);
            this.toast.add({
              severity: 'info',
              summary: 'Sucesso',
              detail: 'Perfil desativado com sucesso! Você será deslogado!',
              life: 3000,
            });
          },
        });
      },
      reject: () => {
        this.toast.add({
          severity: 'warn',
          summary: 'Alerta',
          detail: 'Perfil mantido ativo',
          life: 3000,
        });
      },
    });
  }
}
