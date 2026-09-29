import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PrimeNGModule } from '../../../../../../shared/modules/prime-ng/prime-ng-module';
import { BagStatusConsulta } from '../../../../../../shared/components/bag-status-consulta/bag-status-consulta';
import { SelectButton } from 'primeng/selectbutton';
import type { OptionSelect } from '../../../../../../shared/models/OptionSelect';
import { StatusConsultaEnum } from '../../../../../../shared/models/enums/StatusConsultaEnum';
import type { MinhasConsultasDto } from '../../models/MinhasConsultasDto';

@Component({
  selector: 'app-historico-consultas',
  imports: [PrimeNGModule, FormsModule, BagStatusConsulta, SelectButton],
  templateUrl: './historico-consultas.html',
  styleUrl: './historico-consultas.scss',
})
export class HistoricoConsultas {
  @Input() set consultas(value: MinhasConsultasDto[]) {
    this._consultas = value ?? [];
    this.montarFiltroPets();
    this.filtrar();
  }
  get consultas(): MinhasConsultasDto[] {
    return this._consultas;
  }
  private _consultas: MinhasConsultasDto[] = [];

  @Input() carregando = false;

  @Output() selecionar = new EventEmitter<MinhasConsultasDto>();
  @Output() reagendar = new EventEmitter<MinhasConsultasDto>();
  @Output() cancelar = new EventEmitter<MinhasConsultasDto>();
  @Output() solicitar = new EventEmitter<void>();

  public consultasFiltradas: MinhasConsultasDto[] = [];
  public petsParaFiltro: OptionSelect[] = [];
  public petFiltro = '';
  public statusFiltro: StatusConsultaEnum | '' = '';

  public readonly statusOpcoes = [
    { label: 'Todos', value: '' },
    { label: 'Aprovadas', value: 'APROVADA' },
    { label: 'Pendentes', value: 'PENDENTE' },
    { label: 'Indeferidas', value: 'REPROVADA' },
    { label: 'Canceladas', value: 'CANCELADO' },
  ];

  private montarFiltroPets(): void {
    const nomes = [...new Set(this._consultas.map((c) => c.petConsulta))];
    this.petsParaFiltro = [
      { label: 'Todos', value: '' },
      ...nomes.map((nome) => ({ label: nome, value: nome })),
    ];
  }

  public filtrar(): void {
    let consultas = this._consultas;

    if (this.petFiltro) {
      const alvo = this.petFiltro.toLowerCase();
      consultas = consultas.filter((c) =>
        c.petConsulta.toLowerCase().includes(alvo),
      );
    }

    if (this.statusFiltro !== '') {
      consultas = consultas.filter(
        (c) => c.statusConsulta === this.statusFiltro,
      );
    }

    this.consultasFiltradas = consultas;
  }

  public podeCancelar(status: MinhasConsultasDto['statusConsulta']): boolean {
    return status === StatusConsultaEnum.PENDENTE || status === StatusConsultaEnum.APROVADA;
  }

  public podeReagendar(status: MinhasConsultasDto['statusConsulta']): boolean {
    return status === StatusConsultaEnum.PENDENTE || status === StatusConsultaEnum.APROVADA;
  }

  public pegarIniciais(nome: string): string {
    const limpo = (nome ?? '').trim();
    if (!limpo) return '';
    return limpo.substring(0, 2);
  }
}