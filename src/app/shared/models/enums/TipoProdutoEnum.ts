import type { TagData } from '../TagData';

export enum TipoProdutoEnum {
  RACAO = 'RACAO',
  BRINQUEDO = 'BRINQUEDO',
  COSMETICO = 'COSMETICO',
  ROUPA = 'ROUPA',
  HIGIENE = 'HIGIENE',
  MEDICAMENTO = 'MEDICAMENTO',
}

export const TipoProdutoOpcoesFiltro = [
  {
    label: 'Todos',
    value: '',
  },
  {
    label: 'Ração',
    value: 'RACAO',
  },
  {
    label: 'Brinquedo',
    value: 'BRINQUEDO',
  },
  {
    label: 'Cosmético',
    value: 'COSMETICO',
  },
  {
    label: 'Roupa',
    value: 'ROUPA',
  },
  {
    label: 'Higiene',
    value: 'HIGIENE',
  },
  {
    label: 'Medicamento',
    value: 'MEDICAMENTO',
  },
];

export const TipoProdutoOpcoes = [
  {
    label: 'Ração',
    value: 'RACAO',
  },
  {
    label: 'Brinquedo',
    value: 'BRINQUEDO',
  },
  {
    label: 'Cosmético',
    value: 'COSMETICO',
  },
  {
    label: 'Roupa',
    value: 'ROUPA',
  },
  {
    label: 'Higiene',
    value: 'HIGIENE',
  },
  {
    label: 'Medicamento',
    value: 'MEDICAMENTO',
  },
];

export function getTagDataTipoProduto(tipo: TipoProdutoEnum | null): TagData {
  switch (tipo) {
    case TipoProdutoEnum.RACAO: {
      return {
        label: 'Ração',
        severity: 'info',
        icon: 'fa-solid fa-bone',
      };
    }
    case TipoProdutoEnum.BRINQUEDO: {
      return {
        label: 'Brinquedo',
        severity: 'info',
        icon: 'fa-solid fa-baseball',
      };
    }
    case TipoProdutoEnum.COSMETICO: {
      return {
        label: 'Cosmético',
        severity: 'info',
        icon: 'fa-solid fa-spray-can-sparkles',
      };
    }
    case TipoProdutoEnum.ROUPA: {
      return {
        label: 'Roupa',
        severity: 'info',
        icon: 'fa-solid fa-shirt',
      };
    }
    case TipoProdutoEnum.HIGIENE: {
      return {
        label: 'Higiene',
        severity: 'info',
        icon: 'fa-solid fa-pump-soap',
      };
    }
    case TipoProdutoEnum.MEDICAMENTO: {
      return {
        label: 'Medicamento',
        severity: 'info',
        icon: 'fa-solid fa-bandage',
      };
    }
    default: {
      return {
        label: 'Incompativel',
        severity: 'contrast',
        icon: 'fa fa-question',
      };
    }
  }
}
