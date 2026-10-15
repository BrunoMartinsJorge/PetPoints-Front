import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { GerenteDashboardService } from './service/gerente-dashboard-service';
import { PrimeNGModule } from '../../../../shared/modules/prime-ng/prime-ng-module';
import { ChartModule } from 'primeng/chart';
import type { MovimentacoesGerenteDto } from './model/MovimentacoesGerenteDto';
import type { ConsultasGerenteDto } from './model/ConsultasGerenteDto';
import { BagTipoMovimentacao } from '../../../../shared/components/bag-tipo-movimentacao/bag-tipo-movimentacao';
import { TipoMovimentacaoEnum } from '../../../../shared/models/enums/TipoMovimentacaoEnum';
import { CardResumo } from '../../../../shared/components/card-resumo/card-resumo';

@Component({
  selector: 'app-gerente-dashboard',
  imports: [PrimeNGModule, ChartModule, BagTipoMovimentacao, CardResumo],
  templateUrl: './gerente-dashboard.html',
  styleUrl: './gerente-dashboard.scss',
})
export class GerenteDashboard implements OnInit {
  private readonly service = inject(GerenteDashboardService);
  private acessosMes: {
    data: string;
    quantidade: number;
  }[] = [];
  public grafico = {
    labels: [] as string[],
    datasets: [] as unknown[],
  };
  public opcoesGrafico = {};
  public movimentacoes: MovimentacoesGerenteDto[] = [];
  public consultas: ConsultasGerenteDto[] = [];
  public carregandoMovimentacoes = false;
  public carregandoConsultas = false;
  public dataAtualizacao: Date = new Date();

  /**
   * 
   * @description Quantidade de consultas do dia
   * @returns - number - Quantidade de consultas do dia
   */
  public get qtdConsultas(): number {
    return this.consultas.length;
  }

  /**
   * 
   * @description Quantidade total de movimentações do mês
   * @returns - number - Quantidade total de movimentações do mês
   */
  public get qtdMovimentacoes(): number {
    return this.movimentacoes.length;
  }

  /**
   * 
   * @description Quantidade de movimentações de entrada
   * @returns - number - Quantidade de movimentações de entrada
   */
  public get qtdEntradas(): number {
    return this.movimentacoes.filter(
      (m) => m.tipo === TipoMovimentacaoEnum.ENTRADA,
    ).length;
  }

  /**
   * 
   * @description Quantidade de movimentações de saída
   * @returns - number - Quantidade de movimentações de saída
   */
  public get qtdSaidas(): number {
    return this.movimentacoes.filter(
      (m) => m.tipo === TipoMovimentacaoEnum.SAIDA,
    ).length;
  }

  /**
   * 
   * @description Total de acessos no período
   * @returns - number - Total de acessos no período
   */
  public get totalAcessos(): number {
    return this.acessosMes.reduce(
      (total, mes) => total + (Number(mes.quantidade) || 0),
      0,
    );
  }

  /**
   * 
   * @description Média de acessos por registro do período
   * @returns - number - Média de acessos por registro do período
   */
  public get mediaAcessos(): number {
    if (!this.acessosMes.length) return 0;
    return Math.round(this.totalAcessos / this.acessosMes.length);
  }

  ngOnInit(): void {
    this.recarregar();
  }

  /**
   * 
   * @description Recarrega todos os blocos do dashboard e atualiza o horário
   */
  public recarregar(): void {
    this.dataAtualizacao = new Date();
    this.buscarAcessos();
    this.buscarMovimentacoes();
    this.buscarConsultas();
  }

  private buscarAcessos(): void {
    this.acessosMes = [];
    this.service.buscarAcessosMes().subscribe({
      next: (response: { data: string; quantidade: number }[]) => {
        this.acessosMes = response.sort((a, b) =>
          a.data.charAt(0).localeCompare(b.data.charAt(0)),
        );
        this.gerarGrafico();
      },
    });
  }

  private buscarMovimentacoes(): void {
    this.movimentacoes = [];
    this.carregandoMovimentacoes = true;
    this.service.buscarMovimentacoesMes().subscribe({
      next: (response: MovimentacoesGerenteDto[]) => {
        this.movimentacoes = response;
        this.carregandoMovimentacoes = false;
      },
      error: () => {
        this.carregandoMovimentacoes = false;
      },
    });
  }

  private buscarConsultas(): void {
    this.consultas = [];
    this.carregandoConsultas = true;
    this.service.buscarConsultas().subscribe({
      next: (response: ConsultasGerenteDto[]) => {
        this.consultas = response;
        this.carregandoConsultas = false;
      },
      error: () => {
        this.carregandoConsultas = false;
      },
    });
  }

  private gerarGrafico(): void {
    const documentStyle = getComputedStyle(document.documentElement);

    const textColorSecondary = documentStyle.getPropertyValue(
      '--p-text-muted-color',
    );
    const surfaceBorder = documentStyle.getPropertyValue(
      '--p-content-border-color',
    );
    const corPrimaria =
      documentStyle.getPropertyValue('--color-card-primary').trim() ||
      '#00BC7D';

    this.grafico = {
      labels: this.acessosMes.map((mes) => mes.data ?? '---'),

      datasets: [
        {
          label: 'Acessos',
          data: this.acessosMes.map((mes) => Number(mes.quantidade) || 0),
          borderColor: corPrimaria,
          backgroundColor: 'rgba(0, 188, 125, 0.12)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: this.acessosMes.length === 1 ? 4 : 0,
          pointHoverRadius: 5,
          pointBackgroundColor: corPrimaria,
        },
      ],
    };

    this.opcoesGrafico = {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: false,
        },

        tooltip: {
          callbacks: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-function-return-type
            label: (context: any) => {
              return ` ${context.dataset.label}: ${context.raw}`;
            },
          },
        },
      },

      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
          },

          grid: {
            display: false,
          },
        },

        y: {
          beginAtZero: true,

          ticks: {
            color: textColorSecondary,
            stepSize: 1,
          },

          grid: {
            color: surfaceBorder,
          },
        },
      },
    };
  }
}
