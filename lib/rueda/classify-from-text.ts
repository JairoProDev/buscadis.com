import type { Categoria } from '@/types';

/** Clasificación conservadora para avisos Rueda (empleo vs inmueble vs servicio). */
export function classifyRuedaListing(titulo: string, descripcion: string): Categoria {
  const t = `${titulo} ${descripcion}`.toLowerCase();
  const tituloLower = titulo.toLowerCase().trim();

  // El titular del aviso manda: muchos inmuebles mencionan "se requiere" en el cuerpo.
  if (
    /^(se alquila|alquilo|en alquiler|se vende|vendo|venta de|anticresis|traspaso local)/i.test(
      tituloLower,
    ) ||
    /^(local comercial|habitaci[oó]n|departamento|terreno|lote|casa |mini departamento|oficina )/i.test(
      tituloLower,
    )
  ) {
    return 'inmuebles';
  }

  if (
    /^(se requiere|se solicita|se necesita|buscamos|necesitamos|vacante|oportunidad laboral|trabajo|personal para|únete|unete)/i.test(
      tituloLower,
    ) ||
    /\b(cv|curr[ií]culum)\b/i.test(tituloLower)
  ) {
    return 'empleos';
  }

  const isEmpleo =
    /niñer|nan[ny]|requeri|necesitamos|se necesita|se requiere|vacante|curriculum|currículum|\bcv\b|sueldo|personal para |mozos?|cociner|ayudante|chofer|conductor|recepcionista|practicante|oferta laboral|busca personal|solicita personal|postula|housekeeping|maitre|barman|meser|meser[ao]|operador de|trabajo inmediato|únete|unete|ampliamos plantilla/.test(
      t
    );
  const isInmueble =
    /\bdepartamentos?\b|\bambientes?\b|anticresis|habitaci[oó]n|alquilo|se alquila|en alquiler|terreno|casa ampl|vendo casa|vendo edificio|se vende terreno|en venta terreno|vendo terreno|vendo lote|local comercial|oficina en |inmueble|canch[oó]n|lote de |lotes de |lote \d|airbnb|condominio|m²|m2|hect[aá]reas?|registros p[uú]blicos|rr\.?\s*pp|mini departamento|alquiler de|se alquila local|alquiler de local/.test(
      t
    );
  const isVehiculo =
    /\b(auto|carro|camioneta|motocicleta)\b|kilometraje|toyota |hyundai |nissan |chevrolet |kia /.test(t);
  const isNegocio =
    /traspaso|negocio en marcha|fondo de comercio|cafeter[ií]a en venta|restaurante en venta|poller[ií]a en venta/.test(
      t
    );
  const isServicio =
    /peluquer[ií]a|econ[oó]micos|grooming|baño de gato|baño de perro|veterinar|cl[ií]nica dental|gasfiter|electricista|plomer|servicio de |clases de |reparaci[oó]n|limpieza a domicilio|taxi|mudanza|diseño gráfico|fotograf[ií]a|est[eé]tica|barber[ií]a|spa |tatuaje|abogad|contador|psic[oó]log/.test(
      t
    );
  const isEvento = /fiesta|evento|show|concierto|entrada/.test(t);

  if (isServicio && !isEmpleo && !isInmueble) return 'servicios';
  if (isInmueble && !/^(se requiere|buscamos personal|vacante)/i.test(tituloLower)) return 'inmuebles';
  if (isEmpleo && !/vendo |vendo terreno|se vende|alquilo local|se alquila/.test(tituloLower)) {
    return 'empleos';
  }
  if (isInmueble) return 'inmuebles';
  if (isVehiculo) return 'vehiculos';
  if (isNegocio) return 'negocios';
  if (isEvento) return 'eventos';
  if (isEmpleo) return 'empleos';
  if (/vendo|venta|remato/.test(t) && !/departamento|casa |terreno|local |oficina|habitaci|alquilo/.test(t)) {
    return 'productos';
  }
  return 'productos';
}
