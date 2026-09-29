import { Component, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { PrimeNGModule } from '../../../../../../shared/modules/prime-ng/prime-ng-module';
import { ActivatedRoute } from '@angular/router';
import type { InformacoesConsultaSelecionadaDto } from './model/InformacoesConsultaSelecionadaDto';
import { StatusConsultaEnum } from '../../../../../../shared/models/enums/StatusConsultaEnum';
import { GeneroBag } from '../../../../../../shared/components/genero-bag/genero-bag';
import { TipoPetBag } from '../../../../../../shared/components/tipo-pet-bag/tipo-pet-bag';
import { Imagem } from '../../../../../../shared/components/imagem/imagem';
import { RatingModule } from 'primeng/rating';
import { BagStatusConsulta } from '../../../../../../shared/components/bag-status-consulta/bag-status-consulta';
import { MinhasConsultasService } from '../../service/minhas-consultas-service';
import type { ButtonSeverity } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ItensCobrancaConsulta } from '../../components/itens-cobranca-consulta/itens-cobranca-consulta';
import type { ItemCobrancaForm } from '../../form/FinalizarConsultaForm';
import type { ItemPrescricaoForm } from '../../form/PrescricaoForm';
import { ItensPrescricaoConsulta } from '../../components/itens-prescricao-consulta/itens-prescricao-consulta';
import { urlArquivo } from '../../../../../../shared/utils/imagem-url';

@Component({
  selector: 'app-detalhes-consulta',
  imports: [
    PrimeNGModule,
    GeneroBag,
    TipoPetBag,
    Imagem,
    RatingModule,
    BagStatusConsulta,
    ItensCobrancaConsulta,
    ItensPrescricaoConsulta,
  ],
  templateUrl: './detalhes-consulta.html',
  styleUrl: './detalhes-consulta.scss',
})
export class DetalhesConsulta implements OnInit {
  private readonly router = inject(ActivatedRoute);
  private readonly service = inject(MinhasConsultasService);
  private readonly toast = inject(MessageService);

  public informacoesConsulta: InformacoesConsultaSelecionadaDto | null = null;
  private idConsultaSelecionada: number | null = null;
  public carregandoInformacoesConsulta = true;

  public habilitarBotao = true;
  public visibilidadeFinalizarConsulta = false;
  public resumoConsulta = '';

  public itensCobranca: ItemCobrancaForm[] = [];
  public finalizandoConsulta = false;

  public visibilidadePrescricao = false;
  public diagnosticoPrescricao = '';
  public orientacoesPrescricao = '';
  public dataRetornoPrescricao: Date | null = null;
  public itensPrescricao: ItemPrescricaoForm[] = [];
  public gerandoPrescricao = false;

  public ngOnInit(): void {
    this.pegarIdConsulta();
  }

  private pegarIdConsulta(): void {
    this.idConsultaSelecionada = null;
    this.router.params.subscribe((params) => {
      this.idConsultaSelecionada = params['id'];
    });
    if (this.idConsultaSelecionada != null)
      this.buscarInformacoesConsultaSelecionada();
  }

  public buscarInformacoesConsultaSelecionada(): void {
    if (this.idConsultaSelecionada === null) return;
    this.carregandoInformacoesConsulta = true;
    this.service
      .buscarInformacoesConsulta(this.idConsultaSelecionada)
      .subscribe({
        next: (response: InformacoesConsultaSelecionadaDto) => {
          this.informacoesConsulta = response;
          this.carregandoInformacoesConsulta = false;
          this.habilitarBotao =
            response.status == StatusConsultaEnum.APROVADA ||
            response.status == StatusConsultaEnum.INICIADO;
        },
        error: () => (this.carregandoInformacoesConsulta = false),
      });
  }

  private mesmaData(data: Date | string): boolean {
    const dataConsulta = new Date(data);
    const dataAtual = new Date();

    return (
      dataConsulta.getDate() === dataAtual.getDate() &&
      dataConsulta.getMonth() === dataAtual.getMonth() &&
      dataConsulta.getFullYear() === dataAtual.getFullYear()
    );
  }

  public get getTextoBtn(): string {
    if (this.informacoesConsulta == null) return '';
    const status = this.informacoesConsulta.status;
    if (status == StatusConsultaEnum.APROVADA) return 'Iniciar Consulta';
    if (status == StatusConsultaEnum.INICIADO) return 'Finalizar Consulta';
    return 'Nenhuma Ação para a Consulta';
  }

  public get getTipoBtn(): ButtonSeverity {
    if (this.informacoesConsulta == null) return 'info';
    const status = this.informacoesConsulta.status;
    if (status == StatusConsultaEnum.APROVADA) return 'success';
    if (status == StatusConsultaEnum.INICIADO) return 'danger';
    return 'info';
  }

  public get getImagemPet(): string {
    if (this.informacoesConsulta == null) return '';
    return urlArquivo(this.informacoesConsulta.pet.imagem);
  }

  public get getImagemCliente(): string {
    if (this.informacoesConsulta == null) return '';
    return urlArquivo(this.informacoesConsulta.cliente.imagem);
  }

  public iniciarOuFinalizarConsulta(): void {
    if (!this.informacoesConsulta || !this.idConsultaSelecionada) return;
    if (this.informacoesConsulta.status == StatusConsultaEnum.APROVADA) {
      this.service.iniciarConsulta(this.idConsultaSelecionada).subscribe({
        next: () => {
          this.toast.add({
            severity: 'success',
            summary: 'Iniciada',
            detail: 'A consulta foi iniciada!',
          });
          this.buscarInformacoesConsultaSelecionada();
          this.visibilidadeFinalizarConsulta = false;
          this.resumoConsulta = '';
        },
      });
    } else {
      this.abrirDialogFinalizarConsulta();
    }
  }

  private abrirDialogFinalizarConsulta(): void {
    this.visibilidadeFinalizarConsulta = true;
    this.resumoConsulta = '';
    this.itensCobranca = [];
  }

  public fecharDialogFinalizarConsulta(): void {
    this.visibilidadeFinalizarConsulta = false;
    this.itensCobranca = [];
  }

  public get valorConsulta(): number {
    return this.informacoesConsulta?.valorConsulta ?? 0;
  }

  public abrirDialogPrescricao(): void {
    this.visibilidadePrescricao = true;
    this.diagnosticoPrescricao = '';
    this.orientacoesPrescricao = '';
    this.dataRetornoPrescricao = null;
    this.itensPrescricao = [];
  }

  public fecharDialogPrescricao(): void {
    if (this.gerandoPrescricao) return;
    this.visibilidadePrescricao = false;
    this.itensPrescricao = [];
  }

  public get podeGerarPrescricao(): boolean {
    return (
      this.diagnosticoPrescricao.trim().length > 0 && !this.gerandoPrescricao
    );
  }

  /**
   * O backend espera um LocalDateTime, então a data escolhida no calendário é
   * enviada sem fuso horário.
   */
  private converterRetornoParaLocalDateTime(data: Date | null): string | null {
    if (data === null) return null;
    const doisDigitos = (valor: number): string =>
      valor.toString().padStart(2, '0');
    const dia = `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
    const horario = `${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}:00`;
    return `${dia}T${horario}`;
  }

  public gerarPrescricao(): void {
    if (!this.idConsultaSelecionada || !this.podeGerarPrescricao) return;
    this.gerandoPrescricao = true;
    this.service
      .gerarPrescricao({
        idConsulta: Number(this.idConsultaSelecionada),
        diagnostico: this.diagnosticoPrescricao.trim(),
        observacoes: this.orientacoesPrescricao.trim(),
        itens: this.itensPrescricao,
        retorno: this.converterRetornoParaLocalDateTime(
          this.dataRetornoPrescricao,
        ),
      })
      .subscribe({
        next: (response: Blob) => {
          const arquivo = new Blob([response], { type: 'application/pdf' });
          window.open(URL.createObjectURL(arquivo));
          this.toast.add({
            severity: 'success',
            summary: 'Prescrição gerada',
            detail: 'A prescrição da consulta foi gerada!',
          });
          this.gerandoPrescricao = false;
          this.visibilidadePrescricao = false;
          this.itensPrescricao = [];
        },
        error: () => {
          this.gerandoPrescricao = false;
        },
      });
  }

  public enviarFinalizarConsulta(): void {
    if (
      !this.idConsultaSelecionada ||
      this.resumoConsulta.trim().length == 0 ||
      this.finalizandoConsulta
    )
      return;
    this.finalizandoConsulta = true;
    this.service
      .finalizarConsulta(this.idConsultaSelecionada, {
        resumo: this.resumoConsulta,
        itens: this.itensCobranca,
      })
      .subscribe({
        next: () => {
          this.toast.add({
            severity: 'success',
            summary: 'Finalizada',
            detail: 'A consulta foi finalizada!',
          });
          this.buscarInformacoesConsultaSelecionada();
          this.finalizandoConsulta = false;
          this.fecharDialogFinalizarConsulta();
        },
        error: () => {
          this.finalizandoConsulta = false;
          this.visibilidadeFinalizarConsulta = false;
        },
      });
  }
}
