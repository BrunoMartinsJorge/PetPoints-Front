import { Component, Input } from '@angular/core';
import { getTagDataPagamentos, StatusPagamentoEnum } from '../../models/enums/StatusPagamentoEnum';
import type { TagData } from '../../models/TagData';
import { PrimeNGModule } from "../../modules/prime-ng/prime-ng-module";

@Component({
  selector: 'app-bag-status-pagamento',
  imports: [PrimeNGModule],
  templateUrl: './bag-status-pagamento.html',
  styleUrl: './bag-status-pagamento.scss',
})
export class BagStatusPagamento {
  @Input() public status: StatusPagamentoEnum | undefined | null = StatusPagamentoEnum.PENDENTE;

  public get getTagData(): TagData {
    if (this.status == undefined || this.status == null) return {
      label: 'Indefinido',
      severity: 'secondary',
      icon: 'fa fa-question',
    }
    return getTagDataPagamentos(this.status);
  }
}
