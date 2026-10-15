import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { PrimeNGModule } from '../../../../shared/modules/prime-ng/prime-ng-module';
import type { FiltrosProdutoForm } from './form/FiltrosProdutoForm';
import type { ProdutoDto } from './model/ProdutoDto';
import { ProdutosEstoqueService } from './service/produtos-estoque-service';
import { TipoProdutoOpcoes } from '../../../../shared/models/enums/TipoProdutoEnum';
import type { OptionSelect } from '../../../../shared/models/OptionSelect';
import { InputNumberModule } from 'primeng/inputnumber';
import { BagTipoProduto } from '../../../../shared/components/bag-tipo-produto/bag-tipo-produto';

@Component({
  selector: 'app-produtos-estoque',
  imports: [PrimeNGModule, InputNumberModule, BagTipoProduto],
  templateUrl: './produtos-estoque.html',
  styleUrl: './produtos-estoque.scss',
})
export class ProdutosEstoque implements OnInit {
  private readonly service = inject(ProdutosEstoqueService);

  private produtos: ProdutoDto[] = [];
  public produtosFiltrados: ProdutoDto[] = [];
  public carregandoProdutos = false;

  public produtoSelecionado: ProdutoDto | null = null;
  public visibilidadeEditarProduto = false;

  public readonly opcoesTipoProduto: OptionSelect[] = TipoProdutoOpcoes;
  public filtros: FiltrosProdutoForm = {
    nome: '',
    tipoProduto: '',
    precoMin: null,
    precoMax: null,
  };

  ngOnInit(): void {
    this.buscarProdutos();
  }

  private buscarProdutos(): void {
    this.carregandoProdutos = true;
    this.service.listarProduto().subscribe({
      next: (produtos) => {
        this.produtos = produtos;
        this.produtosFiltrados = produtos;
        this.carregandoProdutos = false;
      },
      error: () => {
        this.carregandoProdutos = false;
      },
    });
  }

  public filtrarProdutos(): void {
    let produtos = this.produtos;
    if (this.filtros.nome.trim() !== '')
      produtos = produtos.filter((p) =>
        p.nome.toLowerCase().includes(this.filtros.nome.toLowerCase()),
      );
    if (this.filtros.precoMin !== null) {
      produtos = produtos.filter(
        (p) => p.valorUnitario >= this.filtros.precoMin!,
      );
    }
    if (this.filtros.precoMax !== null) {
      produtos = produtos.filter(
        (p) => p.valorUnitario <= this.filtros.precoMax!,
      );
    }
    if (this.filtros.tipoProduto !== '')
      produtos = produtos.filter((p) => p.tipo === this.filtros.tipoProduto);
    this.produtosFiltrados = produtos;
  }

  public limparFiltros(): void {
    this.filtros = {
      nome: '',
      tipoProduto: '',
      precoMin: null,
      precoMax: null,
    };
    this.filtrarProdutos();
  }

  public gerarRelatorio(): void {
    this.service.gerarRelatorio(this.filtros).subscribe({
      next: (response: Blob) => {
        const file = new Blob([response], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        window.open(fileURL);
      },
    });
  }
}
