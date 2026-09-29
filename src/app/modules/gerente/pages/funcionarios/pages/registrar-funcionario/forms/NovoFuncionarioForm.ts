import type { GeneroEnum } from "../../../../../../../shared/models/enums/GeneroEnum";
import type { TiposFuncionarios } from "../../../../../shared/TiposFuncionarios";

export interface NovoFuncionarioForm {
    email: string;
    nome: string;
    senha: string;
    cpf: string;
    telefone: string;
    genero: GeneroEnum;
    dataNascimento: Date;
    permissao: TiposFuncionarios;
    especializacao: number | null;
    crmv: string | null;
}