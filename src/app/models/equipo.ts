export class Equipo {
  id!: number;
  matricula!: string;
  observaciones!: string;
  cantidadUnidadMedida!: number;
  latitud!: number;
  longitud!: number;
  estado!: string;

  estaEnUso?: boolean;

  modeloEquipo?: {
    modelo: string;
    anio: number;
    capacidad: number;
    unidadMedida: string;
    tipoEquipo: {
      nombre: string;
    };
    marca: {
      nombre: string;
    };
  };

  unidad?: {
    id: number;
    nombre: string;
    latitud: number;
    longitud: number;
    emails: string[];
  };
}
