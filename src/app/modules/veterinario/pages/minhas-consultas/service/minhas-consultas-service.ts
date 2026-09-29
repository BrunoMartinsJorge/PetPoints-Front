import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ConsultaVeterinarioDto } from '../model/ConsultaVeterinarioDto';
import type { ConsultaAtualDto } from '../model/ConsultaAtualDto';
import type { InformacoesConsultaSelecionadaDto } from '../pages/detalhes-consulta/model/InformacoesConsultaSelecionadaDto';
import type { ProdutoCobrancaDto } from '../model/ProdutoCobrancaDto';
import type { FinalizarConsultaForm } from '../form/FinalizarConsultaForm';
import type { PrescricaoForm } from '../form/PrescricaoForm';

@Injectable({
  providedIn: 'root',
})
export class MinhasConsultasService {
  private readonly http = inject(HttpClient);
  private readonly URL = '/veterinario/minhas-consultas';

  public buscarConsultasDoDia(): Observable<ConsultaVeterinarioDto[]> {
    return this.http.get<ConsultaVeterinarioDto[]>(`${this.URL}/hoje`);
  }

  public buscarConsultaAtual(): Observable<ConsultaAtualDto> {
    return this.http.get<ConsultaAtualDto>(`${this.URL}/consulta-atual`);
  }

  public buscarHistoricoConsultas(): Observable<ConsultaVeterinarioDto[]> {
    return this.http.get<ConsultaVeterinarioDto[]>(`${this.URL}`);
  }

  public buscarInformacoesConsulta(
    idConsulta: number,
  ): Observable<InformacoesConsultaSelecionadaDto> {
    return this.http.get<InformacoesConsultaSelecionadaDto>(
      `${this.URL}/selecionar-consulta/${idConsulta}`,
    );
  }

  public iniciarConsulta(idConsulta: number): Observable<void> {
    return this.http.put<void>(`${this.URL}/iniciar/${idConsulta}`, {});
  }

  public buscarProdutosParaCobranca(): Observable<ProdutoCobrancaDto[]> {
    return this.http.get<ProdutoCobrancaDto[]>(`${this.URL}/produtos-cobranca`);
  }

  public finalizarConsulta(
    idConsulta: number,
    form: FinalizarConsultaForm,
  ): Observable<void> {
    return this.http.put<void>(`${this.URL}/finalizar/${idConsulta}`, form);
  }

  public gerarPrescricao(form: PrescricaoForm): Observable<Blob> {
    return this.http.post(`${this.URL}/prescricao`, form, {
      responseType: 'blob',
    });
  }
}
