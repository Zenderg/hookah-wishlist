import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpInterceptorFn,
} from '@angular/common/http';
import { Observable } from 'rxjs';

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

  return next(req);
};
