import { Component, Input } from '@angular/core';
import { getTagDataTipoProduto, type TipoProdutoEnum } from '../../models/enums/TipoProdutoEnum';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import type { TagData } from '../../models/TagData';

@Component({
  selector: 'app-bag-tipo-produto',
  imports: [CommonModule, TagModule],
  templateUrl: './bag-tipo-produto.html',
  styleUrl: './bag-tipo-produto.scss',
})
export class BagTipoProduto {
  @Input() tipoProduto: TipoProdutoEnum | null = null;

  public get getTagData(): TagData {
    return getTagDataTipoProduto(this.tipoProduto);
  }
}
