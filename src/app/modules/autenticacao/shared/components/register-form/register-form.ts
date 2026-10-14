import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { TokenService } from '../../../../../core/services/token-service';
import { PrimeNGModule } from '../../../../../shared/modules/prime-ng/prime-ng-module';
import { AutenticaoService } from '../../../services/autenticao-service';
import { StepperModule } from 'primeng/stepper';
import type { FormRegistro } from '../../forms/FormRegistro';
import { GeneroEnum } from '../../../../../shared/models/enums/GeneroEnum';
import type { FileSelectEvent} from 'primeng/fileupload';
import { FileUploadModule } from 'primeng/fileupload';

@Component({
  selector: 'app-register-form',
  imports: [PrimeNGModule, StepperModule, FileUploadModule],
  templateUrl: './register-form.html',
  styleUrl: './register-form.scss',
})
export class RegisterForm {
  @Output() public toogleModeForm: EventEmitter<void> =
    new EventEmitter<void>();
  public registroForm: FormGroup = this.gerarFormularioRegistro();
  public carregandoRegistro = false;
  public etapa = 1;
  public readonly dataMaxima = new Date();

  private readonly tokenService = inject(TokenService);
  private readonly service = inject(AutenticaoService);
  public readonly generos = [
    { label: 'Masculino', value: GeneroEnum.MASCULINO },
    { label: 'Feminino', value: GeneroEnum.FEMININO },
  ]

  /**
   *
   * @description - Gera o formulário de registro com os campos necessários, utilizando as validações do Angular Forms
   * @returns - {FormGroup} - Formulário de registro
   */
  private gerarFormularioRegistro(): FormGroup {
    return new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
      ]),
      confirmPassword: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
      ]),
      nome: new FormControl('', [Validators.required, Validators.minLength(2)]),
      genero: new FormControl(GeneroEnum.MASCULINO, [Validators.required]),
      cpf: new FormControl('', [Validators.required, Validators.minLength(11)]),
      telefone: new FormControl('', [
        Validators.required,
        Validators.minLength(10),
      ]),
      foto: new FormControl(null),
      dataNascimento: new FormControl('', [Validators.required]),
    });
  }

  public carregarArquivo(event: FileSelectEvent): void {    
    const file = event.files[0];
    if (file)
      this.registroForm.get('foto')?.setValue(file);
  }

  public logarUsuario(): void {
    this.etapa = 1;
    this.toogleModeForm.emit();
  }

  public get dadosLoginValidos(): boolean {
    return (
      (this.registroForm.get('email')?.valid &&
        this.registroForm.get('password')?.valid &&
        this.registroForm.get('confirmPassword')?.valid &&
        this.registroForm.get('password')?.value ===
          this.registroForm.get('confirmPassword')?.value) ||
      false
    );
  }

  public get dadosPessoaisValidos(): boolean {
    return (
      (this.registroForm.get('nome')?.valid &&
        this.registroForm.get('genero')?.valid &&
        this.registroForm.get('cpf')?.valid &&
        this.registroForm.get('telefone')?.valid &&
        this.registroForm.get('dataNascimento')?.valid) ||
      false
    );
  }

  /**
   *
   * @description - Emite um evento para o componente pai para alternar entre os formulários de login e cadastro
   */
  public registrarUsuario(): void {
    if (this.registroForm.invalid) return;
    this.carregandoRegistro = true;
    const values = this.registroForm.value;
    const registroPayload: FormRegistro = {
      email: values.email,
      senha: values.password,
      nome: values.nome,
      genero: values.genero,
      cpf: values.cpf,
      telefone: values.telefone,
      dataNascimento: values.dataNascimento,
    };
    const file: File = values.foto;
    this.service.registro(registroPayload, file).subscribe({
      next: (res) => {
        const token = res.token || '';
        this.tokenService.setToken(token);
        this.tokenService.loadToken();
        this.carregandoRegistro = false;
      },
      error: () => {
        this.carregandoRegistro = false;
      }
    });
  }
}
