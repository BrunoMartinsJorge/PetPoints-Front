import type { StatusPagamentoEnum } from '../../../../../shared/models/enums/StatusPagamentoEnum';
import type { TipoPagamentoEnum } from '../../../../../shared/models/enums/TipoPagamentoEnum';

export interface PagamentosDto {
  id: number;
  idConsulta: number;
  valor: number;
  dataLimitePagamento: string;
  statusPagamento: StatusPagamentoEnum;
  tipoPagamento: TipoPagamentoEnum;
  motivoIndeferimento: string;
  atrasado: boolean;
}
