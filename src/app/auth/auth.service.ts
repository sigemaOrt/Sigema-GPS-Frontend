import { Injectable, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, fromEvent, Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Login } from '../models/Login';
import { TrabajoService } from '../services/TrabajoService';

interface LoginResponse {
  token: string;
  rol: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private apiUrl = 'https://sigemabe-d0gke3fdbnfza9et.canadacentral-01.azurewebsites.net/api';
  private inactivityTimeout: any;
  private readonly INACTIVITY_TIME_MS = 30 * 60 * 1000;

  private activitySubscription: Subscription | undefined;

  constructor(
    private http: HttpClient,
    private router: Router,
    private ngZone: NgZone
  ) { 
    this.setupActivityEvents();
  }

  login(loginData: Login): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, loginData);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

logout(): void {
  // Si hay un trabajo activo, finalizarlo primero
  const trabajoService = (window as any)['trabajoService'] as TrabajoService | undefined;
  if (trabajoService?.hayTrabajoActivo()) {
    const equipoId = trabajoService.getEquipoEnTrabajo();
    if (equipoId != null) {
      // Obtenemos la ubicación actual antes de finalizar (opcional)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          trabajoService.finalizarTrabajo(
            equipoId,
            pos.coords.latitude,
            pos.coords.longitude,
            [] // o pasar los emails si los tenés
          ).subscribe({
            next: () => console.log('Trabajo finalizado antes de logout'),
            error: () => console.log('Error al finalizar trabajo antes de logout')
          });
        },
        () => {
          // Si no hay ubicación, igual intentamos finalizar sin coords
          trabajoService.finalizarTrabajo(equipoId, 0, 0, []).subscribe();
        }
      );
    }
  }

  // Limpiamos token y timer
  localStorage.removeItem('token');
  localStorage.removeItem('rol');
  if (this.inactivityTimeout) {
    clearTimeout(this.inactivityTimeout);
    this.inactivityTimeout = null;
  }
  this.teardownActivityMonitoring();
  this.ngZone.run(() => this.router.navigate(['/login']));
}


  private startInactivityTimer(): void {
    if (this.inactivityTimeout) clearTimeout(this.inactivityTimeout);
    this.inactivityTimeout = setTimeout(() => this.logout(), this.INACTIVITY_TIME_MS);
  }

  private resetInactivityTimer(): void {
    if (this.getToken()) this.startInactivityTimer();
  }

  private setupActivityEvents(): void {
    const events = ['mousemove', 'click', 'keypress', 'scroll'];
    events.forEach(ev => {
      fromEvent(document, ev).subscribe(() => this.resetInactivityTimer());
    });
  }

  private teardownActivityMonitoring(): void {
    if (this.activitySubscription) {
      this.activitySubscription.unsubscribe();
      this.activitySubscription = undefined;
    }
  }

  ngOnDestroy(): void {
    this.teardownActivityMonitoring();
    if (this.inactivityTimeout) clearTimeout(this.inactivityTimeout);
  }
}
