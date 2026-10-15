import { Component, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { PrimeNGModule } from '../../../../shared/modules/prime-ng/prime-ng-module';
import { MinhasConsultasService } from './service/minhas-consultas-service';
import { BagStatusConsulta } from '../../../../shared/components/bag-status-consulta/bag-status-consulta';
import { GeneroBag } from '../../../../shared/components/genero-bag/genero-bag';
import { Imagem } from '../../../../shared/components/imagem/imagem';
import { urlArquivo } from '../../../../shared/utils/imagem-url';
import { ConfirmationService } from 'primeng/api';
import type { ConsultaVeterinarioDto } from './model/ConsultaVeterinarioDto';
import type { ConsultaAtualDto } from './model/ConsultaAtualDto';
import { Router } from '@angular/router';
import { ItensCobrancaConsulta } from "./components/itens-cobranca-consulta/itens-cobranca-consulta";
import type { ItemCobrancaForm } from './form/FinalizarConsultaForm';

@Component({
  selector: 'app-minhas-consultas',
  imports: [
    PrimeNGModule,
    BagStatusConsulta,
    GeneroBag,
    ItensCobrancaConsulta,
    Imagem,
  ],
  templateUrl: './minhas-consultas.html',
  styleUrl: './minhas-consultas.scss',
})
export class MinhasConsultas implements OnInit {
  private readonly service = inject(MinhasConsultasService);
  private readonly confirmService = inject(ConfirmationService);
  private readonly router = inject(Router);

  public resumoConsulta = '';
  public itensCobranca: ItemCobrancaForm[] = [];
  public finalizandoConsulta = false;

  public consultasDoDia: ConsultaVeterinarioDto[] = [];
  public carregandoConsultasDia = false;

  public consultaAtual: ConsultaAtualDto | null = null;
  public carregandoConsultaAtual = false;

  public historicoConsultas: ConsultaVeterinarioDto[] = [];
  public carregandoHistoricoConsultas = false;

  public ngOnInit(): void {
    this.buscarConsultasDeHoje();
    this.buscarHistoricoConsultas();
    this.buscarConsultaAtual();
  }

  private buscarConsultasDeHoje(): void {
    this.consultasDoDia = [];
    this.carregandoConsultasDia = true;
    this.service.buscarConsultasDoDia().subscribe({
      next: (response: ConsultaVeterinarioDto[]) => {
        this.consultasDoDia = response;
        this.carregandoConsultasDia = false;
      },
      error: () => (this.carregandoConsultasDia = false),
    });
  }

  private buscarHistoricoConsultas(): void {
    this.historicoConsultas = [];
    this.carregandoHistoricoConsultas = true;
    this.service.buscarHistoricoConsultas().subscribe({
      next: (response: ConsultaVeterinarioDto[]) => {
        this.historicoConsultas = response;
        this.carregandoHistoricoConsultas = false;
      },
      error: () => (this.carregandoHistoricoConsultas = false),
    });
  }

  private buscarConsultaAtual(): void {
    this.consultaAtual = null;
    this.carregandoConsultaAtual = true;
    this.service.buscarConsultaAtual().subscribe({
      next: (response: ConsultaAtualDto) => {
        this.consultaAtual = response;
        this.carregandoConsultaAtual = false;
      },
      error: () => (this.carregandoConsultaAtual = false),
    });
  }

  public selecionarConsulta(consulta: ConsultaVeterinarioDto): void {
    this.router.navigate(['/veterinario/detalhes-consulta', consulta.id])
  }

  public urlImagem(uuid: string | null | undefined): string {
    return urlArquivo(uuid);
  }

  public finalizarConsulta(): void {
    this.resumoConsulta = '';
    this.itensCobranca = [];
    this.confirmService.confirm({
      header: 'Finalizar Consulta',
      acceptVisible: false,
      rejectVisible: false,
    });
  }

  public enviarFinalizarConsulta(): void {
    if (
      !this.consultaAtual ||
      this.resumoConsulta.trim().length == 0 ||
      this.finalizandoConsulta
    )
      return;
    this.finalizandoConsulta = true;
    this.service.finalizarConsulta(this.consultaAtual.id, {
      resumo: this.resumoConsulta,
      itens: this.itensCobranca,
    }).subscribe({
      next: () => {
        this.confirmService.close();
        this.resumoConsulta = "";
        this.itensCobranca = [];
        this.finalizandoConsulta = false;
        this.buscarConsultasDeHoje();
        this.buscarConsultaAtual();
        this.buscarHistoricoConsultas();
      },
      error: () => {
        this.finalizandoConsulta = false;
        this.confirmService.close();
      }
    });
  }
}
