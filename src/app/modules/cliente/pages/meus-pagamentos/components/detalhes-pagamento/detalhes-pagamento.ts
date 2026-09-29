import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import type { OnChanges, SimpleChanges } from '@angular/core';
import { PrimeNGModule } from '../../../../../../shared/modules/prime-ng/prime-ng-module';
import type { PagamentosDto } from '../../models/PagamentosDto';
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
import { urlArquivo } from '../../../../../../shared/utils/imagem-url';

@Component({
  selector: 'app-detalhes-pagamento',
  imports: [PrimeNGModule, BagStatusConsulta, BagStatusPagamento, Imagem],
  templateUrl: './detalhes-pagamento.html',
  styleUrl: './detalhes-pagamento.scss',
})
export class DetalhesPagamento implements OnChanges {
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

  public carregandoInformacoesConsultaPagamento = false;
  public consultaPagamento: MinhasConsultasDto | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pagamentoSelecionado'] && this.pagamentoSelecionado) {
      this.novaFormaPagamento = this.pagamentoSelecionado.tipoPagamento;
      this.buscarInformacoesConsultaPagamento();
    }
  }

  public fecharDialog(): void {
    this.visibilidade = false;
    this.visibilidadeChange.emit(false);
  }

  private buscarInformacoesConsultaPagamento(): void {
    if (!this.pagamentoSelecionado) return;
    this.consultaPagamento = null;
    this.carregandoInformacoesConsultaPagamento = true;
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
