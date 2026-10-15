import type { StatusPagamentoEnum } from "../../../../../shared/models/enums/StatusPagamentoEnum";
import type { TipoPagamentoEnum } from "../../../../../shared/models/enums/TipoPagamentoEnum";

export interface PagamentoDto {
  id: number;
  tipoPagamento: TipoPagamentoEnum;
  valor: number;
  statusPagamento: StatusPagamentoEnum;
  pixPagamento: PagamentoPixDto;
}

export interface PagamentoPixDto {
  ordemId: string;
  pagamentoId: number;
  statusPagamentoOnline: string;
  urlPagamento: string;
  qrCodeBase: string;
}