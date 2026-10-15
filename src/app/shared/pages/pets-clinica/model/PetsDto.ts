import type { GeneroEnum } from '../../../models/enums/GeneroEnum';
import type { TipoAnimalEnum } from '../../../models/enums/TipoAnimalEnum';

export interface PetsDto {
  id: number;
  nome: string;
  tipo: TipoAnimalEnum;
  genero: GeneroEnum;
  registradoEm: Date;
  tutor: {
    id: number;
    nome: string;
  };
  imagem: string | null;
}
