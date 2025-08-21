import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TrabajoService {
  private appsigemagpsUrl = 'https://sigemabe2-c6g2gzdkcthfevfz.canadacentral-01.azurewebsites.net/api/posiciones';

  private trabajoActivoSubject = new BehaviorSubject<boolean>(false);
  public trabajoActivo$ = this.trabajoActivoSubject.asObservable();

  private equipoEnTrabajoId: number | null = null;

  constructor(private http: HttpClient) {}

  hayTrabajoActivo(): boolean {
    return this.trabajoActivoSubject.value;
  }

  getEquipoEnTrabajo(): number | null {
    return this.equipoEnTrabajoId;
  }

  iniciarTrabajo(idEquipo: number, lat: number, lon: number): Observable<any> {
    if (this.hayTrabajoActivo()) {
      return throwError(() => ({
        error: 'Ya hay un trabajo en progreso. Debe finalizar el trabajo actual antes de iniciar uno nuevo.',
        status: 409
      }));
    }

    const body = { latitud: lat, longitud: lon };
    return this.http.post<any>(`${this.appsigemagpsUrl}/iniciarTrabajo/${idEquipo}`, body)
      .pipe(
        map(res => {
          this.trabajoActivoSubject.next(true);
          this.equipoEnTrabajoId = idEquipo;
          return res;
        })
      );
  }

  finalizarTrabajo(idEquipo: number, lat: number, lon: number, em: string[]): Observable<any> {
    const body = { latitud: lat, longitud: lon, email: em };
    return this.http.post<any>(`${this.appsigemagpsUrl}/finalizarTrabajo/${idEquipo}`, body)
      .pipe(
        map(res => {
          this.trabajoActivoSubject.next(false);
          this.equipoEnTrabajoId = null;
          return res;
        })
      );
  }

  getEstaEnUso(idEquipo: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.appsigemagpsUrl}/${idEquipo}/enUso`);
  }

  // 🔹 ahora este es el método que reemplaza "trabajoActivo"
  puedeIniciarTrabajo(idEquipo: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.appsigemagpsUrl}/puedeIniciarTrabajo/${idEquipo}`)
      .pipe(
        map(puede => {
          if (!puede) {
            // si NO puede iniciar, entonces significa que hay uno en curso
            this.trabajoActivoSubject.next(true);
            this.equipoEnTrabajoId = idEquipo;
          }
          return puede;
        }),
        catchError(err => {
          console.error('Error verificando si puede iniciar trabajo', err);
          return of(false);
        })
      );
  }
}
