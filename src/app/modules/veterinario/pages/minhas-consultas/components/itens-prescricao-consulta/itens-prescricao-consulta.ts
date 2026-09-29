import { Component, EventEmitter, inject, Output } from '@angular/core';
import type { OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { PrimeNGModule } from '../../../../../../shared/modules/prime-ng/prime-ng-module';
import type { ProdutoCobrancaDto } from '../../model/ProdutoCobrancaDto';
import type { ItemPrescricaoForm } from '../../form/PrescricaoForm';
import { MinhasConsultasService } from '../../service/minhas-consultas-service';

interface ItemPrescricaoSelecionado {
  idProduto: number;
  nome: string;
  dose: string;
  via: string;
  intervalo: string;
  duracao: string;
}

/**
 * Produtos receitados ao pet na prescrição, junto do modo de utilização
 * (dose, via, intervalo e duração) que será impresso na receita.
 */
@Component({
  selector: 'app-itens-prescricao-consulta',
  imports: [PrimeNGModule],
  templateUrl: './itens-prescricao-consulta.html',
  styleUrl: './itens-prescricao-consulta.scss',
})
export class ItensPrescricaoConsulta implements OnInit {
  @Output() public itensAlterados = new EventEmitter<ItemPrescricaoForm[]>();

  private readonly service = inject(MinhasConsultasService);
  private readonly toast = inject(MessageService);

  public produtos: ProdutoCobrancaDto[] = [];
  public itens: ItemPrescricaoSelecionado[] = [];

  public produtoSelecionado: number | null = null;
  public dose = '';
  public via = '';
  public intervalo = '';
  public duracao = '';

  /** Vias de administração mais usadas, com opção de digitar outra. */
  public readonly vias = [
    'Via oral (VO)',
    'Via intravenosa (IV)',
    'Via intramuscular (IM)',
    'Via subcutânea (SC)',
    'Via tópica',
    'Via oftálmica',
    'Via otológica',
  ];

  public ngOnInit(): void {
    this.buscarProdutos();
  }

  private buscarProdutos(): void {
    this.produtos = [];
    this.service.buscarProdutosParaCobranca().subscribe({
      next: (response: ProdutoCobrancaDto[]) => {
        this.produtos = response;
      },
    });
  }

  public get produtosParaSelecao(): (ProdutoCobrancaDto & {
    rotulo: string;
  })[] {
    return this.produtos.map((produto) => ({
      ...produto,
      rotulo: produto.descricao
        ? `${produto.nome} - ${produto.descricao}`
        : produto.nome,
    }));
  }

  public get podeAdicionar(): boolean {
    return this.produtoSelecionado !== null && this.dose.trim().length > 0;
  }

  public adicionarItem(): void {
    const produto = this.produtos.find(
      (item) => item.id === this.produtoSelecionado,
    );
    if (!produto || !this.podeAdicionar) return;

    if (this.itens.some((item) => item.idProduto === produto.id)) {
      this.toast.add({
        severity: 'warn',
        summary: 'Produto já receitado',
        detail: `${produto.nome} já está na prescrição. Remova o item para alterá-lo!`,
      });
      return;
    }

    this.itens.push({
      idProduto: produto.id,
      nome: produto.nome,
      dose: this.dose.trim(),
      via: this.via.trim(),
      intervalo: this.intervalo.trim(),
      duracao: this.duracao.trim(),
    });

    this.limparCampos();
    this.emitirItens();
  }

  public removerItem(idProduto: number): void {
    this.itens = this.itens.filter((item) => item.idProduto !== idProduto);
    this.emitirItens();
  }

  private limparCampos(): void {
    this.produtoSelecionado = null;
    this.dose = '';
    this.via = '';
    this.intervalo = '';
    this.duracao = '';
  }

  private emitirItens(): void {
    this.itensAlterados.emit(
      this.itens.map((item) => ({
        id: item.idProduto,
        dose: item.dose,
        via: item.via,
        intervalo: item.intervalo,
        duracao: item.duracao,
      })),
    );
  }
}
