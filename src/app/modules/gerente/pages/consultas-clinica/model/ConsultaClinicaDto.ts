import type { StatusConsultaEnum } from '../../../../../shared/models/enums/StatusConsultaEnum';
import type { TipoPagamentoEnum } from '../../../../../shared/models/enums/TipoPagamentoEnum';
import type { ParticipantesConsultaDto } from './ParticipantesConsultaDto';

export interface ConsultaClinicaDto {
  id: number;
  tipo: {
    id: number;
    nome: string;
  };
  status: StatusConsultaEnum;
  solicitadoEm: Date;
  observacoes: string;
  cliente: ParticipantesConsultaDto;
  veterinario: ParticipantesConsultaDto;
  pet: string | null;
  imagemPet: string | null;
  dataConsulta: Date;
  valor: number;
  formaPagamento: TipoPagamentoEnum | null;
}
