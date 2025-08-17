import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Equipo } from '../models/equipo';
import { HttpClient } from '@angular/common/http'; // <-- Importa HttpClient
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EquipoService {
  private apiUrl = 'https://sigemabe-d0gke3fdbnfza9et.canadacentral-01.azurewebsites.net/api/equipos';

  // Inyecta HttpClient en el constructor
  constructor(private http: HttpClient) {}

  obtenerEquipos(): Observable<Equipo[]> {
    return this.http.get<Equipo[]>(this.apiUrl).pipe(
      map(data => data) // La respuesta ya está tipada, no es necesario hacer un casting explícito
    );
  }
}