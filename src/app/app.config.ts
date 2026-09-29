import type { ApplicationConfig } from '@angular/core';
import {
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { tokenApiInterceptor } from './core/interceptors/token-api-interceptor';
import { responseApiInterceptor } from './core/interceptors/response-api-interceptor';
import { MessageService } from 'primeng/api';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import Aura from '@primeuix/themes/aura';

import { definePreset } from '@primeuix/themes';

const MinhaPaleta = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eaf5e8',
      100: '#cfe6ca',
      200: '#b1d6aa',
      300: '#92c689',
      400: '#74b769',
      500: '#3b7c2e',
      600: '#2c6622',
      700: '#1d5017',
      800: '#0f3b0b',
      900: '#002500',
    },
    secondary: {
      50: '#e8f5f9',
      100: '#cae6f1',
      200: '#a1d6e8',
      300: '#78c6e0',
      400: '#4fb6d8',
      500: '#248dab',
      600: '#1c738f',
      700: '#144e73',
      800: '#0c3857',
      900: '#031b3b',
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    MessageService,
    // { provide: LOCALE_ID, useValue: 'pt-BR' },
    provideAnimationsAsync(),
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withFetch(),
      withInterceptors([tokenApiInterceptor, responseApiInterceptor]),
    ),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    providePrimeNG({
      theme: {
        preset: MinhaPaleta,
        options: {
          darkModeSelector: '.dark',
        },
      },
      translation: {
        accept: 'Aceitar',
        reject: 'Rejeitar',
        dayNames: [
          'Domingo',
          'Segunda-feira',
          'Terça-feira',
          'Quarta-feira',
          'Quinta-feira',
          'Sexta-feira',
          'Sábado',
        ],
        dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
        dayNamesMin: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
        monthNames: [
          'Janeiro',
          'Fevereiro',
          'Março',
          'Abril',
          'Maio',
          'Junho',
          'Julho',
          'Agosto',
          'Setembro',
          'Outubro',
          'Novembro',
          'Dezembro',
        ],
        monthNamesShort: [
          'Jan',
          'Fev',
          'Mar',
          'Abr',
          'Mai',
          'Jun',
          'Jul',
          'Ago',
          'Set',
          'Out',
          'Nov',
          'Dez',
        ],
        today: 'Hoje',
        clear: 'Limpar',
        weekHeader: 'Sm',
      },
    }),
  ],
};
