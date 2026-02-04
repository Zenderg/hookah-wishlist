import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpInterceptorFn,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { retrieveRawInitData } from '@tma.js/sdk';

export const initDataInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  // Try to retrieve init data from SDK first (most reliable source)
  let initDataRaw: string | null = null;

  try {
    // Check if we're running in Telegram Mini Apps
    const isTelegramMiniApp = window.Telegram?.WebApp !== undefined;

    if (isTelegramMiniApp) {
      const sdkInitData = retrieveRawInitData();
      initDataRaw = sdkInitData || null;
      console.debug('Retrieved init data from Telegram SDK');
    }
  } catch (error) {
    console.warn('Failed to retrieve init data from Telegram SDK:', error);
  }

  // Fall back to localStorage if SDK retrieval failed
  if (!initDataRaw) {
    initDataRaw = localStorage.getItem('initDataRaw');
    if (initDataRaw) {
      console.debug('Retrieved init data from localStorage');
    }
  }

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

  // In production, log a warning but still send the request
  // This allows graceful degradation if init data is temporarily unavailable
  console.warn(
    'No Telegram init data available in production. This may cause authentication errors.'
  );
  return next(req);
};
