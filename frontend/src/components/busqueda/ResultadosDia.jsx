import TarjetaTurno       from './TarjetaTurno';
import { formatearFecha } from '@/lib/fecha';

export default function ResultadosDia({ dia }) {
  return (
    <section aria-label={`Turnos del ${dia.fecha}`}>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-base font-semibold text-gray-800 capitalize">
          {formatearFecha(dia.fecha)}
        </h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {dia.turnos.length} {dia.turnos.length === 1 ? 'turno' : 'turnos'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {dia.turnos.map((turno, i) => (
          <TarjetaTurno
            key={`${turno.medico.id}-${turno.hora}-${turno.servicio.id}-${i}`}
            turno={turno}
            fecha={dia.fecha}
          />
        ))}
      </div>
    </section>
  );
}
