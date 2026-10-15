import type { StatusConsultaEnum } from '../../../../../shared/models/enums/StatusConsultaEnum';

export interface ConsultaVeterinarioDto {
  id: number;
  status: StatusConsultaEnum;
  pet: string;
  imagemPet: string | null;
  cliente: string;
  data: Date;
  imagemCliente: string | null;
  tipo: string;
  observacoes: string;
}
