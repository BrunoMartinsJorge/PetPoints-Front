import type { OnInit } from '@angular/core';
import { Component, inject, ViewChild } from '@angular/core';
import { PrimeNGModule } from '../../modules/prime-ng/prime-ng-module';
import { NotificacoesService } from '../../services/notificacoes-service';
import type { NotificacaoDto } from '../../services/ws/notificacoes-ws-service';
import { NotificacoesWsService } from '../../services/ws/notificacoes-ws-service';
import type { Popover } from 'primeng/popover';
import type { TiposNotificacoesEnum } from '../../models/enums/TiposNotificacoesEnum';
import { getIconPorTipo } from '../../models/enums/TiposNotificacoesEnum';

@Component({
  selector: 'app-notificacoes-pop',
  imports: [PrimeNGModule],
  templateUrl: './notificacoes-pop.html',
  styleUrl: './notificacoes-pop.scss',
})
export class NotificacoesPop implements OnInit {
  private readonly notificacoesWs = inject(NotificacoesWsService);
  private readonly notificacoesService = inject(NotificacoesService);
  @ViewChild('op') op!: Popover;

  ngOnInit(): void {
    this.notificacoesWs.connect();
    this.notificacoesService.notificacoes$.subscribe((n) => {
      this.notificacoes = n;
      this.ordenarNotificacoes();
    });
  }

  public fehcarPopover(): void {
    this.notificacoesParaMarcarComoLidas = [];
    this.notificacoesParaMarcarComoLidas = [
      ...this.notificacoesParaMarcarComoLidas,
    ];
    this.op.hide();
  }

  public notificacoes: NotificacaoDto[] = [];
  public foiAbertoNotificiacoes = false;
  public notificacoesParaMarcarComoLidas: number[] = [];

  public marcarComoLida(notificacao: NotificacaoDto): void {
    this.notificacoesService
      .marcarNotificacaoComoLida(notificacao.id)
      .subscribe({
        next: () => {
          this.notificacoes = this.notificacoes.filter(
            (n) => n.id !== notificacao.id,
          );
        },
      });
  }

  public alterarPopover(): void {
    this.op.toggle(event);
    this.foiAbertoNotificiacoes = true;
  }

  public getIcone(tipo: TiposNotificacoesEnum): string {
    return getIconPorTipo(tipo);
  }

  public notificacaoMarcadaComoLida(id: number): boolean {
    const notificacao = this.notificacoesParaMarcarComoLidas.find(
      (n) => n === id,
    );
    return notificacao ? true : false;
  }

  public ordenarNotificacoes(): void {
    if (this.notificacoes.length == 0 || this.notificacoes.length == 1) return;
    const valores = this.notificacoes;
    this.notificacoes = valores.sort(
      (a, b) => new Date(a.data).getTime() + new Date(b.data).getTime(),
    );
  }
}
