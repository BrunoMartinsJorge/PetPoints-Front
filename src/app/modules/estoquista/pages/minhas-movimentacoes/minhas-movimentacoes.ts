import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { PrimeNGModule } from '../../../../shared/modules/prime-ng/prime-ng-module';
import { MinhasMovimentacoesService } from './service/minhas-movimentacoes-service';
import type { MinhasMovimentacoesDto } from './model/MinhasMovimentacoesDto';
import type { RelatorioMovimentacoesForm } from './form/RelatorioMovimentacoesForm';
import type { ProdutoFiltroDto } from './model/ProdutoFiltroDto';
import { GerarNovaMovimentacao } from './components/gerar-nova-movimentacao/gerar-nova-movimentacao';
import { BagTipoMovimentacao } from "../../../../shared/components/bag-tipo-movimentacao/bag-tipo-movimentacao";

@Component({
  selector: 'app-minhas-movimentacoes',
  imports: [PrimeNGModule, GerarNovaMovimentacao, BagTipoMovimentacao],
  templateUrl: './minhas-movimentacoes.html',
  styleUrl: './minhas-movimentacoes.scss',
})
export class MinhasMovimentacoes implements OnInit {
  private readonly service = inject(MinhasMovimentacoesService);

  private movimentacoes: MinhasMovimentacoesDto[] = [];
  public movimentacoesFiltradas: MinhasMovimentacoesDto[] = [];
  public carregandoMovimentacoes = false;
  public produtos: ProdutoFiltroDto[] = [];

  public visibilidadeNovaMovimentacao = false;

  public filtros: RelatorioMovimentacoesForm = {
    dataInicio: null,
    dataFim: null,
    tipoMovimentacao: '',
    idProduto: null,
  };

  ngOnInit(): void {
    this.listarMinhasMovimentacoes();
    this.buscarProdutosParaFiltro();
  }

  private listarMinhasMovimentacoes(): void {
    this.movimentacoes = [];
    this.movimentacoesFiltradas = [];
    this.carregandoMovimentacoes = true;
    this.service.listarMinhasMovimentacoes().subscribe({
      next: (response) => {
        this.movimentacoes = response;
        this.movimentacoesFiltradas = response;
        this.carregandoMovimentacoes = false;
      },
      error: () => {
        this.carregandoMovimentacoes = false;
      },
    });
  }

  private buscarProdutosParaFiltro(): void {
    this.produtos = [];
    this.service.buscarProdutosParaFiltro().subscribe({
      next: (response) => {
        this.produtos = response;
      },
    });
  }

  public limparFiltros(): void {
    this.filtros = {
      dataInicio: null,
      dataFim: null,
      tipoMovimentacao: '',
      idProduto: null,
    };
    this.filtrarMovimentacoes();
  }

  public filtrarMovimentacoes(): void {
    if (this.filtros.tipoMovimentacao !== '') {
      this.movimentacoesFiltradas = this.movimentacoes.filter(
        (movimentacao) =>
          movimentacao.tipoMovimentacao === this.filtros.tipoMovimentacao,
      );
    } else {
      this.movimentacoesFiltradas = this.movimentacoes;
    }

    if (this.filtros.idProduto !== null) {
      this.movimentacoesFiltradas = this.movimentacoesFiltradas.filter(
        (movimentacao) => movimentacao.produto.id === this.filtros.idProduto,
      );
    }
    if (this.filtros.dataInicio !== null) {
      this.movimentacoesFiltradas = this.movimentacoesFiltradas.filter(
        (movimentacao) =>
          new Date(movimentacao.dataHora).getTime() >=
          new Date(this.filtros.dataInicio!).getTime(),
      );
    }
    if (this.filtros.dataFim !== null) {
      this.movimentacoesFiltradas = this.movimentacoesFiltradas.filter(
        (movimentacao) =>
          new Date(movimentacao.dataHora).getTime() <=
          new Date(this.filtros.dataFim!).getTime(),
      );
    }
  }

  public get existeFiltrosAplicados(): boolean {
    return (this.filtros.dataInicio !== null ||
      this.filtros.dataFim !== null ||
      this.filtros.tipoMovimentacao !== '' ||
      this.filtros.idProduto !== null);
  }

  public gerarRelatorio(): void {
    this.service.gerarRelatorioMinhasMovimentacoes(this.filtros).subscribe({
      next: (res: Blob) => {
        const file = new Blob([res], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        window.open(fileURL);
      },
    });
  }

  public fecharDialogNovaMovimentacao(): void {
    this.visibilidadeNovaMovimentacao = false;
    this.listarMinhasMovimentacoes();
  }
}
