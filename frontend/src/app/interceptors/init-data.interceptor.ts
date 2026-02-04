import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpInterceptorFn,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export const initDataInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const initDataRaw = localStorage.getItem('initDataRaw');

  if (initDataRaw) {
    const authReq = req.clone({
      setHeaders: {
        'X-Telegram-Init-Data': initDataRaw,
      },
    });
    return next(authReq);
  }

  // In development mode, skip adding init data header if not available
  // This allows local web development without Telegram Mini Apps context
  if (!environment.production) {
    console.debug('No init data available, skipping header for local development');
    return next(req);
  }

  return next(req);
};
