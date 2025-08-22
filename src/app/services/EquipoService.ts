import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Equipo } from '../models/equipo';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class EquipoService {
  private apiUrl =
    'https://sigemabe-d0gke3fdbnfza9et.canadacentral-01.azurewebsites.net/api/equipos';

  constructor(private http: HttpClient, private authService: AuthService) {}

  obtenerEquipos(): Observable<Equipo[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`,
    });
    return this.http
      .get<Equipo[]>(this.apiUrl, { headers })
      .pipe(map((data) => data));
  }
}
