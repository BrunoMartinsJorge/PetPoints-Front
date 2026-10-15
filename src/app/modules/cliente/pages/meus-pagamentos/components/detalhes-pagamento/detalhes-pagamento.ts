import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import type { OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { PrimeNGModule } from '../../../../../../shared/modules/prime-ng/prime-ng-module';
import type { PagamentoDetalhadoDto, PagamentoPixDto, PagamentosDto } from '../../models/PagamentosDto';
import type { MinhasConsultasDto } from '../../../minhas-consultas/models/MinhasConsultasDto';
import { BagStatusConsulta } from '../../../../../../shared/components/bag-status-consulta/bag-status-consulta';
import { BagStatusPagamento } from '../../../../../../shared/components/bag-status-pagamento/bag-status-pagamento';
import { Imagem } from '../../../../../../shared/components/imagem/imagem';
import { MeusPagamentosService } from '../../service/meus-pagamentos-service';
import { MinhasConsultasService } from '../../../minhas-consultas/services/minhas-consultas-service';
import { Router } from '@angular/router';
import {
  TipoPagamentoEnum,
  TipoPagamentoOpcoes,
} from '../../../../../../shared/models/enums/TipoPagamentoEnum';
import { StatusPagamentoEnum } from '../../../../../../shared/models/enums/StatusPagamentoEnum';
import { MessageService } from 'primeng/api';
import { Subscription, interval, switchMap, takeWhile } from 'rxjs';
import { urlArquivo } from '../../../../../../shared/utils/imagem-url';

@Component({
  selector: 'app-detalhes-pagamento',
  imports: [PrimeNGModule, BagStatusConsulta, BagStatusPagamento, Imagem],
  templateUrl: './detalhes-pagamento.html',
  styleUrl: './detalhes-pagamento.scss',
})
export class DetalhesPagamento implements OnChanges, OnDestroy {
  @Input() public visibilidade = false;
  @Input() public pagamentoSelecionado: PagamentosDto | null = null;

  @Output() visibilidadeChange = new EventEmitter<boolean>();
  @Output() alteracoesEfetuadas = new EventEmitter<void>();

  public readonly formasPagamento = TipoPagamentoOpcoes;

  private readonly service = inject(MeusPagamentosService);
  private readonly consultasService = inject(MinhasConsultasService);
  private readonly router = inject(Router);
  private readonly toast = inject(MessageService);

  public novaFormaPagamento: TipoPagamentoEnum | undefined;
  public alterandoFormaPagamento = false;

  public pixInfo: PagamentoPixDto | null = null;
  public carregandoPix = false;
  public pixCopiado = false;
  private pollingSubscription: Subscription | null = null;

  public carregandoInformacoesConsultaPagamento = false;
  public consultaPagamento: MinhasConsultasDto | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pagamentoSelecionado'] && this.pagamentoSelecionado) {
      this.novaFormaPagamento = this.pagamentoSelecionado.tipoPagamento;
      this.buscarInformacoesConsultaPagamento();
      this.pixInfo = null;
      this.pararPolling();
      if (this.pagamentoSelecionado.tipoPagamento === TipoPagamentoEnum.PIX && !this.pagamentoAprovado) {
        this.buscarDetalhesPix();
      }
    }
  }

  public fecharDialog(): void {
    this.pararPolling();
    this.visibilidade = false;
    this.visibilidadeChange.emit(false);
  }

  private buscarInformacoesConsultaPagamento(): void {
    if (!this.pagamentoSelecionado) return;
    this.consultaPagamento = null;
    this.carregandoInformacoesConsultaPagamento = true;
    console.log(this.pagamentoSelecionado);
    this.service
      .buscarConsultaPagamento(this.pagamentoSelecionado.idConsulta)
      .subscribe({
        next: (response: MinhasConsultasDto) => {
          this.consultaPagamento = response;
          this.carregandoInformacoesConsultaPagamento = false;
        },
        error: () => (this.carregandoInformacoesConsultaPagamento = false),
      });
  }

  ngOnDestroy(): void {
    this.pararPolling();
  }

  public get pagamentoPix(): boolean {
    return this.novaFormaPagamento === TipoPagamentoEnum.PIX;
  }

  private buscarDetalhesPix(): void {
    if (!this.pagamentoSelecionado) return;
    this.carregandoPix = true;
    this.pixInfo = null;
    this.service.buscarPagamentoDetalhado(this.pagamentoSelecionado.id).subscribe({
      next: (response: PagamentoDetalhadoDto) => {
        this.carregandoPix = false;
        if (response.pixPagamento) {
          this.pixInfo = response.pixPagamento;
          if (response.statusPagamento === StatusPagamentoEnum.APROVADO) {
            this.pagamentoSelecionado!.statusPagamento = StatusPagamentoEnum.APROVADO;
          } else {
            this.iniciarPollingStatus();
          }
        }
      },
      error: () => {
        this.carregandoPix = false;
      },
    });
  }

  private iniciarPollingStatus(): void {
    this.pararPolling();
    if (!this.pagamentoSelecionado) return;
    const idPagamento = this.pagamentoSelecionado.id;
    this.pollingSubscription = interval(5000)
      .pipe(
        switchMap(() => this.service.buscarPagamentoDetalhado(idPagamento)),
        takeWhile(
          (response) =>
            response.statusPagamento !== StatusPagamentoEnum.APROVADO &&
            response.statusPagamento !== StatusPagamentoEnum.CANCELADO &&
            response.statusPagamento !== StatusPagamentoEnum.RECUSADO,
          true,
        ),
      )
      .subscribe({
        next: (response: PagamentoDetalhadoDto) => {
          if (response.statusPagamento === StatusPagamentoEnum.APROVADO) {
            this.pagamentoSelecionado!.statusPagamento = StatusPagamentoEnum.APROVADO;
            this.pararPolling();
            this.alteracoesEfetuadas.emit();
            this.toast.add({
              severity: 'success',
              summary: 'Pagamento Confirmado!',
              detail: 'Seu pagamento via PIX foi aprovado com sucesso!',
            });
          } else if (
            response.statusPagamento === StatusPagamentoEnum.CANCELADO ||
            response.statusPagamento === StatusPagamentoEnum.RECUSADO
          ) {
            this.pagamentoSelecionado!.statusPagamento = response.statusPagamento;
            this.pararPolling();
            this.alteracoesEfetuadas.emit();
          }
          if (response.pixPagamento) {
            this.pixInfo = response.pixPagamento;
          }
        },
      });
  }

  private pararPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  public copiarCodigoPix(): void {
    if (!this.pixInfo) return;
    const texto = this.pixInfo.qrCodeCopiaECola || this.pixInfo.urlPagamento;
    if (!texto) return;
    navigator.clipboard.writeText(texto).then(() => {
      this.pixCopiado = true;
      this.toast.add({
        severity: 'info',
        summary: 'Copiado!',
        detail: 'Código PIX copiado para a área de transferência.',
      });
      setTimeout(() => (this.pixCopiado = false), 3000);
    });
  }

  public get pagamentoAprovado(): boolean {
    return (
      this.pagamentoSelecionado?.statusPagamento ===
      StatusPagamentoEnum.APROVADO
    );
  }

  public get pagamentoReprovado(): boolean {
    return (
      this.pagamentoSelecionado?.statusPagamento ===
      StatusPagamentoEnum.REPROVADO
    );
  }

  /** Só o cartão é cobrado pelo site; Pix e dinheiro são acertados na clínica. */
  public get pagamentoCartao(): boolean {
    return this.novaFormaPagamento === TipoPagamentoEnum.CARTAO;
  }

  public get podeAlterarFormaPagamento(): boolean {
    return (
      this.pagamentoSelecionado != null &&
      !this.pagamentoAprovado &&
      this.novaFormaPagamento !== undefined &&
      this.novaFormaPagamento !== this.pagamentoSelecionado.tipoPagamento &&
      !this.alterandoFormaPagamento
    );
  }

  public get imagemPet(): string {
    return urlArquivo(this.consultaPagamento?.imagemPet);
  }

  public acessarConsulta(): void {
    if (!this.consultaPagamento) return;
    this.consultasService.idConsultaSelecionada = this.consultaPagamento.id;
    this.consultasService.acessoPorPetSelecionado = true;
    this.fecharDialog();
    this.router.navigate([`/cliente/minhas-consultas`]);
  }

  public iconePagamento(tipoPagamento: TipoPagamentoEnum | undefined): string {
    if (tipoPagamento === undefined) return '';
    if (tipoPagamento === TipoPagamentoEnum.PIX)
      return 'fa fas fas fas fa-qrcode';
    else if (tipoPagamento === TipoPagamentoEnum.DINHEIRO)
      return 'fa fas fa-money-bill';
    else return 'fa fas fas fa-money-check';
  }

  public alterarFormaPagamento(): void {
    if (!this.pagamentoSelecionado || !this.podeAlterarFormaPagamento) return;
    this.alterandoFormaPagamento = true;
    this.service
      .alterarFormaPagamento(
        this.pagamentoSelecionado.id,
        this.novaFormaPagamento as TipoPagamentoEnum,
      )
      .subscribe({
        next: () => {
          this.alterandoFormaPagamento = false;
          this.alteracoesEfetuadas.emit();
          this.fecharDialog();
          this.toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Forma de pagamento alterada com sucesso!',
          });
        },
        error: () => (this.alterandoFormaPagamento = false),
      });
  }

  public realizarPagamento(): void {
    if (!this.pagamentoSelecionado || this.pagamentoAprovado) return;
    const idPagamentoSelecionado = this.pagamentoSelecionado.id;
    this.service.iniciarSecaoPagamento(idPagamentoSelecionado).subscribe({
      next: (response) => {
        window.location.href = response.checkoutUrl;
      },
    });
  }
}
