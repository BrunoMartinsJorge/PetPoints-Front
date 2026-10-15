import { Component, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { MeusPagamentosService } from './service/meus-pagamentos-service';
import { PrimeNGModule } from '../../../../shared/modules/prime-ng/prime-ng-module';
import type { PagamentosDto } from './models/PagamentosDto';
import type { CardsPagamentoDto } from './models/CardsPagamentoDto';
import { TipoPagamentoEnum } from '../../../../shared/models/enums/TipoPagamentoEnum';
import { DetalhesPagamento } from './components/detalhes-pagamento/detalhes-pagamento';
import { finalize } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { CardResumo } from '../../../../shared/components/card-resumo/card-resumo';
import { BagStatusPagamento } from '../../../../shared/components/bag-status-pagamento/bag-status-pagamento';

@Component({
  selector: 'app-meus-pagamentos',
  imports: [PrimeNGModule, DetalhesPagamento, CardResumo, BagStatusPagamento],
  templateUrl: './meus-pagamentos.html',
  styleUrl: './meus-pagamentos.scss',
})
export class MeusPagamentos implements OnInit {
  private readonly service = inject(MeusPagamentosService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  public informacoesCards: CardsPagamentoDto = {
    pagamentosEfetuados: 0,
    pagamentosPendentes: 0,
    pagamentosAtrasados: 0,
  };
  public carregandoInformacoesCards = false;

  public pagamentosPendentesAtrasados: PagamentosDto[] = [];
  public carregandoPagamentosPendentesAtrasados = false;

  public pagamentosReprovados: PagamentosDto[] = [];
  public carregandoPagamentosReprovados = false;

  public historicoPagamentos: PagamentosDto[] = [];
  public carregandoHistoricoPagamentos = false;

  public pagamentoSelecionado: PagamentosDto | null = null;
  public visibilidadeDialogDetalhesPagamento = false;

  ngOnInit(): void {
    this.verificarPagamentoPreSelecionadoExiste();
    this.buscarInformacoesCards();
    this.listarPagamentosPendentesAtrasados();
    this.listarPagamentosReprovados();
    const sessionId = this.route.snapshot.paramMap.get('session_id');
    if (!sessionId) {
      this.listarHistoricoPagamentos();
    } else {
      this.buscarPagamentoSessao(sessionId);
    }
  }

  private verificarPagamentoPreSelecionadoExiste(): void {
    if (!this.service.redirecionadoParaPagamento) return;
    const id = this.service.idPagamentoSelecionado;
    if (id === null) return;
    this.service.buscarPagamento(id).subscribe({
      next: (response: PagamentosDto) => {
        this.selecionarPagamento(response);
        this.service.idPagamentoSelecionado = null;
        this.service.redirecionadoParaPagamento = false;
      },
    });
  }

  /**
   *
   * @description Metodo responsável por carregar alterações feitas no componente de a detalhes-pagamento
   */
  public carregarAlteracoes(): void {
    this.buscarInformacoesCards();
    this.listarPagamentosPendentesAtrasados();
    this.listarPagamentosReprovados();
    this.listarHistoricoPagamentos();
  }

  /**
   *
   * @description Metodo responsável por buscar as informacoes dos cards iniciais de pagamento
   */
  private buscarInformacoesCards(): void {
    this.informacoesCards = {
      pagamentosEfetuados: 0,
      pagamentosPendentes: 0,
      pagamentosAtrasados: 0,
    };
    this.carregandoInformacoesCards = true;
    this.service.buscarInformacoesCards().subscribe({
      next: (response: CardsPagamentoDto) => {
        this.informacoesCards = response;
        this.carregandoInformacoesCards = false;
      },
      error: () => (this.carregandoInformacoesCards = false),
    });
  }

  /**
   *
   * @description Metodo responsável por listar os pagamentos com status pendentes ou que estejam atrasados
   */
  private listarPagamentosPendentesAtrasados(): void {
    this.pagamentosPendentesAtrasados = [];
    this.carregandoPagamentosPendentesAtrasados = true;
    this.service.listarPagamentosPendentesAtrasados().subscribe({
      next: (response: PagamentosDto[]) => {
        this.pagamentosPendentesAtrasados = response;
        this.carregandoPagamentosPendentesAtrasados = false;
      },
      error: () => (this.carregandoPagamentosPendentesAtrasados = false),
    });
  }

  /**
   *
   * @description Metodo responsável por listar os pagamentos reprovados
   */
  private listarPagamentosReprovados(): void {
    this.pagamentosPendentesAtrasados = [];
    this.carregandoPagamentosReprovados = true;
    this.service.listarPagamentosReprovados().subscribe({
      next: (response: PagamentosDto[]) => {
        this.pagamentosReprovados = response;
        this.carregandoPagamentosReprovados = false;
      },
      error: () => (this.carregandoPagamentosReprovados = false),
    });
  }

  /**
   *
   * @description Metodo responsável por listar os pagamentos com status finalizado ou enviado
   */
  private listarHistoricoPagamentos(): void {
    this.pagamentosPendentesAtrasados = [];
    this.carregandoHistoricoPagamentos = true;
    this.service.listarHistoricoPagamentos().subscribe({
      next: (response: PagamentosDto[]) => {
        this.historicoPagamentos = response;
        this.carregandoHistoricoPagamentos = false;
      },
      error: () => (this.carregandoHistoricoPagamentos = false),
    });
  }

  private buscarPagamentoSessao(sessionId: string): void {
    this.service
      .verificarStatusPagamento(sessionId)
      .pipe(
        finalize(() =>
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {},
            replaceUrl: true,
          }),
        ),
      )
      .subscribe({
        next: () => {
          this.listarHistoricoPagamentos();
        },
        error: (err) =>
          console.error('Falha ao confirmar retorno da Stripe', err),
      });
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
   * @param pagamento {PagamentosDto} pagamento - Pagamento selecionado
   * @description Metodo responsável por selecionar um pagamento
   */
  public selecionarPagamento(pagamento: PagamentosDto): void {
    this.pagamentoSelecionado = pagamento;
    this.visibilidadeDialogDetalhesPagamento = true;
    console.log(pagamento);
  }
}
