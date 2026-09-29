import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ConsultaClinicaDto } from '../model/ConsultaClinicaDto';
import type { TiposConsultaDto } from '../model/TiposConsultaDto';
import type { OpcoesFiltro } from '../model/OpcoesFiltro';
import type { DetalhesTipoConsultaDto } from '../model/DetalhesTipoConsultaDto';
import type { TipoConsultaForm } from '../form/TipoConsultaForm';
import type { VeterinarioEspecializacoesDto } from '../model/VeterinarioEspecializacoesDto';
import type { DetalhesConsultaDto } from '../model/DetalhesConsultaDto';
import type { FiltroConsultaForm } from '../form/FiltroConsultaForm';
import type { EspecializacaoDto } from '../model/EspecializacaoDto';
import type { EspecializacaoForm } from '../form/EspecializacaoForm';
import type { DetalhesEspecializacaoDto } from '../model/DetalhesEspecializacaoDto';

@Injectable({
  providedIn: 'root',
})
export class ConsultasClinicaService {
  private readonly URL = '/gerente/consultas-clinica';
  private readonly http = inject(HttpClient);

  public listarConsultas(): Observable<ConsultaClinicaDto[]> {
    return this.http.get<ConsultaClinicaDto[]>(this.URL);
  }

  public listarTiposConsulta(): Observable<TiposConsultaDto[]> {
    return this.http.get<TiposConsultaDto[]>(`${this.URL}/tipos-consulta`);
  }

  public listarTiposConsultaFiltros(): Observable<OpcoesFiltro[]> {
    return this.http.get<OpcoesFiltro[]>(`${this.URL}/tipos-consulta-filtro`);
  }

  public listarEspecializacoes(): Observable<EspecializacaoDto[]> {
    return this.http.get<EspecializacaoDto[]>(`${this.URL}/especializacoes`);
  }

  public listarClientesFiltros(): Observable<OpcoesFiltro[]> {
    return this.http.get<OpcoesFiltro[]>(`${this.URL}/clientes`);
  }

  public listarVeterinariosFiltros(): Observable<OpcoesFiltro[]> {
    return this.http.get<OpcoesFiltro[]>(`${this.URL}/veterinarios`);
  }

  public buscarDetalhesTipoConsulta(idTipoConsulta: number): Observable<DetalhesTipoConsultaDto> {
    return this.http.get<DetalhesTipoConsultaDto>(`${this.URL}/buscar-detalhes-tipo-consulta/${idTipoConsulta}`);
  }

  public buscarDetalhesConsulta(idConsulta: number): Observable<DetalhesConsultaDto> {
    return this.http.get<DetalhesConsultaDto>(`${this.URL}/detalhes-consulta/${idConsulta}`);
  }

  public adicionarNovoTipoConsulta(novoTipo: TipoConsultaForm): Observable<DetalhesTipoConsultaDto> {
    return this.http.put<DetalhesTipoConsultaDto>(`${this.URL}/adicionar-tipo-consulta`, novoTipo);
  }

  public editarInformacoesTipoConsulta(valoresEdicao: TipoConsultaForm, idTipoConsulta: number): Observable<DetalhesTipoConsultaDto> {
    return this.http.put<DetalhesTipoConsultaDto>(`${this.URL}/editar-informacoes-tipo-consulta/${idTipoConsulta}`, valoresEdicao);
  }

  public editarInformacoesEspecializacao(valoresEdicao: EspecializacaoForm, idEspecializacao: number): Observable<DetalhesTipoConsultaDto> {
    return this.http.put<DetalhesTipoConsultaDto>(`${this.URL}/editar-informacoes-especializacao/${idEspecializacao}`, valoresEdicao);
  }

  public buscarVeterinariosAdicionar(idTipoConsulta: number): Observable<VeterinarioEspecializacoesDto[]>{
    return this.http.get<VeterinarioEspecializacoesDto[]>(`${this.URL}/buscar-veterinarios-adicionar/${idTipoConsulta}`);
  }

  public adicionarNovoVeterinarioTipoConsulta(idVeterinario: number, idTipoConsulta: number): Observable<void> {
    return this.http.put<void>(`${this.URL}/adicionar-veterinario-tipo-consulta/${idVeterinario}/${idTipoConsulta}`, {});
  }

  public removerVeterinarioTipoConsulta(idVeterinario: number, idTipoConsulta: number): Observable<void> {
    return this.http.delete<void>(`${this.URL}/remover-veterinario-tipo-consulta/${idVeterinario}/${idTipoConsulta}`, {});
  }

  public buscarDetalhesEspecializacoes(idEspecializacao: number): Observable<DetalhesEspecializacaoDto> {
    return this.http.get<DetalhesEspecializacaoDto>(`${this.URL}/especializacoes/${idEspecializacao}`);
  }

  public adicionarNovaEspecializacao(form: EspecializacaoForm): Observable<void> {
    return this.http.post<void>(`${this.URL}/especializacoes`, form);
  }

  public gerarRelatorioConsultas(form: FiltroConsultaForm): Observable<Blob> {
    return this.http.put(`${this.URL}/relatorio`, form, { responseType: 'blob' });
  }

  public adicionarVeterinarioEspecializacao(idEspecializacao: number, idVeterinario: number): Observable<void> {
    return this.http.put<void>(`${this.URL}/especializacoes/${idEspecializacao}/${idVeterinario}`, {});
  }

  public removerVeterinarioEspecializacao(idEspecializacao: number, idVeterinario: number): Observable<void> {
    return this.http.delete<void>(`${this.URL}/especializacoes/${idEspecializacao}/${idVeterinario}`, {});
  }

  public excluirEspecializacao(idEspecializacao: number): Observable<void> {
    return this.http.delete<void>(`${this.URL}/especializacoes/${idEspecializacao}`);
  }

  public excluirTipoConsulta(idTipoConsulta: number): Observable<void> {
    return this.http.delete<void>(`${this.URL}/tipos-consulta/${idTipoConsulta}`);
  }
}
