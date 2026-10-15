import type { ElementRef, OnInit } from '@angular/core';
import { Component, inject, ViewChild } from '@angular/core';
import { PrimeNGModule } from '../../../../../../shared/modules/prime-ng/prime-ng-module';
import type { PetDetalhesDto, PetSemelhantesDto } from './model/PetDetalhesDto';
import { MeusPetsService } from '../../services/meus-pets-service';
import { Router } from '@angular/router';
import { TipoPetBag } from '../../../../../../shared/components/tipo-pet-bag/tipo-pet-bag';
import { GeneroBag } from '../../../../../../shared/components/genero-bag/genero-bag';
import { ActivatedRoute } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { BagStatusConsulta } from '../../../../../../shared/components/bag-status-consulta/bag-status-consulta';
import type { MinhasConsultasDto } from '../../../minhas-consultas/models/MinhasConsultasDto';
import { MinhasConsultasService } from '../../../minhas-consultas/services/minhas-consultas-service';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import type { FileSelectEvent } from 'primeng/fileupload';
import type { EditarPetForm } from '../../models/form/EditarPetForm';
import type { PetPodeSerDeletadoDto } from '../../models/PetPodeSerDeletadoDto';
import { MessageService } from 'primeng/api';
import type { CarteirinhaPetDto } from '../../../../../../shared/components/carteirinha-pet/dto/CarteirinhaPetDto';
import { CarteirinhaPet } from "../../../../../../shared/components/carteirinha-pet/carteirinha-pet";
import { CarteirinhaPdfService } from '../../../../../../shared/components/carteirinha-pet/service/carteirinha-pdf-service';
import { BagStatusPerfil } from "../../../../../../shared/components/bag-status-perfil/bag-status-perfil";
import { Imagem } from '../../../../../../shared/components/imagem/imagem';
import { urlArquivo } from '../../../../../../shared/utils/imagem-url';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';

@Component({
  selector: 'app-informacoes-pet',
  imports: [
    PrimeNGModule,
    TipoPetBag,
    GeneroBag,
    DialogModule,
    BagStatusConsulta,
    CarteirinhaPet,
    BagStatusPerfil,
    Imagem,
    InputGroupModule,
    InputGroupAddonModule
],
  providers: [MessageService],
  templateUrl: './informacoes-pet.html',
  styleUrl: './informacoes-pet.scss',
})
export class InformacoesPet implements OnInit {
  @ViewChild('pdfcarteirinha') carteirinhaElemento!: ElementRef<HTMLElement>;
  public petSelecionado: PetDetalhesDto | undefined = undefined;
  public petsRelacionados: PetSemelhantesDto[] = [];
  public consultasPet: MinhasConsultasDto[] = [];
  public carregandoConsultas = false;
  public carregandoPetsRelacionados = false;
  public htmlCarteirinha = '';
  private idPetSelecionado = 0;
  public informacoesCarteirinha: CarteirinhaPetDto | null = null;

  public petDesativar: PetPodeSerDeletadoDto | undefined = undefined;

  public visibilidadeDialogEditarPet = false;
  public visibilidadeDialogDesativarPet = false;
  public visibilidadeDialogCarteirinha = false;
  public gerandoPdf = false;

  public formularioEdicao!: FormGroup;

  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(MeusPetsService);
  private readonly consultasService = inject(MinhasConsultasService);
  private readonly router = inject(Router);
  private readonly toast = inject(MessageService);
  private readonly carteirinhaPdf = inject(CarteirinhaPdfService);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.idPetSelecionado = Number(params.get('petId') || 0);
      this.buscarPetSelecionado();
      this.buscarConsultasPet();
    });
  }

  public alterarVisibilidadeDialogEditarPet(): void {
    this.visibilidadeDialogEditarPet = !this.visibilidadeDialogEditarPet;
    this.gerarFormularioEdicao();
  }

  public alterarVisibilidadeDialogDesativarPet(): void {
    this.visibilidadeDialogDesativarPet = !this.visibilidadeDialogDesativarPet;
    this.verificarPetDesativar();
  }

  private verificarPetDesativar(): void {
    if (!this.idPetSelecionado) return;
    this.petDesativar = undefined;
    this.service
      .verificarPetPodeSerDesabilitado(this.idPetSelecionado)
      .subscribe({
        next: (response: PetPodeSerDeletadoDto) => {
          this.petDesativar = response;
        },
      });
  }

  private gerarFormularioEdicao(): void {
    if (this.petSelecionado == null) return;
    this.formularioEdicao = new FormGroup({
      nome: new FormControl(this.petSelecionado.nome || '', [
        Validators.required,
      ]),
      raca: new FormControl(this.petSelecionado.raca || '', [
        Validators.required,
      ]),
      sexo: new FormControl(this.petSelecionado.genero || '', [
        Validators.required,
      ]),
      tipo: new FormControl(this.petSelecionado.tipo || '', [
        Validators.required,
      ]),
      dataNascimento: new FormControl(
        this.petSelecionado.dataNascimento || '',
        [Validators.required],
      ),
      observacoes: new FormControl(this.petSelecionado.observacoes || ''),
      foto: new FormControl(this.petSelecionado.imagem || null),
    });
  }

  public carregarArquivo(event: FileSelectEvent): void {
    const file = event.files[0];
    if (file) this.formularioEdicao.get('foto')?.setValue(file);
  }

  private buscarPetSelecionado(): void {
    this.petSelecionado = undefined;
    this.carregandoPetsRelacionados = true;
    this.service
      .buscarPetSelecionado(this.idPetSelecionado)
      .subscribe({
        next: (res: PetDetalhesDto) => {
          this.petSelecionado = res;
          this.petsRelacionados = res.petsRelacionados;
          this.carregandoPetsRelacionados = false;
        },
        error: () => {
          this.carregandoPetsRelacionados = false;
        },
      });
  }

  public acessarPet(idPet: number): void {
    this.router.navigate([`/cliente/meus-pets/informacoes/${idPet}`]);
  }

  public buscarCarteirinha(): void {
    this.informacoesCarteirinha = null;
    this.service
      .verCarteirinha(this.idPetSelecionado)
      .subscribe((res: CarteirinhaPetDto) => {
        this.informacoesCarteirinha = res;
        this.visibilidadeDialogCarteirinha = true;
      });
  }

  public async baixarCarteirinha(): Promise<void> {
    if (!this.petSelecionado) return;
    try {
      this.gerandoPdf = true;
      const nome = (this.petSelecionado.nome ?? 'pet').trim().replace(/\s+/g, '-').toLowerCase();
      await this.carteirinhaPdf.gerarPdf(this.carteirinhaElemento.nativeElement, `carteirinha-${nome}.pdf`);
    } finally {
      this.gerandoPdf = false;
    }
  }

  private buscarConsultasPet(): void {
    this.consultasPet = [];
    this.carregandoConsultas = true;
    this.service.buscarConsultasPet(this.idPetSelecionado).subscribe({
      next: (response: MinhasConsultasDto[]) => {
        this.consultasPet = response;
        this.carregandoConsultas = false;
      },
      error: () => {
        this.carregandoConsultas = false;
      },
    });
  }

  public getUrlImagem(pet: PetDetalhesDto | PetSemelhantesDto): string {
    return urlArquivo('arquivo' in pet ? pet.arquivo : pet.imagem);
  }

  public acessarConsulta(consulta: MinhasConsultasDto): void {
    this.consultasService.consultaSelecionada = consulta;
    this.consultasService.idConsultaSelecionada = consulta.id;
    this.consultasService.acessoPorPetSelecionado = true;
    this.router.navigate([`/cliente/minhas-consultas`]);
  }

  private converterParaDate(data: string | Date): Date {
    if (data instanceof Date) {
      return data;
    }

    const dataConvertida = new Date(data);

    if (isNaN(dataConvertida.getTime())) {
      return new Date();
    }

    return dataConvertida;
  }

  public salvarEdicao(): void {
    if (this.formularioEdicao.invalid) return;
    const values = this.formularioEdicao.value;
    const form: EditarPetForm = {
      nome: values.nome,
      raca: values.raca,
      genero: values.sexo,
      tipo: values.tipo,
      observacoes: values.observacoes,
      dataNascimento: this.converterParaDate(values.dataNascimento),
    };
    this.service.editarPet(this.idPetSelecionado, form, values.foto).subscribe({
      next: () => {
        this.buscarPetSelecionado();
        this.alterarVisibilidadeDialogEditarPet();
      },
    });
  }

  public desativarPet(): void {
    if (!this.idPetSelecionado) return;
    this.service.desativarPet(this.idPetSelecionado).subscribe({
      next: () => {
        this.toast.add({
          severity: 'info',
          summary: 'Sucesso',
          detail: 'Pet desativado com sucesso!',
        });
        this.buscarPetSelecionado();
        this.alterarVisibilidadeDialogDesativarPet();
      },
    });
  }
}
