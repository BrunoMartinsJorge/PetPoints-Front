import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RatingModule } from 'primeng/rating';
import { MessageService } from 'primeng/api';
import type { FileSelectEvent } from 'primeng/fileupload';
import { PrimeNGModule } from '../../../../../../shared/modules/prime-ng/prime-ng-module';
import { BagStatusConsulta } from '../../../../../../shared/components/bag-status-consulta/bag-status-consulta';
import { StatusConsultaEnum } from '../../../../../../shared/models/enums/StatusConsultaEnum';
import { StatusPagamentoEnum } from '../../../../../../shared/models/enums/StatusPagamentoEnum';
import { TipoPagamentoEnum } from '../../../../../../shared/models/enums/TipoPagamentoEnum';
import { TipoPagamentoOpcoes } from '../../../../../../shared/models/enums/TipoPagamentoEnum';
import { MinhasConsultasService } from '../../services/minhas-consultas-service';
import type { MinhasConsultasDto } from '../../models/MinhasConsultasDto';
import type { DetalhesConsultaSelecionadaDto } from '../../models/DetalhesConsultaSelecionadaDto';
import type { PagamentoDto } from '../../models/PagamentoDto';
import type { AvaliacaoConsultaDto } from '../../models/AvaliacaoConsultaDto';
import type { AvaliacaoConsultaForm } from '../../form/AvaliacaoConsultaForm';
import { Imagem } from '../../../../../../shared/components/imagem/imagem';
import { urlArquivo } from '../../../../../../shared/utils/imagem-url';
import { MeusPagamentosService } from '../../../meus-pagamentos/service/meus-pagamentos-service';

@Component({
  selector: 'app-dialog-detalhes-consulta',
  imports: [
    PrimeNGModule,
    FormsModule,
    RatingModule,
    BagStatusConsulta,
    Imagem,
  ],
  templateUrl: './dialog-detalhes-consulta.html',
  styleUrl: './dialog-detalhes-consulta.scss',
})
export class DialogDetalhesConsulta {
  public urlImagem(uuid: string | null | undefined): string {
    return urlArquivo(uuid);
  }

  private readonly service = inject(MinhasConsultasService);
  private readonly toast = inject(MessageService);
  private readonly pagamentoService = inject(MeusPagamentosService);

  @Input() consulta: MinhasConsultasDto | null = null;

  @Input() set visible(value: boolean) {
    this._visible = value;
    if (value) this.aoAbrir();
  }
  get visible(): boolean {
    return this._visible;
  }
  private _visible = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() atualizado = new EventEmitter<void>();

  public readonly formasPagamento = TipoPagamentoOpcoes;

  public detalhes: DetalhesConsultaSelecionadaDto | null = null;
  public pagamento: PagamentoDto | null = null;
  private formaPagamentoAtual: TipoPagamentoEnum | null = null;

  public avaliacao = { pontuacao: 0, observacoes: '' };
  public jaAvaliado = false;

  public novoComprovante: File | null = null;

  public get getFormaPagamentoAtual(): TipoPagamentoEnum | null {
    return this.formaPagamentoAtual;
  }

  public get consultaPodeSerAvaliada(): boolean {
    return this.consulta?.statusConsulta === StatusConsultaEnum.FINALIZADO;
  }

  public get possuiMotivosCancelamentoIndeferimento(): boolean {
    if (!this.consulta) return false;
    return (
      this.consulta.statusConsulta === StatusConsultaEnum.REPROVADA ||
      this.consulta.statusConsulta === StatusConsultaEnum.CANCELADO
    );
  }

  public get podeAlterarFormaPagamento(): boolean {
    if (!this.pagamento) return false;
    return (
      this.pagamento.statusPagamento === StatusPagamentoEnum.REPROVADO ||
      this.pagamento.statusPagamento === StatusPagamentoEnum.PENDENTE
    );
  }

  private aoAbrir(): void {
    if (!this.consulta) return;
    this.resetar();
    this.carregarDetalhes();
  }

  private carregarDetalhes(): void {
    if (!this.consulta) return;
    this.service.buscarDetalhesConsulta(this.consulta.id).subscribe({
      next: (detalhes) => {
        this.detalhes = detalhes;
        this.buscarPagamento();
        this.buscarAvaliacao();
      },
    });
  }

  private buscarPagamento(): void {
    if (!this.consulta) return;
    this.pagamento = null;
    this.formaPagamentoAtual = null;
    this.service.buscarPagamentoPorConsulta(this.consulta.id).subscribe({
      next: (pagamento) => {
        this.pagamento = pagamento;
        if (pagamento != null)
          this.formaPagamentoAtual = pagamento.tipoPagamento;
      },
    });
  }

  private buscarAvaliacao(): void {
    if (!this.consulta) return;
    this.service.buscarAvaliacaoConsulta(this.consulta.id).subscribe({
      next: (response: AvaliacaoConsultaDto) => {
        if (response.pontuacao) {
          this.avaliacao.pontuacao = response.pontuacao;
          this.avaliacao.observacoes = response.observacoes;
          this.jaAvaliado = true;
        }
      },
    });
  }

  public carregarArquivo(event: FileSelectEvent): void {
    const file = event.files[0];
    if (file) this.novoComprovante = file;
  }

  public registrarNovoComprovante(): void {
    if (!this.consulta || !this.novoComprovante) return;
    this.service
      .registrarComprovante(this.consulta.id, this.novoComprovante)
      .subscribe({
        next: () => {
          this.toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Comprovante registrado com sucesso!',
          });
          this.novoComprovante = null;
          this.buscarPagamento();
          this.atualizado.emit();
        },
      });
  }

  public copiarLinkQRCode(): void {
    if (
      !this.pagamento ||
      !this.pagamento.pixPagamento ||
      this.pagamento.tipoPagamento != TipoPagamentoEnum.PIX
    )
      return;
    navigator.clipboard.writeText(this.pagamento.pixPagamento.urlPagamento);
    this.toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Link copiado com sucesso!',
    });
  }

  public alterarFormaPagamento(): void {
    if (!this.formaPagamentoAtual || !this.pagamento || !this.consulta) {
      console.log(this.formaPagamentoAtual);
      console.log(this.pagamento);
      console.log(this.consulta);
      
      console.log('Parou no 1');
      return;
    };
    if (this.pagamento.tipoPagamento === this.formaPagamentoAtual) {
      console.log('Parou no 2');
      return;
    }

    this.service
      .alterarFormaPagamentoPorConsulta(
        this.consulta.id,
        this.pagamento.tipoPagamento,
      )
      .subscribe({
        next: () => {
          this.toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Forma de pagamento alterada com sucesso!',
          });
          this.buscarPagamento();
          this.atualizado.emit();
        },
      });
  }

  public avaliarConsulta(): void {
    if (!this.consulta) return;
    const form: AvaliacaoConsultaForm = {
      pontuacao: this.avaliacao.pontuacao,
      observacoes: this.avaliacao.observacoes,
    };
    this.service.enviarAvaliacaoConsulta(form, this.consulta.id).subscribe({
      next: () => {
        this.toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Consulta avaliada com sucesso!',
        });
        this.buscarAvaliacao();
        this.atualizado.emit();
      },
    });
  }

  public onVisibleChange(value: boolean): void {
    this._visible = value;
    this.visibleChange.emit(value);
  }

  public fechar(): void {
    this.resetar();
    this.onVisibleChange(false);
  }

  private resetar(): void {
    this.detalhes = null;
    this.pagamento = null;
    this.formaPagamentoAtual = null;
    this.avaliacao = { pontuacao: 0, observacoes: '' };
    this.jaAvaliado = false;
    this.novoComprovante = null;
  }

  public etapa = 0;

  public get consultaEstaFinalizada(): boolean {
    if (!this.consulta || !this.detalhes) return false;
    if (this.detalhes.finalizadoEm.toLowerCase().includes('não')) return false;
    if (this.consulta.statusConsulta !== StatusConsultaEnum.FINALIZADO)
      return false;
    return true;
  }

  private converterData(data: string): Date {
    const [dataParte, horaParte] = data.split(' - ');

    const [dia, mes, ano] = dataParte.split('/').map(Number);
    const [hora, minuto, segundo] = horaParte.split(':').map(Number);

    return new Date(ano, mes - 1, dia, hora, minuto, segundo);
  }

  public calcularDuracao(inicio: string, fim: string): string {
    const dataInicio = this.converterData(inicio);
    const dataFim = this.converterData(fim);

    const diferencaMs = dataFim.getTime() - dataInicio.getTime();

    if (diferencaMs < 0) {
      return 'Data final inválida';
    }

    const horas = Math.floor(diferencaMs / (1000 * 60 * 60));
    const minutos = Math.floor((diferencaMs % (1000 * 60 * 60)) / (1000 * 60));

    if (horas == 0) return `${minutos} minutos`;

    return `${horas} horas ${minutos} minutos`;
  }

  public get mensagemPontuacao(): string {
    if (this.jaAvaliado) return 'Consulta avaliada';
    if (this.avaliacao.pontuacao === 0) return 'Toque para avaliar';
    const pontuacao =
      this.avaliacao.pontuacao > 5 ? 5 : this.avaliacao.pontuacao;
    switch (pontuacao) {
      case 1:
        return 'Ruim';
      case 2:
        return 'Regular';
      case 3:
        return 'Bom';
      case 4:
        return 'Muito bom';
      case 5:
        return 'Excelente';
    }
    return 'Toque para avaliar';
  }

  public iconePagamento(tipoPagamento: TipoPagamentoEnum): string {
    if (tipoPagamento === TipoPagamentoEnum.PIX)
      return 'fa fas fas fas fa-qrcode';
    else if (tipoPagamento === TipoPagamentoEnum.DINHEIRO)
      return 'fa fas fa-money-bill';
    else return 'fa fas fas fa-money-check';
  }

  public realizarPagamento(): void {
    if (!this.pagamento) return;
    const idPagamentoSelecionado = this.pagamento.id;
    this.pagamentoService.iniciarSecaoPagamento(idPagamentoSelecionado).subscribe({
      next: (response) => {
        window.location.href = response.checkoutUrl;
      },
    });
  }
}
