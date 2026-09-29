import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { PrimeNGModule } from '../../modules/prime-ng/prime-ng-module';
import { PetsClinicaService } from './service/pets-clinica-service';
import type { PetsDto } from './model/PetsDto';
import { GeneroBag } from '../../components/genero-bag/genero-bag';
import { TipoPetBag } from '../../components/tipo-pet-bag/tipo-pet-bag';
import type { TutorDto } from './model/TutorDto';
import {
  GeneroEnum,
  GeneroEnumOpcoes,
  GeneroEnumOpcoesFormulario,
} from '../../models/enums/GeneroEnum';
import { PetOpcoes } from '../../models/PetOpcoes';
import { Router } from '@angular/router';
import type { RelatorioPetsClinicaForm } from './form/RelatorioPetsClinicaForm';
import { TokenService } from '../../../core/services/token-service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  Stepper,
  StepList,
  Step,
  StepPanel,
  StepPanels,
} from 'primeng/stepper';
import type { NovoPetForm } from './form/NovoPetForm';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-pets-clinica',
  imports: [
    PrimeNGModule,
    GeneroBag,
    TipoPetBag,
    Stepper,
    StepList,
    Step,
    StepPanel,
    StepPanels,
  ],
  templateUrl: './pets-clinica.html',
  styleUrl: './pets-clinica.scss',
})
export class PetsClinica implements OnInit {
  private readonly service = inject(PetsClinicaService);
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);
  private readonly toast = inject(MessageService);

  public tipoUsuario = '';

  public novoPetForm!: FormGroup;

  private pets: PetsDto[] = [];
  public petsFiltrados: PetsDto[] = [];
  public tutores: TutorDto[] = [];
  public tutoresForm: TutorDto[] = [];
  public visibilidadeDialogNovoPet = false;

  public carregandoPets = false;
  public carregandoTutores = false;
  public carregandoRelatorio = false;

  public readonly generosOpcoes = GeneroEnumOpcoes;
  public readonly generosOpcoesForm = GeneroEnumOpcoesFormulario;
  public readonly tipoAnimalOpcoes = PetOpcoes;
  public readonly tipoAnimalOpcoesForm = PetOpcoes;

  public filtros: RelatorioPetsClinicaForm = {
    nome: '',
    tipo: '',
    genero: '',
    idTutor: null as number | null,
  };

  public readonly dataLimiteNascimento = new Date();

  ngOnInit(): void {
    this.buscarPets();
    const token = this.tokenService.getTokenPayload;
    if (!token) return;
    this.tipoUsuario = token.permissoes[0] == 'A' ? 'ATENDENTE' : 'GERENTE';
    this.novoPetForm = this.criarFormularioNovoPet();
  }

  private criarFormularioNovoPet(): FormGroup {
    return new FormGroup({
      nome: new FormControl('', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
      ]),
      tipo: new FormControl('CACHORRO', [Validators.required]),
      genero: new FormControl(GeneroEnum.FEMININO, [Validators.required]),
      idTutor: new FormControl(null, [Validators.required]),
      raca: new FormControl('', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
      ]),
      dataNascimento: new FormControl('', [Validators.required]),
      observacoes: new FormControl(''),
    });
  }

  public get primeiraEtapaNovoPetValida(): boolean {
    if (!this.novoPetForm) return false;
    const values = this.novoPetForm.value;
    const nomeValido =
      values.nome &&
      values.nome.trim().length >= 2 &&
      values.nome.trim().length <= 50;
    const racaValida =
      values.raca &&
      values.raca.trim().length >= 2 &&
      values.raca.trim().length <= 50;
    const generoValido = values.genero && values.genero.trim() !== '';
    const tipoValido = values.tipo && values.tipo.trim() !== '';
    return nomeValido && racaValida && generoValido && tipoValido;
  }

  public get podeRegistrarNovoPet(): boolean {
    if (!this.primeiraEtapaNovoPetValida) return false;
    const values = this.novoPetForm.value;
    const tutorValido = values.idTutor !== null && values.idTutor !== undefined;
    const dataNascimentoValida =
      values.dataNascimento && values.dataNascimento.toString().trim() !== '';
    return tutorValido && dataNascimentoValida;
  }

  private buscarPets(): void {
    this.carregandoPets = true;
    this.pets = [];
    this.petsFiltrados = [];
    this.service.listarPets().subscribe({
      next: (res: PetsDto[]) => {
        this.pets = res;
        this.petsFiltrados = res;
        this.buscarTutores();
        this.carregandoPets = false;
      },
      error: () => {
        this.carregandoPets = false;
      },
    });
  }

  private buscarTutores(): void {
    this.carregandoTutores = true;
    this.tutores = [];
    this.tutoresForm = [];
    this.service.buscarTutoresFiltro().subscribe({
      next: (res: TutorDto[]) => {
        this.tutores = res;
        this.tutoresForm = [...res];

        this.carregandoTutores = false;

        if (!this.tutores.find((tutor) => tutor.label === 'Todos')) {
          this.tutores.unshift({ label: 'Todos', value: null });
        }
      },
    });
  }

  public filtrarPets(): void {
    let pets = this.pets;
    if (this.filtros.nome !== '' || this.filtros.nome.trim() !== '') {
      pets = pets.filter((pet) =>
        pet.nome.toLowerCase().includes(this.filtros.nome.toLowerCase()),
      );
    }
    if (this.filtros.tipo !== '' || this.filtros.tipo.trim() !== '') {
      pets = pets.filter((pet) =>
        pet.tipo.toLowerCase().includes(this.filtros.tipo.toLowerCase()),
      );
    }
    if (this.filtros.genero !== '' || this.filtros.genero.trim() !== '') {
      pets = pets.filter((pet) =>
        pet.genero.toLowerCase().includes(this.filtros.genero.toLowerCase()),
      );
    }
    if (this.filtros.idTutor !== null) {
      pets = pets.filter((pet) => pet.tutor.id === this.filtros.idTutor);
    }
    this.petsFiltrados = pets;
  }

  public limparFiltros(): void {
    this.filtros = {
      nome: '',
      tipo: '',
      genero: '',
      idTutor: null,
    };
    this.filtrarPets();
  }

  public verDetalhesPet(idPet: number): void {
    const base = (this.tipoUsuario || 'GERENTE').toLocaleLowerCase();
    this.router.navigate([`${base}/detalhes-pet`, idPet]);
  }

  public gerarRelatorio(): void {
    this.carregandoRelatorio = true;
    this.service.gerarRelatorioPets(this.filtros).subscribe({
      next: (res: Blob) => {
        const file = new Blob([res], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        window.open(fileURL);
        this.carregandoRelatorio = false;
      },
      error: () => {
        this.carregandoRelatorio = false;
      },
    });
  }

  public registrarNovoPet(): void {
    if (!this.podeRegistrarNovoPet) return;
    const values = this.novoPetForm.value;
    const payload: NovoPetForm = values;
    this.service.registrarNovoPet(payload).subscribe({
      next: () => {
        this.toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Pet registrado com sucesso!',
        });
        this.novoPetForm.reset();
        this.visibilidadeDialogNovoPet = false;
        this.buscarPets();
      },
    });
  }
}
