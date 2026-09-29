/* eslint-disable @angular-eslint/prefer-inject */
import { Injectable } from '@angular/core';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { Router } from '@angular/router';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { RotasService } from './rotas-service';
import { jwtDecode } from 'jwt-decode';
import type { TokenModel } from '../model/TokenModel';
import { ThemeService } from './theme-service';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  constructor(
    private router: Router,
    private rotasService: RotasService,
    private themeService: ThemeService
  ) {}

  /**
   * @description Decodifica o token
   * @param {string} token - O token a ser decodificado
   * @returns {any} - O token decodificado
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public decodeToken(token: string): any {
    try {
      return jwtDecode(token);
    } catch (Error) {
      console.error('Erro ao decodificar o token: ', Error);
      return null;
    }
  }

  public get getTokenPayload(): TokenModel | null {
    const token = this.decodeToken(this.getToken || '');
    if (!token) return null;
    
    return {
      email: token.sub,
      nomeUsuario: token.nomeUsuario,
      idUsuario: token.id_usuario,
      permissoes: token.permissao,
      imagem: token.imagem
    };
  }

  /**
   * @description Pega o token do localStorage
   * @returns {string | null} - O token ou null
   */
  public get getToken(): string | null {
    return localStorage.getItem('token') || null;
  }

  /**
   * @description Define o token no localStorage
   * @param {string} value - O token a ser definido
   */
  public setToken(value: string): void {
    if (!value || !this.tokenIsValid(value)) return;
    localStorage.setItem('token', value);
    localStorage.removeItem('ultimaRota');
    this.loadToken();
  }

  /**
   * @description Remove o token do localStorage
   */
  public removeToken(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  /**
   * @description Verifica se o token contém as regras necessárias para acessar a rota
   * @param {string[]} rules - As regras necessárias para acessar a rota
   * @returns {boolean} - Verdadeiro se o token contém as regras necessárias
   */
  public TokenHasRulesNecessaryToAccess(rules: string[]): boolean {
    if (this.getToken == null) return false;
    if (this.isTokenExpired(this.getToken)) return false;
    const token = this.decodeToken(this.getToken);
    const permissoes = token.permissoes;
    if (permissoes == null) return false;
    for (const rule of rules) {
      if (permissoes.includes(rule)) return true;
    }
    return false;
  }

  /**
   * @description Verifica se o token contém as regras necessárias para acessar a rota
   * @param {string} token - O token a ser verificado
   * @returns {boolean} - Verdadeiro se o token contém as regras necessárias
   */
  private tokenIsValid(token: string): boolean {
    return !this.isTokenExpired(token);
  }

  /**
   * @description Verifica se o token expirou
   * @param {string} token - A token a ser verificada
   * @returns {boolean} - Verdadeiro se o token expirou
   */
  public isTokenExpired(token: string): boolean {
    const decodedToken = this.decodeToken(token);
    if (decodedToken && decodedToken.exp) {
      const expirationDate = new Date(decodedToken.exp * 1000);
      return expirationDate < new Date();
    }
    return true;
  }

  /**
   * @description Carrega o token e define as rotas permitidas para o usuário
   */
  public loadToken(): void {
    const token = this.getToken;
    if (!token || this.isTokenExpired(token)) {
      this.removeToken();
      return;
    }
    const rule = this.decodeToken(token).permissao;
    const rotaPai = this.router.config.find((r) => {
      return r.data?.['RULE']?.includes(rule);
    });
    if (rotaPai) {
      this.rotasService.setarRotaPai(rotaPai.path || '');
      const rotasFilhas = rotaPai.children || [];
      this.router.resetConfig([...this.router.config]);
      this.rotasService.setAllowedRoutes(rotasFilhas);
      setTimeout(() => {
        const ultimaRotaAcessada =
          this.rotasService.ultimaRotaAcessada != '/unauthorized'
            ? this.rotasService.ultimaRotaAcessada
            : null;
        if (ultimaRotaAcessada) this.router.navigate([ultimaRotaAcessada]);
        else {
          if (rotasFilhas.length === 0) this.router.navigate([`/login`]);
          const primeiraRota = rotasFilhas[0].path;
          this.router.navigate([`/${rotaPai.path}/${primeiraRota}`]);
        }
      });
    } else {
      this.router.navigate(['/unauthorized']);
    }
  }
}
