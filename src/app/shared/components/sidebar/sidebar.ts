import { Component, inject } from '@angular/core';
import type { Route, Routes } from '@angular/router';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { TokenService } from '../../../core/services/token-service';
import { PrimeNGModule } from '../../modules/prime-ng/prime-ng-module';
import { ThemeService } from '../../../core/services/theme-service';
import { RotasService } from '../../../core/services/rotas-service';
import type { ListOfRoutes, RoutesModel } from '../../models/RoutesModel';
import { NotificacoesWsService } from '../../services/ws/notificacoes-ws-service';
import { environment } from '../../../../environments/environment';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'sidebar',
  imports: [RouterModule, PrimeNGModule, BadgeModule, OverlayBadgeModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  public sidebarIsOpen = false;
  public listOfRoutes: ListOfRoutes[] = [];
  private subMenuStates: Record<string, boolean> = {};
  public urlImagem = '';

  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);
  private readonly rotasService = inject(RotasService);
  private readonly notificacoesWs = inject(NotificacoesWsService);

  constructor() {
    this.carregarRotasPermitidas();
    this.urlImagem = this.getImagemUsuario;
  }

  /**
   *
   * @description Verifica se a rota está ativa comparando o caminho da rota com o caminho atual do router
   * @param route - {RoutesModel} - Rota a ser verificada
   * @returns - {boolean} - Verdadeiro se a rota estiver ativa
   */
  public rotaEstaAtiva(route: RoutesModel): boolean {
    return route.path === this.router.url;
  }

  /**
   *
   * @description Carrega as rotas permitidas para o usuário a partir do serviço de rotas e as converte para o formato do sidebar
   */
  private carregarRotasPermitidas(): void {
    this.listOfRoutes = [];
    this.listOfRoutes = this.converterRotas(
      this.rotasService.getAllowedRoutes(),
    );
  }

  /**
   *
   * @description Converte as rotas do formato do Angular para o formato do sidebar
   * @param routes - {Routes} - Rotas a serem convertidas
   * @returns - {ListOfRoutes[]} - Rotas convertidas para o formato do sidebar
   */
  private converterRotas(routes: Routes): ListOfRoutes[] {
    const listOfRoutes: ListOfRoutes[] = [];
    routes.forEach((route: Route) => {
      if (route.data && route.data['visible']) {
        const groupName = route.data['group'] || '';
        let group = listOfRoutes.find((g) => g.groupName === groupName);
        if (!group) {
          group = { groupName, routes: [] };
          listOfRoutes.push(group);
        }
        group.routes.push({
          path: route.path || '',
          title: route.data['title'],
          component: route.component,
          data: {
            visible: (route.data['visible'] as boolean) || false,
            RULES: (route.data['RULES'] as string[]) || [''],
            nome: (route.data['nome'] as string) || '',
            icone: (route.data['icone'] as string) || '',
          },
          canActivate: route.canActivate,
          pathMatch: route.pathMatch,
        });
      }
    });
    return listOfRoutes;
  }

  /**
   *
   * @description Altera o estado da sidebar entre aberto e fechado
   */
  public mudarEstadoSidebar(): void {
    this.sidebarIsOpen = !this.sidebarIsOpen;
  }

  /**
   *
   * @description Busca o nome do usuário e o tipo de usuário a partir do token e os retorna
   * @returns - {nome: string, tipo: string} - Nome do usuário e tipo de usuário
   */
  public get getNomeUsuario(): { nome: string; tipo: string } {
    const token = this.tokenService.getToken;
    if (!token)
      return {
        nome: '',
        tipo: '',
      };
    const nomeUsuario = this.tokenService.decodeToken(token).nomeUsuario;
    const permissoes: string = this.tokenService.decodeToken(token).permissao;
    const permisaoTratada =
      permissoes.charAt(0).toUpperCase() +
      permissoes.slice(1).toLocaleLowerCase();

    return {
      nome: nomeUsuario,
      tipo: permisaoTratada,
    };
  }

  private get getImagemUsuario(): string {
    const token = this.tokenService.getToken;
    if (!token) return '';
    const idUsuario = this.tokenService.decodeToken(token).id_usuario;
    console.log('idUsuario', idUsuario);
    return idUsuario !== ''
      ? environment.apiUrl + '/arquivos/usuario/' + idUsuario
      : '';
  }

  /**
   *
   * @description Remove o token e efetua o logout do usuário
   */
  public sairPerfil(): void {
    this.tokenService.removeToken();
    this.notificacoesWs.disconnect();
  }

  /**
   *
   * @description Navega para a página de perfil do usuário
   */
  public acessarPerfil(): void {
    const tipoUsuario = this.getNomeUsuario.tipo.toLocaleLowerCase();
    this.router.navigate([`/${tipoUsuario}/perfil`]);
  }

  /**
   *
   * @description Altera o estado do submenu entre aberto e fechado
   * @param i - {number} - Índice da rota
   * @param j - {number} - Índice da sub-rota
   */
  public mudarEstadoSubMenu(i: number, j: number): void {
    const key = `${i}-${j}`;
    this.subMenuStates[key] = !this.subMenuStates[key];
  }

  /**
   *
   * @description Verifica se o submenu está aberto ou fechado
   * @param i - {number} - Índice da rota
   * @param j - {number} - Índice da sub-rota
   * @returns - {boolean} - Verdadeiro se o submenu estiver aberto
   */
  public subMenuEstaAberto(i: number, j: number): boolean {
    const key = `${i}-${j}`;
    return !!this.subMenuStates[key];
  }

  public get telaMenor(): boolean {
    const largura = window.innerWidth || document.documentElement.clientWidth;
    return largura <= 768;
  }
}
