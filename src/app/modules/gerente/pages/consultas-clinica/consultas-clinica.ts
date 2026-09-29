import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { PrimeNGModule } from '../../../../shared/modules/prime-ng/prime-ng-module';
import { ConsultasClinicaService } from './service/consultas-clinica-service';
import type { ConsultaClinicaDto } from './model/ConsultaClinicaDto';
import type { TiposConsultaDto } from './model/TiposConsultaDto';
import type { OpcoesFiltro } from './model/OpcoesFiltro';
import { BagStatusConsulta } from '../../../../shared/components/bag-status-consulta/bag-status-consulta';
import type { DetalhesTipoConsultaDto } from './model/DetalhesTipoConsultaDto';
import { TabsModule } from 'primeng/tabs';
import type { TipoConsultaForm } from './form/TipoConsultaForm';
import { MessageService } from 'primeng/api';
import { AccordionModule } from 'primeng/accordion';
import type { VeterinarioEspecializacoesDto } from './model/VeterinarioEspecializacoesDto';
import type { FiltroConsultaForm } from './form/FiltroConsultaForm';
import type { EspecializacaoDto } from './model/EspecializacaoDto';
import type { EspecializacaoForm } from './form/EspecializacaoForm';
import type { DetalhesEspecializacaoDto } from './model/DetalhesEspecializacaoDto';
import { DetalhesConsulta } from './pages/detalhes-consulta/detalhes-consulta';
import { StatusConsultaEnum } from '../../../../shared/models/enums/StatusConsultaEnum';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { TipoPagamentoEnum } from '../../../../shared/models/enums/TipoPagamentoEnum';
import { CardResumo } from '../../../../shared/components/card-resumo/card-resumo';
import type { TomDescricaoCardResumo } from '../../../../shared/components/card-resumo/card-resumo';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-consultas-clinica',
  imports: [
    PrimeNGModule,
    BagStatusConsulta,
    TabsModule,
    AccordionModule,
    DetalhesConsulta,
    CardResumo,
  ],
  providers: [ConfirmationService],
  templateUrl: './consultas-clinica.html',
  styleUrl: './consultas-clinica.scss',
})
export class ConsultasClinica implements OnInit {
  private readonly service = inject(ConsultasClinicaService);
  private readonly toast = inject(MessageService);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);

  private consultas: ConsultaClinicaDto[] = [];

  public carregandoConsultas = false;
  public consultasFiltradas: ConsultaClinicaDto[] = [];
  public idConsultaSelecionada: number | null = null;

  public resumo = {
    total: 0,
    totalGeral: 0,
    pendentes: 0,
    emAndamento: 0,
    finalizadas: 0,
    canceladas: 0,
    hoje: 0,
    variacaoMes: null as number | null,
    variacaoHoje: null as number | null,
  };

  public readonly abas = [
    { label: 'Recentes', value: 'RECENTES' },
    { label: 'Em Andamento', value: 'ANDAMENTO' },
    { label: 'Finalizadas', value: 'FINALIZADAS' },
  ];
  public abaSelecionada = 'RECENTES';

  private readonly avataresSemImagem = new Set<string>();

  public get textoVariacaoMes(): string {
    if (this.resumo.variacaoMes === null)
      return `de ${this.resumo.totalGeral} no total`;
    return this.textoVariacao(this.resumo.variacaoMes, 'que o mês passado');
  }

  public get tomVariacaoMes(): TomDescricaoCardResumo {
    return this.tomVariacao(this.resumo.variacaoMes);
  }

  public get textoVariacaoHoje(): string {
    if (this.resumo.variacaoHoje === null) return 'agendadas para hoje';
    return this.textoVariacao(this.resumo.variacaoHoje, 'que ontem');
  }

  public get tomVariacaoHoje(): TomDescricaoCardResumo {
    return this.tomVariacao(this.resumo.variacaoHoje);
  }

  private textoVariacao(variacao: number, periodo: string): string {
    const sinal = variacao > 0 ? '+' : '';
    const comparacao = variacao >= 0 ? 'mais' : 'menos';
    return `${sinal}${variacao}% ${comparacao} ${periodo}`;
  }

  private tomVariacao(variacao: number | null): TomDescricaoCardResumo {
    if (variacao === null) return 'neutro';
    return variacao >= 0 ? 'positivo' : 'negativo';
  }

  public dataFiltro: Date | null = null;
  public visibilidadeFiltros = false;
  public visibilidadeGestao = false;
  public modoLista = false;

  public carregandoTiposConsultas = false;
  public tiposConsultas: TiposConsultaDto[] = [];
  public detalhesTipoConsulta: DetalhesTipoConsultaDto =
    {} as DetalhesTipoConsultaDto;
  public idTipoConsultaSelecionado: number | null = null;
  public visibilidadeDialogNovoTipoConsulta = false;
  public visibilidadeDialogDetalhesTipoConsulta = false;
  public edicaoHabilitadaTipoConsulta = false;
  public novoTipoConsulta: TipoConsultaForm = {
    nome: '',
    descricao: '',
    valor: 0.0,
  };
  public valoresEdicao: TipoConsultaForm = {
    nome: '',
    descricao: '',
    valor: 0.0,
  };

  public carregandoRelatorio = false;

  public especializacoes: EspecializacaoDto[] = [];
  public carregandoEspecializacoes = false;
  public idEspecializacaoSelecionado: number | null = null;
  public edicaoHabilitadaEspecializacao = false;
  public visibilidadeDialogAdicionarEspecializacao = false;
  public visibilidadeDialogEditarEspecializacao = false;
  public novaEspecializacao: EspecializacaoForm = {
    descricao: '',
  };
  public especializacaoEdicao: EspecializacaoForm = {
    descricao: '',
  };

  public tiposConsultasFiltros: OpcoesFiltro[] = [];
  public clientesFiltros: OpcoesFiltro[] = [];
  public veterinariosFiltros: OpcoesFiltro[] = [];

  public veterinariosAdicionar: VeterinarioEspecializacoesDto[] = [];
  public detalhesEspecializacao: DetalhesEspecializacaoDto | null = null;

  public filtros = {
    cliente: null as number | null,
    veterinario: null as number | null,
    tipoConsulta: null as number | null,
  };

  ngOnInit(): void {
    this.buscarConsultas();
  }

  public recarregar(): void {
    this.buscarConsultas();
  }

  private buscarConsultas(): void {
    this.carregandoConsultas = true;
    this.carregandoTiposConsultas = true;
    this.carregandoEspecializacoes = true;
    this.consultas = [];
    this.consultasFiltradas = [];
    this.atualizarResumo();
    this.service.listarConsultas().subscribe({
      next: (response: ConsultaClinicaDto[]) => {
        this.consultas = response;
        this.consultasFiltradas = response;
        this.carregandoConsultas = false;
        this.atualizarResumo();
        this.buscarTiposConsulta();
        this.buscarClientesFiltros();
        this.buscarVeterinariosFiltros();
        this.buscarTiposConsultaFiltros();
        this.buscarEspecializacoes();
      },
      error: () => {
        this.carregandoConsultas = false;
        this.carregandoTiposConsultas = false;
        this.carregandoEspecializacoes = false;
      },
    });
  }

  private atualizarResumo(): void {
    const contar = (...status: StatusConsultaEnum[]): number =>
      this.consultasFiltradas.filter((consulta) =>
        status.includes(consulta.status),
      ).length;

    this.resumo = {
      total: this.consultasFiltradas.length,
      totalGeral: this.consultas.length,
      pendentes: contar(StatusConsultaEnum.PENDENTE),
      emAndamento: contar(
        StatusConsultaEnum.APROVADA,
        StatusConsultaEnum.INICIADO,
      ),
      finalizadas: contar(StatusConsultaEnum.FINALIZADO),
      canceladas: contar(
        StatusConsultaEnum.CANCELADO,
        StatusConsultaEnum.REPROVADA,
      ),
      hoje: this.contarNoDia(0),
      variacaoMes: this.calcularVariacaoMensal(),
      variacaoHoje: this.calcularVariacao(
        this.contarNoDia(0),
        this.contarNoDia(-1),
      ),
    };
  }

  /** Consultas agendadas no dia de hoje deslocado por `diferencaDias`. */
  private contarNoDia(diferencaDias: number): number {
    const alvo = new Date();
    alvo.setDate(alvo.getDate() + diferencaDias);
    return this.consultasFiltradas.filter((consulta) =>
      this.mesmoDia(new Date(consulta.dataConsulta), alvo),
    ).length;
  }

  /** Compara o volume do mês corrente com o do mês anterior. */
  private calcularVariacaoMensal(): number | null {
    const agora = new Date();
    const mesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);

    const contarMes = (referencia: Date): number =>
      this.consultasFiltradas.filter((consulta) => {
        const data = new Date(consulta.dataConsulta);
        return (
          data.getMonth() === referencia.getMonth() &&
          data.getFullYear() === referencia.getFullYear()
        );
      }).length;

    return this.calcularVariacao(contarMes(agora), contarMes(mesAnterior));
  }

  /**
   * Variação percentual entre dois períodos. Devolve null quando não há base de
   * comparação, para a tela não exibir um percentual sem significado.
   */
  private calcularVariacao(atual: number, anterior: number): number | null {
    if (anterior === 0) return null;
    return Math.round(((atual - anterior) / anterior) * 100);
  }

  private mesmoDia(a: Date, b: Date): boolean {
    return (
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear()
    );
  }

  private buscarTiposConsulta(): void {
    this.carregandoTiposConsultas = true;
    this.tiposConsultas = [];
    this.service.listarTiposConsulta().subscribe({
      next: (response: TiposConsultaDto[]) => {
        this.tiposConsultas = response;
        this.carregandoTiposConsultas = false;
      },
      error: () => {
        this.carregandoTiposConsultas = false;
      },
    });
  }

  private buscarEspecializacoes(): void {
    this.carregandoEspecializacoes = true;
    this.especializacoes = [];
    this.service.listarEspecializacoes().subscribe({
      next: (response: EspecializacaoDto[]) => {
        this.especializacoes = response;
        this.carregandoEspecializacoes = false;
      },
      error: () => {
        this.carregandoEspecializacoes = false;
      },
    });
  }

  private buscarClientesFiltros(): void {
    this.clientesFiltros = [];
    this.service.listarClientesFiltros().subscribe({
      next: (response: OpcoesFiltro[]) => {
        this.clientesFiltros = response;
        this.clientesFiltros.unshift({ label: 'Todos', value: null });
      },
    });
  }

  private buscarVeterinariosFiltros(): void {
    this.veterinariosFiltros = [];
    this.service.listarVeterinariosFiltros().subscribe({
      next: (response: OpcoesFiltro[]) => {
        this.veterinariosFiltros = response;
        this.veterinariosFiltros.unshift({ label: 'Todos', value: null });
      },
    });
  }

  private buscarTiposConsultaFiltros(): void {
    this.tiposConsultasFiltros = [];
    this.service.listarTiposConsultaFiltros().subscribe({
      next: (response: OpcoesFiltro[]) => {
        this.tiposConsultasFiltros = response;
        this.tiposConsultasFiltros.unshift({ label: 'Todos', value: null });
      },
    });
  }

  public removerVeterinarioEspecializacao(idVeterinario: number): void {
    if (!this.idEspecializacaoSelecionado) return;
    this.service
      .removerVeterinarioEspecializacao(
        this.idEspecializacaoSelecionado,
        idVeterinario,
      )
      .subscribe({
        next: () => {
          if (this.idEspecializacaoSelecionado)
            this.verDetalhesEspecializacao(this.idEspecializacaoSelecionado);
          this.limparEdicaoEspecializacao();
        },
      });
  }

  public adicionarNovoVeterinarioEspecializacao(idVeterinario: number): void {
    if (!this.idEspecializacaoSelecionado) return;
    this.service
      .adicionarVeterinarioEspecializacao(
        this.idEspecializacaoSelecionado,
        idVeterinario,
      )
      .subscribe({
        next: () => {
          if (this.idEspecializacaoSelecionado)
            this.verDetalhesEspecializacao(this.idEspecializacaoSelecionado);
          this.limparEdicaoEspecializacao();
        },
      });
  }

  public filtrarConsultas(): void {
    let consultas = this.consultas;
    if (this.filtros.cliente !== null) {
      consultas = consultas.filter((consulta) => {
        return consulta.cliente.id === this.filtros.cliente;
      });
    }
    if (this.filtros.veterinario !== null) {
      consultas = consultas.filter((consulta) => {
        return consulta.veterinario.id === this.filtros.veterinario;
      });
    }
    if (this.filtros.tipoConsulta !== null) {
      consultas = consultas.filter((consulta) => {
        return consulta.tipo.id === this.filtros.tipoConsulta;
      });
    }
    if (this.dataFiltro !== null) {
      const dataEscolhida = this.dataFiltro;
      consultas = consultas.filter((consulta) =>
        this.mesmoDia(new Date(consulta.dataConsulta), dataEscolhida),
      );
    }
    this.consultasFiltradas = this.ordenarPorDataConsulta(consultas);
    this.atualizarResumo();
  }

  /** Mais recentes primeiro, que é a leitura esperada de um histórico. */
  private ordenarPorDataConsulta(
    consultas: ConsultaClinicaDto[],
  ): ConsultaClinicaDto[] {
    return [...consultas].sort(
      (a, b) =>
        new Date(b.dataConsulta).getTime() - new Date(a.dataConsulta).getTime(),
    );
  }

  /** Recorte da aba aplicado sobre o resultado dos filtros. */
  public get consultasVisiveis(): ConsultaClinicaDto[] {
    if (this.abaSelecionada === 'ANDAMENTO') {
      return this.consultasFiltradas.filter(
        (consulta) =>
          consulta.status === StatusConsultaEnum.APROVADA ||
          consulta.status === StatusConsultaEnum.INICIADO,
      );
    }
    if (this.abaSelecionada === 'FINALIZADAS') {
      return this.consultasFiltradas.filter(
        (consulta) => consulta.status === StatusConsultaEnum.FINALIZADO,
      );
    }
    return this.consultasFiltradas;
  }

  public selecionarAba(aba: string): void {
    if (!aba) return;
    this.abaSelecionada = aba;
  }

  public alterarVisibilidadeFiltros(): void {
    this.visibilidadeFiltros = !this.visibilidadeFiltros;
  }

  public alterarVisibilidadeGestao(): void {
    this.visibilidadeGestao = !this.visibilidadeGestao;
  }

  public alterarModoVisualizacao(lista: boolean): void {
    this.modoLista = lista;
  }

  public get filtrosAtivos(): boolean {
    return (
      this.filtros.cliente !== null ||
      this.filtros.veterinario !== null ||
      this.filtros.tipoConsulta !== null ||
      this.dataFiltro !== null
    );
  }

  public limparFiltros(): void {
    this.filtros = { cliente: null, veterinario: null, tipoConsulta: null };
    this.dataFiltro = null;
    this.filtrarConsultas();
  }

  public urlAvatar(idUsuario: number): string {
    return environment.apiUrl + '/arquivos/usuario/' + idUsuario;
  }

  /**
   * Usuários sem foto fazem o endpoint de avatar responder erro; nesses casos o
   * card passa a exibir as iniciais em vez de uma imagem quebrada.
   */
  public marcarAvatarComErro(chave: string): void {
    this.avataresSemImagem.add(chave);
  }

  public avatarComErro(chave: string): boolean {
    return this.avataresSemImagem.has(chave);
  }

  public pegarIniciais(nome: string): string {
    const limpo = (nome ?? '').trim();
    if (!limpo) return '';
    const partes = limpo.split(' ').filter((parte) => parte.length > 0);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  public rotuloFormaPagamento(forma: TipoPagamentoEnum | null): string {
    switch (forma) {
      case TipoPagamentoEnum.PIX:
        return 'Pix';
      case TipoPagamentoEnum.CARTAO:
        return 'Cartão';
      case TipoPagamentoEnum.DINHEIRO:
        return 'Dinheiro';
      default:
        return 'Não informada';
    }
  }

  public verDetalhesCliente(idCliente: number): void {
    this.router.navigate(['gerente/detalhes-clientes', idCliente]);
  }

  public gerarRelatorio(): void {
    this.carregandoRelatorio = true;
    const form: FiltroConsultaForm = {
      idCliente: this.filtros.cliente,
      idVeterinario: this.filtros.veterinario,
      idTipoConsulta: this.filtros.tipoConsulta,
    };
    this.service.gerarRelatorioConsultas(form).subscribe({
      next: (response: Blob) => {
        const file = new Blob([response], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        window.open(fileURL);
        this.carregandoRelatorio = false;
      },
      error: () => {
        this.carregandoRelatorio = false;
      },
    });
  }

  public alterarNovoTipoConsulta(): void {
    this.visibilidadeDialogNovoTipoConsulta =
      !this.visibilidadeDialogNovoTipoConsulta;
    this.limparNovoTipoConsulta();
  }

  public alterarVisibilidadeAdicionarEspecializacao(): void {
    this.visibilidadeDialogAdicionarEspecializacao =
      !this.visibilidadeDialogAdicionarEspecializacao;
  }

  public get novoTipoConsultaValido(): boolean {
    return (
      this.novoTipoConsulta.nome.length > 0 &&
      this.novoTipoConsulta.descricao.length > 0 &&
      this.novoTipoConsulta.valor > 0
    );
  }

  public limparNovoTipoConsulta(): void {
    this.novoTipoConsulta = { nome: '', descricao: '', valor: 0.0 };
  }

  public limparNovaEspecializacao(): void {
    this.novaEspecializacao = { descricao: '' };
  }

  public alterarEdicao(): void {
    this.edicaoHabilitadaTipoConsulta = !this.edicaoHabilitadaTipoConsulta;
    if (!this.edicaoHabilitadaTipoConsulta) {
      this.valoresEdicao.nome = this.detalhesTipoConsulta.nome;
      this.valoresEdicao.descricao = this.detalhesTipoConsulta.descricao;
      this.valoresEdicao.valor = this.detalhesTipoConsulta.valor;
    }
  }

  public verDetalhesConsulta(idConsulta: number): void {
    this.idConsultaSelecionada = idConsulta;
  }

  public verDetalhesTipoConsulta(idTipoConsulta: number): void {
    this.idTipoConsultaSelecionado = idTipoConsulta;
    this.service.buscarDetalhesTipoConsulta(idTipoConsulta).subscribe({
      next: (response: DetalhesTipoConsultaDto) => {
        this.detalhesTipoConsulta = response;
        this.visibilidadeDialogDetalhesTipoConsulta = true;
        this.limparEdicao();
        this.buscarVeterinariosParaAdicionar();
      },
    });
  }

  public verDetalhesEspecializacao(idEspecializacao: number): void {
    this.detalhesEspecializacao = null;
    this.idEspecializacaoSelecionado = idEspecializacao;
    this.service.buscarDetalhesEspecializacoes(idEspecializacao).subscribe({
      next: (response: DetalhesEspecializacaoDto) => {
        this.detalhesEspecializacao = response;
        this.visibilidadeDialogEditarEspecializacao = true;
        this.limparEdicaoEspecializacao();
      },
    });
  }

  public limparEdicaoEspecializacao(): void {
    this.especializacaoEdicao = {
      descricao: this.detalhesEspecializacao?.nome || '',
    };
  }

  public buscarVeterinariosParaAdicionar(): void {
    if (!this.idTipoConsultaSelecionado) return;
    this.service
      .buscarVeterinariosAdicionar(this.idTipoConsultaSelecionado)
      .subscribe({
        next: (response: VeterinarioEspecializacoesDto[]) => {
          this.veterinariosAdicionar = response;
        },
      });
  }

  public editarInformacoesTipoConsulta(): void {
    if (!this.idTipoConsultaSelecionado) return;
    this.service
      .editarInformacoesTipoConsulta(
        this.valoresEdicao,
        this.idTipoConsultaSelecionado,
      )
      .subscribe({
        next: () => {
          this.edicaoHabilitadaTipoConsulta = false;
          this.toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Tipo de consulta editado com sucesso!',
          });
          this.buscarTiposConsulta();
          this.detalhesTipoConsulta.nome = this.valoresEdicao.nome;
          this.detalhesTipoConsulta.descricao = this.valoresEdicao.descricao;
          this.detalhesTipoConsulta.valor = this.valoresEdicao.valor;
        },
      });
  }

  public registrarNovoTipoConsulta(): void {
    this.service.adicionarNovoTipoConsulta(this.novoTipoConsulta).subscribe({
      next: () => {
        this.edicaoHabilitadaTipoConsulta = false;
        this.toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Tipo de consulta cadastrado com sucesso!',
        });
        this.alterarNovoTipoConsulta();
        this.buscarTiposConsulta();
      },
    });
  }

  public adicionarVeterinarioTipoConsulta(idVeterinario: number): void {
    if (!this.idTipoConsultaSelecionado) return;
    this.service
      .adicionarNovoVeterinarioTipoConsulta(
        idVeterinario,
        this.idTipoConsultaSelecionado,
      )
      .subscribe({
        next: () => {
          this.toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Veterinário adicionado ao tipo de consulta com sucesso!',
          });
          if (this.idTipoConsultaSelecionado)
            this.verDetalhesTipoConsulta(this.idTipoConsultaSelecionado);
        },
      });
  }

  public removerVeterinarioTipoConsulta(idVeterinario: number): void {
    if (!this.idTipoConsultaSelecionado) return;
    this.service
      .removerVeterinarioTipoConsulta(
        idVeterinario,
        this.idTipoConsultaSelecionado,
      )
      .subscribe({
        next: () => {
          this.toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Veterinário removido do tipo de consulta com sucesso!',
          });
          if (this.idTipoConsultaSelecionado)
            this.verDetalhesTipoConsulta(this.idTipoConsultaSelecionado);
        },
      });
  }

  public limparEdicao(): void {
    this.valoresEdicao = {
      nome: this.detalhesTipoConsulta.nome,
      descricao: this.detalhesTipoConsulta.descricao,
      valor: this.detalhesTipoConsulta.valor,
    };
  }

  public adicionarEspecializacao(): void {
    if (
      this.novaEspecializacao.descricao === '' ||
      this.novaEspecializacao.descricao.trim() === ''
    )
      return;
    this.service
      .adicionarNovaEspecializacao(this.novaEspecializacao)
      .subscribe({
        next: () => {
          this.limparNovaEspecializacao();
          this.alterarVisibilidadeAdicionarEspecializacao();
          this.buscarEspecializacoes();
          this.toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Especialização cadastrada com sucesso!',
          });
        },
      });
  }

  public editarInformacoesEspecializacoes(): void {
    if (!this.idEspecializacaoSelecionado) return;
    this.service
      .editarInformacoesEspecializacao(
        this.especializacaoEdicao,
        this.idEspecializacaoSelecionado,
      )
      .subscribe({
        next: () => {
          this.edicaoHabilitadaEspecializacao = false;
          this.visibilidadeDialogEditarEspecializacao = false;
          this.toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Especialização editada com sucesso!',
          });
          this.buscarEspecializacoes();
        },
        error: () => {
          this.edicaoHabilitadaEspecializacao = false;
          this.visibilidadeDialogEditarEspecializacao = false;
        }
      });
  }

  public alterarEdicaoEspecializacao(): void {
    this.edicaoHabilitadaEspecializacao = !this.edicaoHabilitadaEspecializacao;
    if (!this.edicaoHabilitadaEspecializacao) {
      this.limparEdicaoEspecializacao();
    }
  }

  public confirmarExclusaoEspecializacao(event: Event): void {
    if (!this.idEspecializacaoSelecionado) return;
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Tem certeza que deseja excluir esta especialização?',
      header: 'Confirmar Exclusão',
      icon: 'fa fa-exclamation-triangle',
      acceptLabel: 'Sim, excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.excluirEspecializacao();
      },
    });
  }

  private excluirEspecializacao(): void {
    if (!this.idEspecializacaoSelecionado) return;
    this.service
      .excluirEspecializacao(this.idEspecializacaoSelecionado)
      .subscribe({
        next: () => {
          this.visibilidadeDialogEditarEspecializacao = false;
          this.toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Especialização excluída com sucesso!',
          });
          this.buscarEspecializacoes();
        },
        error: () => {
          this.toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Não foi possível excluir a especialização.',
          });
        },
      });
  }

  public confirmarExclusaoTipoConsulta(event: Event): void {
    if (!this.idTipoConsultaSelecionado) return;
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Tem certeza que deseja excluir este tipo de consulta?',
      header: 'Confirmar Exclusão',
      icon: 'fa fa-exclamation-triangle',
      acceptLabel: 'Sim, excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.excluirTipoConsulta();
      },
    });
  }

  private excluirTipoConsulta(): void {
    if (!this.idTipoConsultaSelecionado) return;
    this.service
      .excluirTipoConsulta(this.idTipoConsultaSelecionado)
      .subscribe({
        next: () => {
          this.visibilidadeDialogDetalhesTipoConsulta = false;
          this.toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Tipo de consulta excluído com sucesso!',
          });
          this.buscarTiposConsulta();
        },
        error: () => {
          this.toast.add({
            severity: 'error',
            summary: 'Erro',
            detail:
              'Não foi possível excluir o tipo de consulta. Verifique se não existem consultas vinculadas.',
          });
        },
      });
  }
}
