import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { PrimeNGModule } from '../../../../shared/modules/prime-ng/prime-ng-module';
import { FuncionarioServices } from './services/funcionario-services';
import { FuncionariosOpcoes } from '../../shared/TiposFuncionarios';
import type { FuncionarioDto } from './models/FuncionarioDto';
import { Router } from '@angular/router';
import type { FiltroFuncionariosForm } from './form/FiltroFuncionariosForm';
import { ConverterCpfPipe } from '../../../../shared/pipes/converter-cpf-pipe';
import { GeneroBag } from '../../../../shared/components/genero-bag/genero-bag';
import { Imagem } from '../../../../shared/components/imagem/imagem';
import { urlArquivo } from '../../../../shared/utils/imagem-url';
import { ChatApiService } from '../../../../shared/services/chat-api-service';

@Component({
  selector: 'app-funcionarios',
  imports: [PrimeNGModule, ConverterCpfPipe, GeneroBag, Imagem],
  templateUrl: './funcionarios.html',
  styleUrl: './funcionarios.scss',
})
export class Funcionarios implements OnInit {
  private readonly service = inject(FuncionarioServices);
  private readonly chatService = inject(ChatApiService);
  private readonly router = inject(Router);

  public readonly tiposFuncionarios = FuncionariosOpcoes;

  private funcionarios: FuncionarioDto[] = [];
  public funcionariosFiltrados: FuncionarioDto[] = [];

  public carregandoFuncionarios = false;
  public carregandoRelatorio = false;

  public filtros: FiltroFuncionariosForm = {
    nome: '',
    tipo: '',
    email: '',
  };

  ngOnInit(): void {
    this.listarFuncionariosClinica();
  }

  public filtrarFuncionarios(): void {
    let funcionarios = this.funcionarios;
    if (this.filtros.nome.trim() !== '')
      funcionarios = funcionarios.filter((funcionario) =>
        funcionario.nome
          .toLocaleLowerCase()
          .includes(this.filtros.nome.toLocaleLowerCase()),
      );
    if (this.filtros.email.trim() !== '')
      funcionarios = funcionarios.filter((funcionario) =>
        funcionario.email
          .toLocaleLowerCase()
          .includes(this.filtros.email.toLocaleLowerCase()),
      );
    if (this.filtros.tipo.trim() !== '')
      funcionarios = funcionarios.filter(
        (funcionario) => funcionario.permissao == this.filtros.tipo,
      );
    this.funcionariosFiltrados = funcionarios;
  }

  public acessarPaginaRegistroFuncionario(): void {
    this.router.navigate(['gerente/registrar-funcionario']);
  }

  public acessarDetalhesFuncionario(id: number): void {
    this.router.navigate(['gerente/detalhes-funcionario', id]);
  }

  public limparFiltros(): void {
    this.filtros = {
      nome: '',
      tipo: '',
      email: '',
    };
    this.filtrarFuncionarios();
  }

  private listarFuncionariosClinica(): void {
    this.carregandoFuncionarios = true;
    this.funcionarios = [];
    this.service.listarFuncionarios().subscribe({
      next: (funcionarios: FuncionarioDto[]) => {
        this.funcionarios = funcionarios;
        this.funcionariosFiltrados = this.funcionarios;
        this.carregandoFuncionarios = false;
      },
      error: () => {
        this.carregandoFuncionarios = false;
      },
    });
  }

  private get converterTipoEnum(): string {
    switch (this.filtros.tipo) {
      case 'GERENTE':
        return 'G';
      case 'ATENDENTE':
        return 'A';
      case 'VETERINARIO':
        return 'V';
      case 'ESTOQUISTA':
        return 'E';
      default:
        return '';
    }
  }

  public gerarRelatorio(): void {
    this.carregandoRelatorio = true;
    this.filtros.tipo = this.converterTipoEnum;
    this.service.gerarRelatorioFuncionarios(this.filtros).subscribe({
      next: (response: Blob) => {
        const file = new Blob([response], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        window.open(fileURL);
        this.carregandoRelatorio = false;
      },
      error: () => {
        this.carregandoRelatorio = false;
      },
    });
  }

  public acessarChatInterno(id: number): void {
    this.chatService.idFuncionarioSelecionado = id;
    this.chatService.redirecionado = true;
    this.router.navigate(['gerente/chat-interno']);
  }

  public urlImagem(uuid: string | null | undefined): string {
    return urlArquivo(uuid);
  }
}
