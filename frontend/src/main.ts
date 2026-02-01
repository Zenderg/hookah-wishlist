import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app/app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { init } from '@tma.js/sdk';

// Initialize Telegram Mini Apps SDK before bootstrapping the app
init();

bootstrapApplication(AppComponent, {
  providers: [provideHttpClient(), provideRouter(routes), provideAnimations()],
}).catch((err) => console.error(err));
