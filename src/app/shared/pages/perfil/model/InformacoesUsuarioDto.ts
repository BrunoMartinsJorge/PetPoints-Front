import type { GeneroEnum } from '../../../models/enums/GeneroEnum';

export interface InformacoesUsuarioDto {
  nome: string;
  email: string;
  imagem: string;
  genero: GeneroEnum;
  dataNascimento: Date;
  telefone: string;
  cpf: string;
}
