import type { StatusPagamentoEnum } from '../../../../../shared/models/enums/StatusPagamentoEnum';
import type { TipoPagamentoEnum } from '../../../../../shared/models/enums/TipoPagamentoEnum';

export interface PagamentoPixDto {
  ordemId: string;
  pagamentoId: number;
  statusPagamentoOnline: string;
  urlPagamento: string;
  qrCodeBase: string;
  qrCodeCopiaECola: string;
}

export interface PagamentoDetalhadoDto {
  id: number;
  idConsulta: number;
  statusPagamento: StatusPagamentoEnum;
  valor: number;
  tipoPagamento: TipoPagamentoEnum;
  pixPagamento: PagamentoPixDto | null;
  tipoConsulta: string;
  idVeterinario: number;
  petConsulta: string;
  veterinarioConsulta: string;
  dataHoraConsulta: string;
  atrasado: boolean;
  motivoIndeferimento: string;
}

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
