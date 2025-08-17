import { Pipe, PipeTransform } from '@angular/core';
import { Equipo } from '../models/equipo';

@Pipe({
  name: 'filtroPorMatricula',
  standalone: true
})
export class FiltroPorMatriculaPipe implements PipeTransform {
  transform(equipos: Equipo[], filtro: string): Equipo[] {
    if (!equipos || !filtro) return equipos;
    const filtroLower = filtro.toLowerCase();
    return equipos.filter(e => e.matricula.toLowerCase().includes(filtroLower));
  }
}
