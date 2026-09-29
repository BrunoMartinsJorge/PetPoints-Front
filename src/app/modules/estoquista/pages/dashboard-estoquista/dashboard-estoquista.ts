import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { DashboardEstoquistaService } from './service/dashboard-estoquista-service';
import { ChartModule } from 'primeng/chart';
import type { HistoricoMovimentacoesMensaisDto } from './model/HistoricoMovimentacoesMensaisDto';
import { PrimeNGModule } from '../../../../shared/modules/prime-ng/prime-ng-module';
import type { ProdutoEstoqueDto } from '../../../../shared/models/ProdutoEstoqueDto';

@Component({
  selector: 'app-dashboard-estoquista',
  imports: [ChartModule, PrimeNGModule],
  templateUrl: './dashboard-estoquista.html',
  styleUrl: './dashboard-estoquista.scss',
})
export class DashboardEstoquista implements OnInit {
  private readonly service = inject(DashboardEstoquistaService);

  private historicoMovimentacoesMensais: HistoricoMovimentacoesMensaisDto[] =
    [];
  public produtosComBaixoEstoque: ProdutoEstoqueDto[] = [];
  public grafico = {
    labels: ['Entradas', 'Saídas'],
    datasets: [
      {
        label: '',
        data: [] as number[],
        backgroundColor: [] as string[],
        borderColor: [] as string[],
        borderWidth: 0,
      },
    ],
  };
  public carregandoProdutos = false;
  public options = {};

  ngOnInit(): void {
    this.buscarMovimentacoesMensais();
    this.buscarProdutosComBaixoEstoque();
  }

  private buscarMovimentacoesMensais(): void {
    this.service.listarMovimentacoesMensaisParaGrafico().subscribe({
      next: (response) => {
        this.historicoMovimentacoesMensais = response;
        this.formatarParaGrafico();
      },
    });
  }

  private formatarParaGrafico(): void {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');
    const textColorSecondary = documentStyle.getPropertyValue(
      '--p-text-muted-color',
    );
    const surfaceBorder = documentStyle.getPropertyValue(
      '--p-content-border-color',
    );

    const chartData = this.agruparLogsPorFiltro();

    this.grafico = {
      labels: chartData.labels,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      datasets: chartData.datasets.map((ds: any, index: number) => ({
        ...ds,
        borderColor: documentStyle.getPropertyValue(
          index === 0
            ? '--p-cyan-500'
            : index === 1
              ? '--p-red-500'
              : '--p-gray-500',
        ),
      })),
    };

    this.options = {
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      plugins: {
        legend: {
          labels: { color: textColor },
        },
      },
      scales: {
        x: {
          ticks: { color: textColorSecondary },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
          },
        },
        y: {
          beginAtZero: true,
          ticks: { color: textColorSecondary },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
          },
        },
      },
    };
  }

  private agruparLogsPorFiltro(): {
    labels: string[];
    datasets: any[];
  } {
    const mapa: Record<string, Record<string, number>> = {};
    const datasSet = new Set<string>();

    this.historicoMovimentacoesMensais.forEach((log) => {
      const tipo = log.tipoMovimentacao === 'ENTRADA' ? 'Entradas' : 'Saídas';

      const data = new Date(log.dataHora).toLocaleDateString('pt-BR');

      datasSet.add(data);

      if (!mapa[tipo]) {
        mapa[tipo] = {};
      }

      mapa[tipo][data] = (mapa[tipo][data] || 0) + 1;
    });

    const labels = Array.from(datasSet).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );

    const datasets = Object.keys(mapa).map((tipo) => ({
      label: tipo,
      data: labels.map((data) => mapa[tipo][data] || 0),
      fill: false,
      tension: 0.4,
    }));

    return { labels, datasets };
  }

  private buscarProdutosComBaixoEstoque(): void {
    this.produtosComBaixoEstoque = [];
    this.carregandoProdutos = true;
    this.service.listarProdutosComBaixoEstoque().subscribe({
      next: (response: ProdutoEstoqueDto[]) => {
        this.produtosComBaixoEstoque = response;
        this.carregandoProdutos = false;
      },
      error: () => {
        this.carregandoProdutos = false;
      },
    });
  }
}
