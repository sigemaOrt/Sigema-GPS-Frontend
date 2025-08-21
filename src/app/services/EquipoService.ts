import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Equipo } from '../models/equipo';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EquipoService {
  private apiUrl = 'https://sigemabe-d0gke3fdbnfza9et.canadacentral-01.azurewebsites.net/api/equipos';

  constructor(private http: HttpClient) {}

  obtenerEquipos(): Observable<Equipo[]> {
    return this.http.get<Equipo[]>(this.apiUrl).pipe(
      map(data => data)
    );
  }
}