import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // <-- Importa HttpClient
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { PosicionClienteDTO } from '../models/posicionClienteDTO';

@Injectable({
  providedIn: 'root',
})
export class TrabajoService {
  private appsigemagpsUrl =
    'https://sigemabe2-c6g2gzdkcthfevfz.canadacentral-01.azurewebsites.net/api/posiciones';

  private trabajoActivoSubject = new BehaviorSubject<boolean>(false);
  public trabajoActivo$ = this.trabajoActivoSubject.asObservable();

  private equipoEnTrabajoId: number | null = null;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private obtenerToken(): string | null {
    return this.authService.getToken();
  }

  hayTrabajoActivo(): boolean {
    return this.trabajoActivoSubject.value;
  }

  getEquipoEnTrabajo(): number | null {
    return this.equipoEnTrabajoId;
  }

  setEquipoEnTrabajo(id: number | null): void {
    this.equipoEnTrabajoId = id;

    if (id === null) {
      this.trabajoActivoSubject.next(false);
      this.trabajoActivo$ = of(false);
    }
  }

  iniciarTrabajo(
    idEquipo: number,
    lat: number,
    lon: number,
    unidadMedida: string
  ): Observable<any> {
    if (this.hayTrabajoActivo()) {
      return throwError(() => ({
        error:
          'Ya hay un trabajo en progreso. Debe finalizar el trabajo actual antes de iniciar uno nuevo.',
        status: 409,
      }));
    }

    const body = { latitud: lat, longitud: lon, unidadMedida: unidadMedida };
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`,
    });
    return this.http
      .post<any>(`${this.appsigemagpsUrl}/iniciarTrabajo/${idEquipo}`, body, {
        headers,
      })
      .pipe(
        map((res) => {
          this.trabajoActivoSubject.next(true);
          this.equipoEnTrabajoId = idEquipo;
          return res;
        })
      );
  }

  agregarPosicion(
    idEquipo: number,
    lat: number,
    lon: number,
    unidadMedida: string
  ): Observable<any> {
    const body = { latitud: lat, longitud: lon, unidadMedida: unidadMedida };
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`,
    });
    return this.http
      .post<any>(`${this.appsigemagpsUrl}/agregarPosicion/${idEquipo}`, body, {
        headers,
      })
      .pipe(map((res) => {}));
  }

  finalizarTrabajo(
    idEquipo: number,
    lat: number,
    lon: number,
    unidadMedida: string,
    em: { id: number; email: string }[]
  ): Observable<any> {
    const posicionClienteDTO = new PosicionClienteDTO();
    posicionClienteDTO.latitud = lat;
    posicionClienteDTO.longitud = lon;
    posicionClienteDTO.unidadMedida = unidadMedida;
    posicionClienteDTO.emails = em ? em.map((e) => e.email) : [];
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`,
    });
    return this.http
      .post<any>(
        `${this.appsigemagpsUrl}/finalizarTrabajo/${idEquipo}`,
        posicionClienteDTO,
        {
          headers,
        }
      )
      .pipe(
        map((res) => {
          this.trabajoActivoSubject.next(false);
          this.equipoEnTrabajoId = null;
          return res;
        })
      );
  }

  getEstaEnUso(idEquipo: number): Observable<boolean> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`,
    });
    return this.http.get<boolean>(`${this.appsigemagpsUrl}/${idEquipo}/enUso`, {
      headers,
    });
  }
}
