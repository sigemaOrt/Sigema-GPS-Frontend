import { Injectable, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, fromEvent, Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Login } from '../models/Login';

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
    // Observables de actividad
    this.setupActivityEvents();
  }

  /** LOGIN */
  login(loginData: Login): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, loginData);
  }

  /** TOKEN */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /** LOGOUT */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }
    this.teardownActivityMonitoring();
    this.ngZone.run(() => this.router.navigate(['/login']));
  }

  /** INACTIVITY */
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
