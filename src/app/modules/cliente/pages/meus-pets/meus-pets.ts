import { Component, inject } from '@angular/core';
import { MeusPetsService } from './services/meus-pets-service';
import { PrimeNGModule } from '../../../../shared/modules/prime-ng/prime-ng-module';
import type { MeuPetDto } from './models/MeuPetDto';
import { PetCard } from './components/pet-card/pet-card';
import { ConsultaPetCard } from './components/consulta-pet-card/consulta-pet-card';
import type { MeuPetConsultaDto } from './models/MeuPetConsultaDto';
import { Router } from '@angular/router';
import { StatusPerfilEnum } from '../../../../shared/models/enums/StatusPerfilEnum';

interface FiltroPet {
  label: string;
  valor: string;
}

@Component({
  selector: 'app-meus-pets',
  imports: [PrimeNGModule, PetCard, ConsultaPetCard],
  templateUrl: './meus-pets.html',
  styleUrl: './meus-pets.scss',
})
export class MeusPets {
  private readonly service = inject(MeusPetsService);
  private readonly router = inject(Router);

  public pets: MeuPetDto[] = [];
  public petsFiltrados: MeuPetDto[] = [];
  public consultas: MeuPetConsultaDto[] = [];
  public carregandoPets = false;
  public carregandoConsultas = false;

  public termoBusca = '';
  public filtroSelecionado = 'TODOS';

  constructor() {
    this.buscarMeusPets();
    this.buscarAsConsultasDeMeusPets();
  }

  /**
   * @description Quantidade total de pets do cliente
   */
  public get total(): number {
    return this.pets.length;
  }

  /**
   * @description Quantidade de pets ativos
   */
  public get qtdAtivos(): number {
    return this.pets.filter((pet) => pet.status === StatusPerfilEnum.ATIVO)
      .length;
  }

  /**
   * @description Quantidade de pets desativados
   */
  public get qtdDesativados(): number {
    return this.pets.filter((pet) => pet.status === StatusPerfilEnum.DESATIVADO)
      .length;
  }

  /**
   * @description Abas de filtro: as fixas (Todos/Ativos/Desativados) mais uma
   * aba por espécie presente na lista de pets
   */
  public get filtros(): FiltroPet[] {
    const especies = [...new Set(this.pets.map((pet) => pet.tipo))]
      .filter((tipo) => !!tipo)
      .sort((a, b) => a.localeCompare(b));

    return [
      { label: 'Todos', valor: 'TODOS' },
      { label: 'Ativos', valor: 'ATIVOS' },
      { label: 'Desativados', valor: 'DESATIVADOS' },
      ...especies.map((tipo) => ({ label: `${tipo}s`, valor: tipo })),
    ];
  }

  /**
   *
   * @description Lista todos os pets do cliente
   */
  private buscarMeusPets(): void {
    this.pets = [];
    this.carregandoPets = true;
    this.service.buscarMeusPets().subscribe({
      next: (res: MeuPetDto[]) => {
        this.pets = res;
        this.aplicarFiltros();
        this.carregandoPets = false;
      },
      error: () => {
        this.carregandoPets = false;
      },
    });
  }

  /**
   *
   * @description Lista todas as consultas de seus pets que estejam: Aprovadas, Em Andamento ou Pendentes
   */
  private buscarAsConsultasDeMeusPets(): void {
    this.consultas = [];
    this.carregandoConsultas = true;
    this.service.buscarAsConsultasDeMeusPets().subscribe({
      next: (res: MeuPetConsultaDto[]) => {
        this.consultas = res;
        this.carregandoConsultas = false;
      },
      error: () => {
        this.carregandoConsultas = false;
      },
    });
  }

  /**
   *
   * @description Aplica o filtro selecionado e o termo de busca sobre a lista de pets
   */
  public aplicarFiltros(): void {
    const termo = this.termoBusca.trim().toLowerCase();

    this.petsFiltrados = this.pets.filter((pet) => {
      const atendeFiltro =
        this.filtroSelecionado === 'TODOS' ||
        (this.filtroSelecionado === 'ATIVOS' &&
          pet.status === StatusPerfilEnum.ATIVO) ||
        (this.filtroSelecionado === 'DESATIVADOS' &&
          pet.status === StatusPerfilEnum.DESATIVADO) ||
        pet.tipo === this.filtroSelecionado;

      const atendeBusca =
        !termo ||
        pet.nome?.toLowerCase().includes(termo) ||
        pet.raca?.toLowerCase().includes(termo);

      return atendeFiltro && atendeBusca;
    });
  }

  /**
   *
   * @description Seleciona uma aba de filtro e reaplica os filtros
   */
  public selecionarFiltro(valor: string): void {
    this.filtroSelecionado = valor;
    this.aplicarFiltros();
  }

  public adicionarNovoPet(): void {
    this.router.navigate(['/cliente/meus-pets/novo']);
  }
}
