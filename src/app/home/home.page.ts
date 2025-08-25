import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, Observable, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import Swal from 'sweetalert2'; // 👈 Importar librería
import { Equipo } from '../models/equipo';
import { FiltroPorMatriculaPipe } from '../home/filtro-por-matricula';
import { TrabajoService } from '../services/TrabajoService';
import { EquipoService } from '../services/EquipoService';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, FormsModule, FiltroPorMatriculaPipe],
})
export class HomeComponent implements OnInit, OnDestroy {
  equipos: Equipo[] = [];
  filtroMatricula: string = '';
  hayTrabajoActivo: boolean = false;
  equipoEnTrabajoId: number | null = null;
  estaActualizando: boolean = false;

  private trabajoSubscription?: Subscription;

  constructor(
    private equipoService: EquipoService,
    private trabajoService: TrabajoService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.cargarEquipos();
    this.suscribirseAEstadoTrabajo();
  }

  ngOnDestroy() {
    this.trabajoSubscription?.unsubscribe();
  }

  private suscribirseAEstadoTrabajo() {
    this.trabajoSubscription = this.trabajoService.trabajoActivo$.subscribe(
      (activo) => {
        this.hayTrabajoActivo = activo;
        this.equipoEnTrabajoId = this.trabajoService.getEquipoEnTrabajo();
      }
    );
  }

cargarEquipos() {
  this.estaActualizando = true;
  this.equipoService
    .obtenerEquipos()
    .pipe(finalize(() => (this.estaActualizando = false)))
    .subscribe({
      next: (equipos: Equipo[]) => {
        if (equipos.length === 0) {
          this.equipos = [];
          return;
        }

        
        if (this.trabajoService.hayTrabajoActivo()) {
          const equipoId = this.trabajoService.getEquipoEnTrabajo();
          this.equipos = equipos.filter((e) => e.id === equipoId);
          this.mostrarMensaje('Equipos actualizados (trabajo activo)', 'info');
          return;
        }

       
        const checks = equipos.map((equipo) =>
          this.trabajoService.getEstaEnUso(equipo.id).pipe(
            catchError(() => of(true)) 
          )
        );

        forkJoin(checks).subscribe((estados: boolean[]) => {
          this.equipos = equipos.filter((_, i) => !estados[i]); 
          this.mostrarMensaje('Equipos disponibles actualizados', 'success');
        });
      },
      error: () => {
        this.mostrarMensaje(
          'Error al cargar los equipos. Intente de nuevo más tarde.',
          'error'
        );
      },
    });
}

  actualizarEquipos() {
    this.estaActualizando = true;
    this.equipoService
      .obtenerEquipos()
      .pipe(finalize(() => (this.estaActualizando = false)))
      .subscribe({
        next: (data: Equipo[]) => {
          this.equipos = data;
          this.cargarEstadoUsoEquipos();
          this.mostrarMensaje('Equipos actualizados correctamente', 'success');
        },
        error: () => {
          this.mostrarMensaje('Error al actualizar los equipos.', 'error');
        },
      });
  }

  actualizacionRapida() {
    if (this.estaActualizando) {
      this.mostrarMensaje('Ya se está actualizando...', 'info');

      return;
    }

    this.cargarEquipos();
  }

  cargarEstadoUsoEquipos() {
    if (this.equipos.length === 0) return;

    const estadoObservables: Observable<boolean>[] = this.equipos.map(
      (equipo) =>
        this.trabajoService
          .getEstaEnUso(equipo.id)
          .pipe(catchError(() => of(false)))
    );

    forkJoin(estadoObservables).subscribe({
      next: (results: boolean[]) => {
        this.equipos.forEach((equipo, i) => (equipo.estaEnUso = results[i]));
      },

      error: () =>
        this.mostrarMensaje(
          'No se pudo verificar el estado de los equipos.',
          'error'
        ),
    });
  }

  puedeIniciarTrabajo(equipoId: number): boolean {
    return !(this.hayTrabajoActivo && this.equipoEnTrabajoId !== equipoId);
  }

  getTextoBoton(equipo: Equipo): string {
    if (equipo.estaEnUso) return 'Finalizar Trabajo';

    if (this.hayTrabajoActivo && this.equipoEnTrabajoId !== equipo.id)
      return 'Trabajo en Progreso';

    return 'Iniciar Trabajo';
  }

  isBotonDeshabilitado(equipo: Equipo): boolean {
    if (equipo.estaEnUso) return false;

    return this.hayTrabajoActivo && this.equipoEnTrabajoId !== equipo.id;
  }

  toggleEstado(equipoId: number, estaIniciadoActual: boolean) {
    if (!estaIniciadoActual && !this.puedeIniciarTrabajo(equipoId)) {
      this.mostrarMensaje(
        'No se puede iniciar un nuevo trabajo. Ya hay un trabajo en progreso.',
        'warning'
      );

      return;
    }

    estaIniciadoActual
      ? this.finalizarTrabajo(equipoId)
      : this.iniciarTrabajo(equipoId);
  }

  private iniciarTrabajo(equipoId: number) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        this.trabajoService.iniciarTrabajo(equipoId, lat, lon).subscribe({
next: () => {
  const equipo = this.equipos.find((e) => e.id === equipoId);
  if (equipo) {
    equipo.estaEnUso = true;
    this.equipos = [equipo]; 
  }
  this.equipoEnTrabajoId = this.trabajoService.getEquipoEnTrabajo();
  this.hayTrabajoActivo = true;
  this.mostrarMensaje('Trabajo iniciado exitosamente.', 'success');
},

          error: () =>
            this.mostrarMensaje('Error al iniciar el trabajo.', 'error'),
        });
      },
      (err) => this.manejarErrorGeolocation(err, 'iniciar')
    );
  }

  private finalizarTrabajo(equipoId: number) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const equipo = this.equipos.find((e) => e.id === equipoId);
        
        this.trabajoService
          .finalizarTrabajo(equipoId, lat, lon, equipo?.unidad?.emails ?? [])
          .subscribe({
            next: () => {
              if (equipo) equipo.estaEnUso = false;

              this.mostrarMensaje(
                'Trabajo finalizado exitosamente.',
                'success'
              );
            },
            error: (error) =>
              this.mostrarMensaje('Error al finalizar el trabajo. ' + error.error, 'error'),
          });
      },
      (err) => this.manejarErrorGeolocation(err, 'finalizar')
    );
  }

  private manejarErrorGeolocation(
    error: GeolocationPositionError,
    accion: string
  ) {
    let msg = `No se pudo obtener ubicación para ${accion} el trabajo.`;
    if (error.code === error.PERMISSION_DENIED)
      msg = `Permiso de ubicación denegado.`;
    if (error.code === error.POSITION_UNAVAILABLE)
      msg = `Ubicación no disponible.`;
    if (error.code === error.TIMEOUT) msg = `Tiempo de espera agotado.`;
    this.mostrarMensaje(msg, 'error');
  }

  private mostrarMensaje(
    msg: string,
    icon: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) {
    Swal.fire({
      text: msg,
      icon: icon,
      confirmButtonText: 'OK',
      confirmButtonColor: '#3085d6',
    });
  }

  logout() {
    this.authService.logout();
  }
}
