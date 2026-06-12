'use client';

import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { Adiso, AdisoFormData, Categoria, TamañoPaquete, PAQUETES, PaqueteInfo } from '@/types';
import { saveAdiso } from '@/lib/storage';
import { LIMITS, formatPhoneNumber, validatePhoneNumber, generarIdUnico } from '@/lib/utils';
import { normalizeContactoForApi, resolveUbicacionForPublish } from '@/lib/publish-helpers';
import { useAuth } from '@/hooks/useAuth';
import {
  IconEmpleos,
  IconInmuebles,
  IconVehiculos,
  IconServicios,
  IconProductos,
  IconEventos,
  IconNegocios,
  IconComunidad,
  IconTitle,
  IconDescription,
  IconLocation,
  IconPhone,
  IconMegaphone
} from './Icons';
import { FaImage, FaTrash, FaPlus, FaCheck, FaArrowRight, FaArrowLeft, FaInfoCircle } from 'react-icons/fa';
import SelectorUbicacion from './SelectorUbicacion';

interface FormularioPublicarProps {
  onPublicar: (adiso: Adiso) => void;
  onCerrar?: () => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
  modoGratuito?: boolean;
  dentroSidebar?: boolean;
  titulo?: string;
  categoriaPredefinida?: Categoria;
  ubicacionPredefinida?: any;
  esPaginaCompleta?: boolean;
}

interface ImagenPreview {
  id: string;
  file: File;
  preview: string;
}

type Paso = 1 | 2 | 3 | 4 | 5 | 6;

const CATEGORIAS: Categoria[] = [
  'empleos', 'inmuebles', 'vehiculos', 'servicios', 'productos', 'eventos', 'negocios', 'comunidad'
];

const CATEGORIA_PLACEHOLDERS: Record<Categoria, string> = {
  empleos: 'Ej: Busco desarrollador web full-time',
  inmuebles: 'Ej: Vendo departamento 2 habitaciones',
  vehiculos: 'Ej: Vendo auto 2020 en excelente estado',
  servicios: 'Ej: Ofrezco servicios de plomería',
  productos: 'Ej: Vendo bicicleta en buen estado',
  eventos: 'Ej: Concierto de rock este sábado',
  negocios: 'Ej: Oportunidad de negocio rentable',
  comunidad: 'Ej: Busco compañero de piso'
};

const CATEGORIA_NOMBRES: Record<Categoria, string> = {
  empleos: 'Empleos',
  inmuebles: 'Inmuebles',
  vehiculos: 'Vehículos',
  servicios: 'Servicios',
  productos: 'Productos',
  eventos: 'Eventos',
  negocios: 'Negocios',
  comunidad: 'Comunidad'
};

const getCategoriaIcon = (categoria: Categoria): React.ComponentType<{ size?: number; color?: string }> => {
  const iconMap: Record<Categoria, React.ComponentType<{ size?: number; color?: string }>> = {
    empleos: IconEmpleos,
    inmuebles: IconInmuebles,
    vehiculos: IconVehiculos,
    servicios: IconServicios,
    productos: IconProductos,
    eventos: IconEventos,
    negocios: IconNegocios,
    comunidad: IconComunidad,
  };
  return iconMap[categoria];
};

const PASOS_TOTALES = 6;
const PASOS_TOTALES_GRATUITO = 4; // Sin paquete ni imágenes

export default function FormularioPublicar({
  onPublicar,
  onCerrar,
  onError,
  onSuccess,
  modoGratuito = false,
  dentroSidebar = false,
  titulo: tituloCustom,
  categoriaPredefinida,
  ubicacionPredefinida,
  esPaginaCompleta = false
}: FormularioPublicarProps) {
  const [pasoActual, setPasoActual] = useState<Paso>(categoriaPredefinida ? 2 : 1);
  const [formData, setFormData] = useState<AdisoFormData>({
    categoria: categoriaPredefinida || 'empleos',
    titulo: '',
    descripcion: '',
    contacto: '',
    ubicacion: ubicacionPredefinida || undefined,
    tamaño: 'miniatura'
  });
  const [imagenesPreviews, setImagenesPreviews] = useState<ImagenPreview[]>([]);
  const [isDragOverImagenes, setIsDragOverImagenes] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof AdisoFormData, string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragImagenesCounterRef = useRef(0);
  const { user } = useAuth();

  const reportPublishError = (message: string) => {
    setPublishError(message);
    onError?.(message);
  };

  const totalPasos = modoGratuito ? PASOS_TOTALES_GRATUITO : PASOS_TOTALES;
  const progreso = (pasoActual / totalPasos) * 100;

  // Validación por paso
  const validarPaso = (paso: Paso): boolean => {
    const newErrors: Partial<Record<keyof AdisoFormData, string>> = {};
    let esValido = true;

    switch (paso) {
      case 1:
        // Categoría siempre tiene valor por defecto
        break;
      case 2:
        if (!formData.titulo.trim()) {
          newErrors.titulo = 'El título es requerido';
          esValido = false;
        } else {
          const maxTitulo = modoGratuito ? 30 : LIMITS.TITULO_MAX;
          if (formData.titulo.length > maxTitulo) {
            newErrors.titulo = `El título no puede exceder ${maxTitulo} caracteres`;
            esValido = false;
          }
        }
        if (!modoGratuito && !formData.descripcion.trim()) {
          newErrors.descripcion = 'La descripción es requerida';
          esValido = false;
        } else if (!modoGratuito && formData.descripcion.length > LIMITS.DESCRIPCION_MAX) {
          newErrors.descripcion = `La descripción no puede exceder ${LIMITS.DESCRIPCION_MAX} caracteres`;
          esValido = false;
        }
        break;
      case 3:
        // Solo validar si no es gratuito
        if (!modoGratuito && !formData.tamaño) {
          newErrors.tamaño = 'Selecciona un paquete';
          esValido = false;
        }
        break;
      case 4:
        if (!formData.contacto.trim()) {
          newErrors.contacto = 'El número de contacto es requerido';
          esValido = false;
        } else if (!validatePhoneNumber(formData.contacto)) {
          newErrors.contacto = 'Ingresa un número de teléfono válido (mínimo 8 dígitos)';
          esValido = false;
        }
        break;
      case 5:
        if (!modoGratuito && formData.tamaño) {
          const paqueteSeleccionado = PAQUETES[formData.tamaño];
          if (imagenesPreviews.length > paqueteSeleccionado.maxImagenes) {
            newErrors.tamaño = `El paquete "${paqueteSeleccionado.nombre}" permite máximo ${paqueteSeleccionado.maxImagenes} imagen${paqueteSeleccionado.maxImagenes !== 1 ? 'es' : ''}`;
            esValido = false;
          }
        }
        break;
    }

    // Solo actualizar errores si hay cambios reales
    const erroresActuales = Object.keys(newErrors).reduce((acc, key) => {
      const k = key as keyof AdisoFormData;
      if (newErrors[k]) {
        acc[k] = newErrors[k];
      }
      return acc;
    }, {} as Partial<Record<keyof AdisoFormData, string>>);

    const erroresAnteriores = Object.keys(errors).reduce((acc, key) => {
      const k = key as keyof AdisoFormData;
      if (errors[k]) {
        acc[k] = errors[k];
      }
      return acc;
    }, {} as Partial<Record<keyof AdisoFormData, string>>);

    const erroresCambiaron = JSON.stringify(erroresActuales) !== JSON.stringify(erroresAnteriores);

    if (erroresCambiaron) {
      setErrors(erroresActuales);
    }

    return esValido;
  };

  const siguientePaso = () => {
    const esValido = validarPaso(pasoActual);
    if (!esValido) return;

    // Saltar paso 3 (paquete) si es gratuito
    if (modoGratuito && pasoActual === 2) {
      setPasoActual(4);
    } else if (modoGratuito && pasoActual === 4) {
      // Saltar paso 5 (imágenes) si es gratuito
      setPasoActual(6);
    } else if (pasoActual < totalPasos) {
      setPasoActual((prev) => (prev + 1) as Paso);
    }
  };

  const pasoAnterior = () => {
    // Saltar paso 3 (paquete) si es gratuito
    if (modoGratuito && pasoActual === 4) {
      setPasoActual(2);
    } else if (modoGratuito && pasoActual === 6) {
      setPasoActual(4);
    } else if (pasoActual > 1) {
      setPasoActual((prev) => (prev - 1) as Paso);
    }
  };

  const agregarImagenes = (fileList: File[]) => {
    const files = fileList.filter((file) => file.type.startsWith('image/'));
    if (files.length === 0) {
      reportPublishError('Solo puedes arrastrar archivos de imagen (JPG, PNG, WebP, etc.).');
      return;
    }

    const paqueteSeleccionado = formData.tamaño ? PAQUETES[formData.tamaño] : PAQUETES.miniatura;
    const maxImagenes = paqueteSeleccionado.maxImagenes;
    const totalImagenes = imagenesPreviews.length + files.length;

    if (totalImagenes > maxImagenes) {
      reportPublishError(
        `El paquete "${paqueteSeleccionado.nombre}" permite máximo ${maxImagenes} imagen${maxImagenes !== 1 ? 'es' : ''}.`
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        reportPublishError('Una o más imágenes son demasiado grandes. Máximo 5MB por imagen.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const preview: ImagenPreview = {
          id: generarIdUnico(),
          file,
          preview: reader.result as string,
        };
        setImagenesPreviews((prev) => [...prev, preview]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    agregarImagenes(files);
  };

  const handleImagenesDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragImagenesCounterRef.current += 1;
    setIsDragOverImagenes(true);
  };

  const handleImagenesDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragImagenesCounterRef.current -= 1;
    if (dragImagenesCounterRef.current <= 0) {
      dragImagenesCounterRef.current = 0;
      setIsDragOverImagenes(false);
    }
  };

  const handleImagenesDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleImagenesDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragImagenesCounterRef.current = 0;
    setIsDragOverImagenes(false);
    agregarImagenes(Array.from(e.dataTransfer.files));
  };

  const handleRemoveImage = (idToRemove: string) => {
    setImagenesPreviews(prev => {
      const nuevas = prev.filter(img => idToRemove !== img.id);
      const removedImage = prev.find(img => idToRemove === img.id);
      if (removedImage) {
        URL.revokeObjectURL(removedImage.preview);
      }
      return nuevas;
    });
  };

  const subirImagenesAdiso = async (previews: ImagenPreview[]): Promise<string[]> => {
    const urls: string[] = [];

    for (const imgPreview of previews) {
      const formDataUpload = new FormData();
      formDataUpload.append('image', imgPreview.file);
      const uploadResponse = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'x-upload-type': 'adisos' },
        body: formDataUpload,
      });

      if (!uploadResponse.ok) {
        let uploadMsg = 'No se pudo subir una de las imágenes. Revisa tu conexión e intenta de nuevo.';
        try {
          const errBody = await uploadResponse.json();
          if (errBody?.error) uploadMsg = errBody.error;
        } catch {
          // usar mensaje por defecto
        }
        throw new Error(uploadMsg);
      }

      const uploadData = await uploadResponse.json();
      if (uploadData.url) {
        urls.push(uploadData.url);
      } else {
        throw new Error('La subida de imagen no devolvió una URL válida.');
      }
    }

    return urls;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (enviando) return;

    if (!validarPaso(6)) {
      reportPublishError('Por favor completa todos los campos requeridos');
      return;
    }

    setPublishError(null);
    setEnviando(true);

    try {
      const ahora = new Date();
      const fecha = ahora.toISOString().split('T')[0];
      const hora = ahora.toTimeString().split(' ')[0].substring(0, 5);
      const idUnico = generarIdUnico();
      const paqueteSeleccionado = PAQUETES[formData.tamaño || 'miniatura'];
      const contactoNormalizado = normalizeContactoForApi(formData.contacto);

      if (!validatePhoneNumber(contactoNormalizado)) {
        throw new Error('Ingresa un número de WhatsApp válido (mínimo 8 dígitos).');
      }

      let imagenesUrls: string[] | undefined;
      if (imagenesPreviews.length > 0) {
        if (paqueteSeleccionado.maxImagenes === 0) {
          throw new Error('El paquete Miniatura no permite imágenes. Elige otro paquete o quita las fotos.');
        }
        imagenesUrls = await subirImagenesAdiso(imagenesPreviews);
      }

      const nuevoAdiso: Adiso = {
        id: idUnico,
        categoria: formData.categoria,
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        contacto: contactoNormalizado,
        ubicacion: resolveUbicacionForPublish(formData.ubicacion),
        tamaño: formData.tamaño || 'miniatura',
        imagenesUrls,
        imagenUrl: imagenesUrls?.[0],
        fechaPublicacion: fecha,
        horaPublicacion: hora,
        estaActivo: true,
        esHistorico: false,
        user_id: user?.id,
        usuario_id: user?.id,
      };

      const adisoGuardado = await saveAdiso(nuevoAdiso);
      onPublicar(adisoGuardado);
      onSuccess?.('¡Adiso publicado con éxito!');
    } catch (error: unknown) {
      console.error('Error al publicar:', error);
      const err = error as { message?: string };
      let errorMessage = err?.message || 'No se pudo publicar el adiso. Por favor intenta nuevamente.';

      if (errorMessage.includes('fetch failed') || errorMessage.includes('network')) {
        errorMessage = 'Sin conexión a internet. Conéctate e intenta publicar de nuevo.';
      }

      reportPublishError(errorMessage);
    } finally {
      setEnviando(false);
    }
  };

  // Renderizar barra de progreso
  const renderProgreso = () => (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem'
      }}>
        <span style={{
          fontSize: '0.875rem',
          fontWeight: 500,
          color: 'var(--text-secondary)'
        }}>
          Paso {categoriaPredefinida ? pasoActual - 1 : pasoActual} de {categoriaPredefinida ? totalPasos - 1 : totalPasos}
        </span>
        <span style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--text-primary)'
        }}>
          {Math.round(categoriaPredefinida ? ((pasoActual - 1) / (totalPasos - 1)) * 100 : progreso)}%
        </span>
      </div>
      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${progreso}%`,
          height: '100%',
          backgroundColor: 'var(--brand-blue)',
          transition: 'width 0.3s ease',
          borderRadius: '4px'
        }} />
      </div>
    </div>
  );

  // Paso 1: Categoría - usar useRef para evitar loops
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCategoriaSelect = (categoria: Categoria) => {
    if (formData.categoria === categoria) return; // Evitar actualizaciones innecesarias

    // Limpiar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setFormData(prev => ({ ...prev, categoria }));

    // Auto-avanzar después de seleccionar
    timeoutRef.current = setTimeout(() => {
      siguientePaso();
      timeoutRef.current = null;
    }, 300);
  };

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const renderPaso1 = () => {
    const IconComponent = getCategoriaIcon(formData.categoria);

    return (
      <div>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}>
            ¿Qué tipo de anuncio quieres publicar?
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            margin: 0
          }}>
            Selecciona la categoría que mejor describe tu anuncio
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem'
        }}>
          {CATEGORIAS.map((categoria) => {
            const IconCat = getCategoriaIcon(categoria);
            const estaSeleccionada = formData.categoria === categoria;

            return (
              <button
                key={categoria}
                type="button"
                onClick={() => handleCategoriaSelect(categoria)}
                style={{
                  padding: '1rem',
                  border: `2px solid ${estaSeleccionada ? 'var(--brand-blue)' : 'var(--border-color)'}`,
                  borderRadius: '12px',
                  backgroundColor: estaSeleccionada ? 'var(--brand-blue)' : 'var(--bg-primary)',
                  color: estaSeleccionada ? 'white' : 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  if (!estaSeleccionada) {
                    e.currentTarget.style.borderColor = 'var(--text-secondary)';
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!estaSeleccionada) {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                  }
                }}
              >
                <IconCat size={32} color={estaSeleccionada ? 'white' : 'var(--text-primary)'} />
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}>
                  {CATEGORIA_NOMBRES[categoria]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Paso 2: Información básica
  const renderPaso2 = () => (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '0.5rem'
        }}>
          Cuéntanos sobre tu anuncio
        </h3>
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          margin: 0
        }}>
          {modoGratuito
            ? 'Escribe un título claro y atractivo (máximo 30 caracteres)'
            : 'Describe tu anuncio de manera clara y atractiva para que más personas lo vean'}
        </p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="adiso-titulo" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: 'var(--text-primary)'
        }}>
          <IconTitle aria-hidden="true" />
          Título {modoGratuito && <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(máx. 30 caracteres)</span>}
        </label>
        <input
          id="adiso-titulo"
          type="text"
          value={formData.titulo}
          onChange={(e) => {
            const value = e.target.value;
            const maxTitulo = modoGratuito ? 30 : LIMITS.TITULO_MAX;
            if (value.length <= maxTitulo) {
              setFormData({ ...formData, titulo: value });
              if (errors.titulo) {
                setErrors({ ...errors, titulo: undefined });
              }
            }
          }}
          required
          placeholder={CATEGORIA_PLACEHOLDERS[formData.categoria]}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            border: `1px solid ${errors.titulo ? '#ef4444' : 'var(--border-color)'}`,
            borderRadius: '8px',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = errors.titulo ? '#ef4444' : 'var(--brand-blue)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = errors.titulo ? '#ef4444' : 'var(--border-color)';
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
          {errors.titulo && (
            <span role="alert" style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.titulo}</span>
          )}
          <span style={{
            fontSize: '0.75rem',
            color: formData.titulo.length > (modoGratuito ? 30 : LIMITS.TITULO_MAX) * 0.9 ? '#f59e0b' : 'var(--text-tertiary)',
            marginLeft: 'auto'
          }}>
            {formData.titulo.length}/{modoGratuito ? 30 : LIMITS.TITULO_MAX}
          </span>
        </div>
      </div>

      {!modoGratuito && (
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="adiso-descripcion" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--text-primary)'
          }}>
            <IconDescription aria-hidden="true" />
            Descripción
          </label>
          <textarea
            id="adiso-descripcion"
            value={formData.descripcion}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= LIMITS.DESCRIPCION_MAX) {
                setFormData({ ...formData, descripcion: value });
                if (errors.descripcion) {
                  setErrors({ ...errors, descripcion: undefined });
                }
              }
            }}
            required
            placeholder="Describe tu anuncio con detalles importantes..."
            rows={5}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: `1px solid ${errors.descripcion ? '#ef4444' : 'var(--border-color)'}`,
              borderRadius: '8px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = errors.descripcion ? '#ef4444' : 'var(--brand-blue)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = errors.descripcion ? '#ef4444' : 'var(--border-color)';
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
            {errors.descripcion && (
              <span role="alert" style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.descripcion}</span>
            )}
            <span style={{
              fontSize: '0.75rem',
              color: formData.descripcion.length > LIMITS.DESCRIPCION_MAX * 0.9 ? '#f59e0b' : 'var(--text-tertiary)',
              marginLeft: 'auto'
            }}>
              {formData.descripcion.length}/{LIMITS.DESCRIPCION_MAX}
            </span>
          </div>
        </div>
      )}

      {!modoGratuito && (
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          marginTop: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'start',
            gap: '0.75rem'
          }}>
            <FaInfoCircle size={18} style={{ color: 'var(--text-secondary)', marginTop: '0.125rem', flexShrink: 0 }} />
            <div>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.25rem'
              }}>
                💡 Tip para mejores resultados
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5
              }}>
                En el siguiente paso podrás elegir un paquete de publicación. Los paquetes más grandes tienen mayor visibilidad y permiten más imágenes, lo que aumenta las posibilidades de que tu anuncio sea visto.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Paso 3: Paquete (solo si no es gratuito)
  const renderPaso3 = () => {
    if (modoGratuito) return null;

    return (
      <div>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}>
            Elige tu paquete de publicación
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            margin: 0
          }}>
            Mayor visibilidad = Mayor tamaño. Elige el que mejor se adapte a tus necesidades.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem'
        }}>
          {(Object.values(PAQUETES) as PaqueteInfo[]).map((paquete) => {
            const estaSeleccionado = formData.tamaño === paquete.tamaño;
            const paqueteInfo = PAQUETES[paquete.tamaño];
            const esPopular = paquete.tamaño === 'mediano';

            return (
              <button
                key={paquete.tamaño}
                type="button"
                onClick={() => {
                  const nuevoTamaño = paquete.tamaño;
                  setFormData({ ...formData, tamaño: nuevoTamaño });
                  if (imagenesPreviews.length > paqueteInfo.maxImagenes) {
                    setImagenesPreviews(prev => {
                      const nuevas = prev.slice(0, paqueteInfo.maxImagenes);
                      prev.slice(paqueteInfo.maxImagenes).forEach(img => {
                        URL.revokeObjectURL(img.preview);
                      });
                      return nuevas;
                    });
                  }
                  if (errors.tamaño) {
                    setErrors({ ...errors, tamaño: undefined });
                  }
                }}
                style={{
                  padding: '1.25rem',
                  border: `2px solid ${estaSeleccionado ? 'var(--brand-blue)' : esPopular ? 'var(--brand-blue)' : 'var(--border-color)'}`,
                  borderRadius: '12px',
                  backgroundColor: estaSeleccionado ? 'var(--brand-blue)' : 'var(--bg-primary)',
                  color: estaSeleccionado ? 'white' : 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  position: 'relative',
                  boxShadow: estaSeleccionado ? '0 4px 12px rgba(83, 172, 197, 0.3)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!estaSeleccionado) {
                    e.currentTarget.style.borderColor = 'var(--text-secondary)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!estaSeleccionado) {
                    e.currentTarget.style.borderColor = esPopular ? 'var(--text-secondary)' : 'var(--border-color)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {esPopular && (
                  <div style={{
                    position: 'absolute',
                    top: '-0.5rem',
                    right: '0.75rem',
                    backgroundColor: 'var(--brand-yellow)',
                    color: '#000',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    boxShadow: '0 2px 8px rgba(255, 194, 74, 0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Popular
                  </div>
                )}
                {estaSeleccionado && (
                  <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    color: 'var(--bg-primary)'
                  }}>
                    <FaCheck size={16} />
                  </div>
                )}
                <div>
                  <div style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    marginBottom: '0.25rem'
                  }}>
                    {paquete.nombre}
                  </div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    marginTop: '0.5rem'
                  }}>
                    S/ {paquete.precio}
                  </div>
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  opacity: estaSeleccionado ? 0.9 : 0.7,
                  lineHeight: 1.5
                }}>
                  {paquete.descripcion}
                </div>
                {paquete.maxImagenes > 0 && (
                  <div style={{
                    fontSize: '0.7rem',
                    opacity: estaSeleccionado ? 0.8 : 0.6,
                    marginTop: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <FaImage size={10} />
                    {paquete.maxImagenes} imagen{paquete.maxImagenes !== 1 ? 'es' : ''}
                  </div>
                )}
                {paquete.maxImagenes === 0 && (
                  <div style={{
                    fontSize: '0.7rem',
                    opacity: estaSeleccionado ? 0.8 : 0.6,
                    marginTop: '0.25rem'
                  }}>
                    Sin imágenes
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {errors.tamaño && (
          <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.5rem', display: 'block' }}>
            {errors.tamaño}
          </span>
        )}

        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          marginTop: '1.5rem'
        }}>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}>
            💡 ¿Por qué elegir un paquete más grande?
          </div>
          <ul style={{
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.8,
            margin: 0,
            paddingLeft: '1.25rem'
          }}>
            <li>Mayor visibilidad: tu anuncio ocupa más espacio y llama más la atención</li>
            <li>Más imágenes: las imágenes aumentan las conversiones hasta 3x</li>
            <li>Mejor posicionamiento: los anuncios grandes aparecen primero en búsquedas</li>
            <li>Mayor confianza: los anuncios con imágenes generan más confianza</li>
          </ul>
        </div>
      </div>
    );
  };

  // Paso 4: Contacto y ubicación
  const renderPaso4 = () => (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '0.5rem'
        }}>
          Información de contacto
        </h3>
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          margin: 0
        }}>
          Necesitamos tu número para que los interesados puedan contactarte
        </p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="adiso-contacto" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: 'var(--text-primary)'
        }}>
          <IconPhone aria-hidden="true" />
          Número de WhatsApp
        </label>
        <input
          id="adiso-contacto"
          type="tel"
          value={formData.contacto}
          onChange={(e) => {
            const formatted = formatPhoneNumber(e.target.value);
            setFormData({ ...formData, contacto: formatted });
            if (errors.contacto) {
              setErrors({ ...errors, contacto: undefined });
            }
          }}
          required
          placeholder="+51 987 654 321"
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            border: `1px solid ${errors.contacto ? '#ef4444' : 'var(--border-color)'}`,
            borderRadius: '8px',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = errors.contacto ? '#ef4444' : 'var(--brand-blue)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = errors.contacto ? '#ef4444' : 'var(--border-color)';
          }}
        />
        <div style={{ marginTop: '0.25rem' }}>
          {errors.contacto ? (
            <span role="alert" style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.contacto}</span>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              🔒 Este número no se mostrará públicamente
            </span>
          )}
        </div>
      </div>

      {!modoGratuito && (
        <div style={{ marginBottom: '1rem' }}>
          <SelectorUbicacion
            value={formData.ubicacion}
            onChange={(ubicacion) => {
              setFormData({ ...formData, ubicacion });
              if (errors.ubicacion) {
                setErrors({ ...errors, ubicacion: undefined });
              }
            }}
            required={false}
            label="Ubicación del anuncio (opcional)"
          />
          {errors.ubicacion && (
            <span role="alert" style={{
              fontSize: '0.75rem',
              color: '#ef4444',
              marginTop: '0.25rem',
              display: 'block'
            }}>
              {errors.ubicacion}
            </span>
          )}
        </div>
      )}
    </div>
  );

  // Paso 5: Imágenes (solo si no es gratuito y el paquete lo permite)
  const renderPaso5 = () => {
    if (modoGratuito) return null;

    const paqueteSeleccionado = formData.tamaño ? PAQUETES[formData.tamaño] : PAQUETES.miniatura;
    const puedeSubirImagenes = paqueteSeleccionado.maxImagenes > 0;

    if (!puedeSubirImagenes) {
      // Si el paquete no permite imágenes, saltar este paso
      return null;
    }

    return (
      <div>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}>
            Agrega imágenes a tu anuncio
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            margin: 0
          }}>
            Puedes agregar hasta {paqueteSeleccionado.maxImagenes} imagen{paqueteSeleccionado.maxImagenes !== 1 ? 'es' : ''}. Las imágenes aumentan las conversiones.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          style={{ display: 'none' }}
          id="adiso-images-input"
        />
        <div
          role="button"
          tabIndex={0}
          aria-label="Agregar imágenes: clic o arrastrar archivos aquí"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragEnter={handleImagenesDragEnter}
          onDragLeave={handleImagenesDragLeave}
          onDragOver={handleImagenesDragOver}
          onDrop={handleImagenesDrop}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '2rem',
            border: `2px dashed ${isDragOverImagenes ? 'var(--brand-blue)' : 'var(--border-color)'}`,
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: isDragOverImagenes ? 'var(--brand-blue)' : 'var(--text-secondary)',
            transition: 'all 0.2s',
            backgroundColor: isDragOverImagenes ? 'rgba(56, 189, 248, 0.08)' : 'var(--bg-secondary)',
            marginBottom: '1rem',
          }}
          onMouseEnter={(e) => {
            if (isDragOverImagenes) return;
            e.currentTarget.style.borderColor = 'var(--brand-blue)';
            e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.05)';
            e.currentTarget.style.color = 'var(--brand-blue)';
          }}
          onMouseLeave={(e) => {
            if (isDragOverImagenes) return;
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <FaPlus size={20} />
          <span>{isDragOverImagenes ? 'Suelta las imágenes aquí' : 'Haz clic o arrastra imágenes aquí'}</span>
        </div>

        {imagenesPreviews.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '0.75rem'
          }}>
            {imagenesPreviews.map((imgPreview) => (
              <div
                key={imgPreview.id}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)'
                }}
              >
                <img
                  src={imgPreview.preview}
                  alt={`Preview ${imgPreview.id}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(imgPreview.id)}
                  style={{
                    position: 'absolute',
                    top: '0.25rem',
                    right: '0.25rem',
                    background: 'rgba(0, 0, 0, 0.7)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    padding: 0,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
                  }}
                >
                  <FaTrash size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {imagenesPreviews.length === 0 && (
          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            marginTop: '1rem'
          }}>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              textAlign: 'center'
            }}>
              💡 Tip: Los anuncios con imágenes reciben hasta 3x más contactos
            </div>
          </div>
        )}
      </div>
    );
  };

  // Paso 6: Revisión
  const renderPaso6 = () => {
    const IconComponent = getCategoriaIcon(formData.categoria);
    const paqueteSeleccionado = formData.tamaño ? PAQUETES[formData.tamaño] : PAQUETES.miniatura;

    return (
      <div>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}>
            Revisa tu anuncio
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            margin: 0
          }}>
            Verifica que toda la información sea correcta antes de publicar
          </p>
        </div>

        <div style={{
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1.5rem',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <IconComponent size={20} />
              <span style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}>
                {CATEGORIA_NOMBRES[formData.categoria]}
              </span>
            </div>
            <h4 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0
            }}>
              {formData.titulo || 'Sin título'}
            </h4>
          </div>

          {!modoGratuito && formData.descripcion && (
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '1rem',
              whiteSpace: 'pre-wrap'
            }}>
              {formData.descripcion}
            </div>
          )}

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)'
            }}>
              <IconPhone size={16} />
              <span>{formData.contacto || 'Sin contacto'}</span>
            </div>

            {formData.ubicacion && typeof formData.ubicacion === 'object' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)'
              }}>
                <IconLocation size={16} />
                <span>
                  {formData.ubicacion.distrito}, {formData.ubicacion.provincia}, {formData.ubicacion.departamento}
                </span>
              </div>
            )}

            {!modoGratuito && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)'
              }}>
                <span style={{ fontWeight: 600 }}>Paquete:</span>
                <span>{paqueteSeleccionado.nombre} - S/ {paqueteSeleccionado.precio}</span>
              </div>
            )}

            {imagenesPreviews.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)'
              }}>
                <FaImage size={16} />
                <span>{imagenesPreviews.length} imagen{imagenesPreviews.length !== 1 ? 'es' : ''}</span>
              </div>
            )}
          </div>
        </div>

        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          marginTop: '1.5rem'
        }}>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6
          }}>
            ✅ Al publicar, tu anuncio será visible inmediatamente para todos los usuarios.
            {!modoGratuito && ` El costo de S/ ${paqueteSeleccionado.precio} se aplicará al publicar.`}
          </div>
        </div>
      </div>
    );
  };

  const renderPaso = () => {
    switch (pasoActual) {
      case 1: return renderPaso1();
      case 2: return renderPaso2();
      case 3: return renderPaso3();
      case 4: return renderPaso4();
      case 5: return renderPaso5();
      case 6: return renderPaso6();
      default: return null;
    }
  };

  // Validación sin actualizar estado (para evitar loops)
  const validarPasoSinEstado = (paso: Paso): boolean => {
    switch (paso) {
      case 1:
        return true; // Categoría siempre tiene valor
      case 2:
        if (!formData.titulo.trim()) return false;
        const maxTitulo = modoGratuito ? 30 : LIMITS.TITULO_MAX;
        if (formData.titulo.length > maxTitulo) return false;
        if (!modoGratuito && !formData.descripcion.trim()) return false;
        if (!modoGratuito && formData.descripcion.length > LIMITS.DESCRIPCION_MAX) return false;
        return true;
      case 3:
        return modoGratuito || !!formData.tamaño;
      case 4:
        if (!formData.contacto.trim()) return false;
        return validatePhoneNumber(formData.contacto);
      case 5:
        if (modoGratuito || !formData.tamaño) return true;
        const paqueteSeleccionado = PAQUETES[formData.tamaño];
        return imagenesPreviews.length <= paqueteSeleccionado.maxImagenes;
      case 6:
        return true; // Revisión siempre permite avanzar
      default:
        return false;
    }
  };

  const puedeAvanzar = () => {
    return validarPasoSinEstado(pasoActual);
  };

  const puedeRetroceder = () => pasoActual > 1;

  const renderControles = () => (
    <div style={{
      display: 'flex',
      gap: '0.75rem',
      marginTop: '2rem',
      paddingTop: '1.5rem',
      borderTop: '1px solid var(--border-color)'
    }}>
      {puedeRetroceder() && (
        <button
          type="button"
          onClick={pasoAnterior}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            e.currentTarget.style.borderColor = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          <FaArrowLeft size={14} />
          Anterior
        </button>
      )}

      <div style={{ flex: 1 }} />

      {pasoActual < totalPasos ? (
        <button
          type="button"
          onClick={siguientePaso}
          disabled={!puedeAvanzar()}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: puedeAvanzar() ? 'var(--brand-blue)' : 'var(--bg-secondary)',
            color: puedeAvanzar() ? 'white' : 'var(--text-tertiary)',
            cursor: puedeAvanzar() ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
            opacity: puedeAvanzar() ? 1 : 0.6
          }}
          onMouseEnter={(e) => {
            if (puedeAvanzar()) {
              e.currentTarget.style.opacity = '0.9';
            }
          }}
          onMouseLeave={(e) => {
            if (puedeAvanzar()) {
              e.currentTarget.style.opacity = '1';
            }
          }}
        >
          Siguiente
          <FaArrowRight size={14} />
        </button>
      ) : (
        <button
          type="submit"
          disabled={enviando || !puedeAvanzar()}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: enviando || !puedeAvanzar() ? 'var(--bg-secondary)' : 'var(--brand-blue)',
            color: enviando || !puedeAvanzar() ? 'var(--text-tertiary)' : 'white',
            cursor: enviando || !puedeAvanzar() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
            opacity: enviando || !puedeAvanzar() ? 0.6 : 1
          }}
        >
          {enviando ? (
            <>
              <span style={{
                width: '14px',
                height: '14px',
                border: '2px solid currentColor',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
                display: 'inline-block'
              }} />
              Publicando...
            </>
          ) : (
            <>
              <IconMegaphone size={16} />
              Publicar ahora
            </>
          )}
        </button>
      )}
    </div>
  );

  const renderPublishError = () =>
    publishError ? (
      <div
        role="alert"
        style={{
          marginBottom: '1rem',
          padding: '0.875rem 1rem',
          borderRadius: '10px',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: '#b91c1c',
          fontSize: '0.875rem',
          lineHeight: 1.5,
          fontWeight: 500,
        }}
      >
        {publishError}
      </div>
    ) : null;

  const renderForm = () => (
    <form onSubmit={handleSubmit}>
      {renderProgreso()}
      {renderPublishError()}
      {renderPaso()}
      {renderControles()}
    </form>
  );

  // Mode: Page, Sidebar, or No Close handler -> Render inline (not modal)
  if (esPaginaCompleta || dentroSidebar || !onCerrar) {
    return (
      <div
        className={esPaginaCompleta ? "formulario-publicar-page" : "formulario-publicar-inline"}
        style={{
          backgroundColor: 'transparent',
          padding: dentroSidebar ? '1.5rem' : '0',
          width: '100%',
          height: '100%',
          overflowY: 'visible'
        }}
      >
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '1.5rem',
          display: dentroSidebar ? 'block' : 'none' // Hide default title on full page if header already has it, or keep it?
        }}>
          {tituloCustom ? tituloCustom : (modoGratuito ? 'Publicar adiso gratuito' : 'Publicar adiso')}
        </h2>
        {/* On full page, we might want the title visible. keeping it block for now */}

        {renderForm()}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '1rem'
      }}
      onClick={onCerrar}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '12px',
          padding: '1.5rem',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'var(--text-primary)'
          }}>
            {tituloCustom ? tituloCustom : (modoGratuito ? 'Publicar adiso gratuito' : 'Publicar adiso')}
          </h2>
          <button
            onClick={onCerrar}
            style={{
              fontSize: '1.5rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: '0.25rem',
              lineHeight: 1,
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            ×
          </button>
        </div>
        {renderForm()}
      </div>
    </div>
  );
}
