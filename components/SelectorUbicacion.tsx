'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UbicacionDetallada } from '@/types';
import { 
  getDepartamentos, 
  getProvincias, 
  getDistritos, 
  getCoordenadasAproximadas 
} from '@/lib/peru-ubicaciones';
import { getCurrentLocation } from '@/lib/location';
import { IconLocation } from './Icons';
import { FaMapMarkerAlt, FaCrosshairs, FaTimes } from 'react-icons/fa';
import { bsMix, semantic } from '@/lib/bs-tokens';

interface SelectorUbicacionProps {
  value?: UbicacionDetallada;
  onChange: (ubicacion: UbicacionDetallada | undefined) => void;
  required?: boolean;
  label?: string;
}

export default function SelectorUbicacion({ 
  value, 
  onChange, 
  required = false,
  label = 'Ubicación'
}: SelectorUbicacionProps) {
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const [incluirUbicacion, setIncluirUbicacion] = useState(!!value);
  const [departamento, setDepartamento] = useState(value?.departamento || '');
  const [provincia, setProvincia] = useState(value?.provincia || '');
  const [distrito, setDistrito] = useState(value?.distrito || '');
  const [direccion, setDireccion] = useState(value?.direccion || '');
  const [obteniendoCoordenadas, setObteniendoCoordenadas] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const departamentos = getDepartamentos();
  const provincias = React.useMemo(() => departamento ? getProvincias(departamento) : [], [departamento]);
  const distritos = React.useMemo(() => (departamento && provincia) ? getDistritos(departamento, provincia) : [], [departamento, provincia]);

  // Resetear provincia y distrito cuando cambia el departamento
  useEffect(() => {
    if (departamento && !provincias.includes(provincia)) {
      setProvincia('');
      setDistrito('');
    }
  }, [departamento, provincia, provincias]);

  // Resetear distrito cuando cambia la provincia
  useEffect(() => {
    if (provincia && !distritos.includes(distrito)) {
      setDistrito('');
    }
  }, [provincia, distrito, distritos]);

  // Usar useRef para evitar loops infinitos
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Actualizar valor cuando cambian los campos (sin incluir onChange en dependencias)
  useEffect(() => {
    if (incluirUbicacion && departamento && provincia && distrito) {
      const coords = getCoordenadasAproximadas(departamento, provincia, distrito);
      const nuevaUbicacion: UbicacionDetallada = {
        pais: 'Perú',
        departamento,
        provincia,
        distrito,
        direccion: direccion.trim() || undefined,
        latitud: coords?.lat,
        longitud: coords?.lng
      };
      // Solo actualizar si cambió realmente
      const ubicacionActual = value;
      const cambioReal = !ubicacionActual || 
        ubicacionActual.departamento !== nuevaUbicacion.departamento ||
        ubicacionActual.provincia !== nuevaUbicacion.provincia ||
        ubicacionActual.distrito !== nuevaUbicacion.distrito ||
        ubicacionActual.direccion !== nuevaUbicacion.direccion;
      
      if (cambioReal) {
        onChangeRef.current(nuevaUbicacion);
      }
    } else if (!incluirUbicacion && value) {
      onChangeRef.current(undefined);
    }
  }, [incluirUbicacion, departamento, provincia, distrito, direccion, value]);

  const handleUsarMiUbicacion = async () => {
    setObteniendoCoordenadas(true);
    setError(null);
    
    try {
      const location = await getCurrentLocation();
      
      // Aquí podrías usar reverse geocoding para obtener departamento/provincia/distrito
      // Por ahora, solo actualizamos las coordenadas
      if (departamento && provincia && distrito) {
        onChange({
          pais: 'Perú',
          departamento,
          provincia,
          distrito,
          direccion: direccion.trim() || undefined,
          latitud: location.lat,
          longitud: location.lng
        });
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo obtener tu ubicación');
    } finally {
      setObteniendoCoordenadas(false);
    }
  };

  const handleLimpiar = () => {
    setDepartamento('');
    setProvincia('');
    setDistrito('');
    setDireccion('');
    setIncluirUbicacion(false);
    onChange(undefined);
  };

  const ubicacionCompleta = value && value.departamento && value.provincia && value.distrito;
  const textoUbicacion = ubicacionCompleta 
    ? `${value.distrito}, ${value.provincia}, ${value.departamento}`
    : 'Seleccionar ubicación';

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: 'var(--text-primary)',
          marginBottom: '0.5rem'
        }}>
          <IconLocation size={16} />
          {label}
          {required && <span style={{ color: semantic.dangerFg }}>*</span>}
          {!required && (
            <span style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-tertiary)',
              fontWeight: 400,
              marginLeft: 'auto'
            }}>
              (Opcional)
            </span>
          )}
        </label>
      </div>

      {!incluirUbicacion ? (
        <button
          type="button"
          onClick={() => setIncluirUbicacion(true)}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px dashed var(--border-color)',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--text-primary)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <FaMapMarkerAlt size={14} />
          Agregar ubicación
        </button>
      ) : (
        <div style={{
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '1rem',
          backgroundColor: 'var(--bg-primary)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <span style={{ 
              fontSize: '0.875rem', 
              fontWeight: 500,
              color: 'var(--text-primary)'
            }}>
              Ubicación del adiso
            </span>
            {!required && (
              <button
                type="button"
                onClick={handleLimpiar}
                style={{
                  padding: '0.25rem 0.5rem',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  borderRadius: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-tertiary)';
                }}
              >
                <FaTimes size={12} />
                Quitar
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Departamento */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: '0.25rem'
              }}>
                Departamento
              </label>
              <select
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                required={incluirUbicacion}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--text-primary)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-color)';
                }}
              >
                <option value="">Seleccionar departamento</option>
                {departamentos.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Provincia */}
            {departamento && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.25rem'
                }}>
                  Provincia
                </label>
                <select
                  value={provincia}
                  onChange={(e) => setProvincia(e.target.value)}
                  required={incluirUbicacion && !!departamento}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--text-primary)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <option value="">Seleccionar provincia</option>
                  {provincias.map(prov => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Distrito */}
            {provincia && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.25rem'
                }}>
                  Distrito
                </label>
                <select
                  value={distrito}
                  onChange={(e) => setDistrito(e.target.value)}
                  required={incluirUbicacion && !!provincia}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--text-primary)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <option value="">Seleccionar distrito</option>
                  {distritos.map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Dirección específica (opcional) */}
            {distrito && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.25rem'
                }}>
                  Dirección específica <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(Opcional)</span>
                </label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ej: Av. Principal 123, Mz A Lt 5"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--text-primary)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-color)';
                  }}
                />
              </div>
            )}

            {/* Botón para usar ubicación actual */}
            {distrito && (
              <button
                type="button"
                onClick={handleUsarMiUbicacion}
                disabled={obteniendoCoordenadas}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  cursor: obteniendoCoordenadas ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                  opacity: obteniendoCoordenadas ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!obteniendoCoordenadas) {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!obteniendoCoordenadas) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <FaCrosshairs size={12} />
                {obteniendoCoordenadas ? 'Obteniendo coordenadas...' : 'Usar mi ubicación actual (GPS)'}
              </button>
            )}

            {error && (
              <div style={{
                padding: '0.5rem',
                backgroundColor: bsMix('--bs-danger-fg', 10),
                border: `1px solid ${bsMix('--bs-danger-fg', 30)}`,
                borderRadius: '6px',
                color: semantic.dangerFg,
                fontSize: '0.75rem'
              }}>
                {error}
              </div>
            )}

            {/* Resumen de ubicación */}
            {ubicacionCompleta && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <FaMapMarkerAlt size={12} />
                <span>
                  {textoUbicacion}
                  {value?.direccion && `, ${value.direccion}`}
                  {value?.latitud && value?.longitud && (
                    <span style={{ color: 'var(--text-tertiary)', marginLeft: '0.5rem' }}>
                      ({value.latitud.toFixed(4)}, {value.longitud.toFixed(4)})
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

