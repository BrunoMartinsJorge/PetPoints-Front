import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { PrimeNGModule } from '../../../../../../shared/modules/prime-ng/prime-ng-module';
import { FuncionarioServices } from '../../services/funcionario-services';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { getPermissoesPorUsuario } from '../../../../shared/TiposFuncionarios';
import { InputMaskModule } from 'primeng/inputmask';
import type { NovoFuncionarioForm } from './forms/NovoFuncionarioForm';
import { MessageService } from 'primeng/api';
import type { OpcoesFiltro } from '../../../consultas-clinica/model/OpcoesFiltro';

@Component({
  selector: 'app-registrar-funcionario',
  imports: [PrimeNGModule, ReactiveFormsModule, InputMaskModule],
  templateUrl: './registrar-funcionario.html',
  styleUrl: './registrar-funcionario.scss',
})
export class RegistrarFuncionario implements OnInit {
  private readonly service = inject(FuncionarioServices);
  private readonly toast = inject(MessageService);
  public readonly generos = [
    { label: 'Masculino', value: 'M' },
    { label: 'Feminino', value: 'F' },
  ];

  public readonly dataMaxima = new Date();

  public especialziacoes: OpcoesFiltro[] = [];

  public formulario: FormGroup = this.gerarRelatorio();

  ngOnInit(): void {
    this.buscarEspecializacoes();
    this.formulario.get('permissao')?.valueChanges.subscribe((permissao) => {
      const crmv = this.formulario.get('crmv');
      const especializacao = this.formulario.get('especializacao');

      if (!crmv) return;

      if (permissao === 'V') {
        crmv.addValidators(Validators.required);
      } else {
        crmv.removeValidators(Validators.required);
      }
      
      crmv.updateValueAndValidity();
      
      if (!especializacao) return

      if (permissao === 'V') {
        especializacao.addValidators(Validators.required);
      } else {
        especializacao.removeValidators(Validators.required);
      }

      especializacao.updateValueAndValidity();
    });
  }

  private gerarRelatorio(): FormGroup {
    return new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      senha: new FormControl('', [Validators.required]),
      nome: new FormControl('', [Validators.required]),
      cpf: new FormControl('', [Validators.required, Validators.minLength(11)]),
      telefone: new FormControl('', [Validators.required]),
      genero: new FormControl('', [Validators.required]),
      dataNascimento: new FormControl('', [Validators.required]),
      permissao: new FormControl('', [Validators.required]),
      especializacao: new FormControl(''),
      crmv: new FormControl(''),
    });
  }

  private buscarEspecializacoes(): void {
    this.especialziacoes = [];
    this.service.buscarEspecializacoes().subscribe({
      next: (especializacoes) => {
        this.especialziacoes = especializacoes;
      },
    });
  }

  public get getPermissoes(): string[] {
    return getPermissoesPorUsuario(this.formulario.get('permissao')?.value);
  }

  public get veterinario(): boolean {
    return this.formulario.get('permissao')?.value === 'V';
  }

  public cadastrarFuncionario(): void {
    if (this.formulario.invalid) return;
    const funcionario = this.formulario.value;
    const payload: NovoFuncionarioForm = {
      nome: funcionario.nome,
      email: funcionario.email,
      senha: funcionario.senha,
      cpf: funcionario.cpf,
      telefone: funcionario.telefone,
      genero: funcionario.genero,
      dataNascimento: funcionario.dataNascimento,
      permissao: funcionario.permissao,
      especializacao: funcionario.especializacao || null,
      crmv: funcionario.crmv || null,
    };
    this.service.cadastrarFuncionario(payload).subscribe({
      next: () => {
        this.toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Funcionario cadastrado com sucesso',
        });
        this.formulario.reset();
      },
    });
  }

  public get maiorIdade(): boolean {
    const dataNascimento: Date = this.formulario.get('dataNascimento')?.value;
    if (!dataNascimento) return false;
    const hoje = new Date();
    const limite = new Date(
      hoje.getFullYear() - 18,
      hoje.getMonth(),
      hoje.getDate(),
    );

    return dataNascimento <= limite;
  }

  public get getDescricaoCargo(): string {
    const permissao = this.formulario.get('permissao')?.value;
    switch (permissao) {
      case 'G':
        return 'Gerente';
      case 'A':
        return 'Atendente';
      case 'E':
        return 'Estoquista';
      case 'V':
        return 'Veterinario';
    }
    return '';
  }
}
