import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app/app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { init } from '@tma.js/sdk';
import { initDataInterceptor } from './app/interceptors/init-data.interceptor';
import { environment } from './environments/environment';

// Telegram WebApp type declaration
declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

// Initialize Telegram Mini Apps SDK only when running in Telegram Mini Apps
// For local web development, we skip this initialization
const isTelegramMiniApp = window.Telegram?.WebApp !== undefined;

if (isTelegramMiniApp || environment.production) {
  try {
    init();
  } catch (error) {
    console.warn('Failed to initialize Telegram SDK:', error);
  }
}

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([initDataInterceptor])),
    provideRouter(routes),
    provideAnimations(),
  ],
}).catch((err) => console.error(err));
