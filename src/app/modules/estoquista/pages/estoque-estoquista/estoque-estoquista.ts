import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { EstoqueEstoquistaService } from './service/estoque-estoquista-service';
import type { CardsEstoqueDto } from './model/CardsEstoqueDto';
import { PrimeNGModule } from '../../../../shared/modules/prime-ng/prime-ng-module';
import { ToggleButtonModule } from 'primeng/togglebutton';
import {
  TipoProdutoEnum,
  TipoProdutoOpcoes,
  TipoProdutoOpcoesFiltro,
} from '../../../../shared/models/enums/TipoProdutoEnum';
import type { OptionSelect } from '../../../../shared/models/OptionSelect';
import type { ProdutoEstoqueDto } from '../../../../shared/models/ProdutoEstoqueDto';
import type { FiltrosProdutosForm } from './forms/FiltrosProdutosForm';
import { Router } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import type { NovoProdutoForm } from './forms/NovoProdutoForm';
import { ConfirmationService, MessageService } from 'primeng/api';
import type { EditarProdutoForm } from './forms/EditarProdutoForm';
import { CardResumo } from '../../../../shared/components/card-resumo/card-resumo';
import { BagTipoProduto } from '../../../../shared/components/bag-tipo-produto/bag-tipo-produto';

@Component({
  selector: 'app-estoque-estoquista',
  imports: [PrimeNGModule, ToggleButtonModule, SkeletonModule, CardResumo, BagTipoProduto],
  templateUrl: './estoque-estoquista.html',
  styleUrl: './estoque-estoquista.scss',
})
export class EstoqueEstoquista implements OnInit {
  private readonly service = inject(EstoqueEstoquistaService);
  private readonly route = inject(Router);
  private readonly toast = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);

  public readonly opcoesTipoProdutoFiltro: OptionSelect[] =
    TipoProdutoOpcoesFiltro;
  public readonly opcoesTipoProduto: OptionSelect[] = TipoProdutoOpcoes;

  public carregandoCards = true;
  public carregandoProdutos = false;
  public carregandoRelatorio = false;

  public cards: CardsEstoqueDto | null = null;
  private produtos: ProdutoEstoqueDto[] = [];
  public produtosFiltrados: ProdutoEstoqueDto[] = [];
  public filtros: FiltrosProdutosForm = {
    nome: '',
    todosOsProdutos: true,
    tipoProduto: '',
    precoMin: null,
    precoMax: null,
  };

  public produtoSelecionado: ProdutoEstoqueDto | null = null;
  public visibilidadeEditarProduto = false;

  public editarProdutoForm!: FormGroup;

  public visibilidadeDialogAdicionarNovoProduto = false;
  public novoProdutoForm!: FormGroup;

  ngOnInit(): void {
    this.buscarInformacoesCards();
    this.listarProdutosEstoque();
    this.novoProdutoForm = this.gerarFormularioNovoProduto();
  }

  private gerarFormularioNovoProduto(): FormGroup {
    return new FormGroup({
      nome: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(255),
      ]),
      descricao: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(255),
      ]),
      quantidade: new FormControl(1, [
        Validators.required,
        Validators.min(1),
        Validators.max(10000),
      ]),
      quantidadeMinima: new FormControl(0, [
        Validators.required,
        Validators.min(0),
        Validators.max(10000),
      ]),
      tipo: new FormControl(TipoProdutoEnum.BRINQUEDO, [Validators.required]),
      valorUnitario: new FormControl(0.0, [
        Validators.required,
        Validators.min(0.1),
        Validators.max(99999.99),
      ]),
    });
  }

  /**
   *
   * @description Busca as informações para os cards do estoque, como valor total, quantidade de produtos e produtos abaixo do estoque.
   */
  private buscarInformacoesCards(): void {
    this.carregandoCards = true;
    this.service.buscarInformacoesCards().subscribe({
      next: (cards) => {
        this.cards = cards;
        this.carregandoCards = false;
      },
      error: () => {
        this.carregandoCards = false;
      },
    });
  }

  /**
   *
   * @description Filtra os produtos em estoque com base nos filtros definidos no formulário de filtros, como nome, tipo, preço mínimo e preço máximo, e se deve mostrar todos os produtos ou apenas os que estão abaixo do estoque mínimo.
   */
  public filtrarProdutos(): void {
    let produtos = this.produtos;
    if (!this.filtros.todosOsProdutos)
      produtos = produtos.filter((p) => p.quantidadeAbaixoEstoque);
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

  /**
   *
   * @description Verifica se existem filtros ativos no formulário de filtros, ou seja, se algum dos campos de filtro foi preenchido ou se a opção de mostrar todos os produtos está desmarcada.
   * @returns {boolean} - Retorna true se existirem filtros ativos, ou seja, se algum dos campos de filtro foi preenchido ou se a opção de mostrar todos os produtos está desmarcada, e false caso contrário.
   */
  public get possuiFiltrosAtivos(): boolean {
    return (
      this.filtros.nome.trim() !== '' ||
      this.filtros.todosOsProdutos ||
      this.filtros.tipoProduto !== '' ||
      this.filtros.precoMin !== null ||
      this.filtros.precoMax !== null
    );
  }

  /**
   *
   * @description Lista os produtos em estoque, com suas informações como id, nome, tipo, descrição, valor unitário, quantidade em estoque e se está abaixo do estoque mínimo.
   */
  private listarProdutosEstoque(): void {
    this.carregandoProdutos = true;
    this.produtos = [];
    this.service.listarProdutosEstoque().subscribe({
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

  /**
   *
   * @description Limpa os filtros do formulário de filtros.
   */
  public limparFiltros(): void {
    this.filtros = {
      nome: '',
      todosOsProdutos: true,
      tipoProduto: '',
      precoMin: null,
      precoMax: null,
    };
    this.filtrarProdutos();
  }

  /**
   *
   * @description Navega para a página de detalhes do produto, passando o id do produto como parâmetro na rota.
   */
  public verDetalhesProduto(idProduto: number): void {
    this.route.navigate(['/estoquista/detalhes-produto', idProduto]);
  }

  /**
   *
   * @description Gera um relatório em PDF dos produtos em estoque, com base nos filtros definidos no formulário de filtros, e o abre em uma nova janela do navegador.
   */
  public gerarRelatorio(): void {
    this.carregandoRelatorio = true;
    this.service.gerarRelatorioProdutos(this.filtros).subscribe({
      next: (res: Blob) => {
        const file = new Blob([res], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        window.open(fileURL);
        this.carregandoRelatorio = false;
      },
      error: () => {
        this.carregandoRelatorio = false;
      },
    });
  }

  public fecharDialogNovoProduto(): void {
    this.visibilidadeDialogAdicionarNovoProduto = false;
    this.limparFormularioNovoProduto();
  }

  public limparFormularioNovoProduto(): void {
    this.novoProdutoForm.reset();
  }

  public registrarNovoProduto(): void {
    if (this.novoProdutoForm.invalid) return;
    const payload: NovoProdutoForm = this.novoProdutoForm.value;
    this.service.registrarNovoProduto(payload).subscribe({
      next: () => {
        this.toast.add({
          severity: 'success',
          summary: 'Registrado',
          detail: `Novo produto ${payload.nome} registrado!`,
        });
        this.buscarInformacoesCards();
        this.listarProdutosEstoque();
        this.fecharDialogNovoProduto();
      },
    });
  }

  public editarProduto(prodtuo: ProdutoEstoqueDto): void {
    this.produtoSelecionado = prodtuo;
    this.visibilidadeEditarProduto = true;
    this.iniciarFormEditarProduto();
  }

private iniciarFormEditarProduto(): void {
    this.editarProdutoForm = new FormGroup({
      nome: new FormControl(
        this.produtoSelecionado != null ?
        this.produtoSelecionado.nome :
        '', [Validators.required]),
      tipo: new FormControl(
        this.produtoSelecionado != null ?
        this.produtoSelecionado.tipo :
        TipoProdutoEnum.BRINQUEDO, [Validators.required]),
      descricao: new FormControl(
        this.produtoSelecionado != null ?
        this.produtoSelecionado.descricao :
        '', [Validators.required]),
      valorUnitario: new FormControl(
        this.produtoSelecionado != null ?
        this.produtoSelecionado.valorUnitario :
        0, [Validators.required]),
      quantidadeAbaixoEstoque: new FormControl(
        this.produtoSelecionado != null ?
        this.produtoSelecionado.quantidadeMinima :
        0, [Validators.required]),
    });
  }

  public enviarEdicaoProduto(): void {
    if (this.editarProdutoForm.invalid || !this.produtoSelecionado) return;
    const payload: EditarProdutoForm = this.editarProdutoForm.value;
    this.service.editarProduto(payload, this.produtoSelecionado.id).subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Produto editado com sucesso!' });
        this.listarProdutosEstoque();
        this.visibilidadeEditarProduto = false;
      },
    });
  }

  public resetarFormularioEditarProduto(): void {
    this.iniciarFormEditarProduto();
  }

  public removerProduto(produto: ProdutoEstoqueDto): void {
    this.confirmation.confirm({
      header: 'Excluir Produto',
      message: `Tem certeza que deseja excluir o produto ${produto.nome}?`,
      acceptButtonProps: {
        label: 'Excluir',
        severity: 'danger',
        outlined: false,
      },
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        outlined: true,
      },
      accept: () => {
        this.service.removerProduto(produto.id).subscribe({
          next: () => {
            this.listarProdutosEstoque();
            this.toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Produto removido com sucesso!' });
          },
        });
      },
    });
  }
}
