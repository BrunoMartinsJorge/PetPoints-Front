export interface ItemPrescricaoForm {
  /** Identificador do produto receitado. */
  id: number;
  dose: string;
  via: string;
  intervalo: string;
  duracao: string;
}

export interface PrescricaoForm {
  idConsulta: number;
  diagnostico: string;
  observacoes: string;
  itens: ItemPrescricaoForm[];
  /** Data prevista para reavaliação clínica (ISO, sem fuso). */
  retorno: string | null;
}
