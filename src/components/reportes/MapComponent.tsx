import React, { useState, useRef, useEffect } from 'react';
// Icono SVG de camión inline para máxima compatibilidad
import maplibregl from 'maplibre-gl';
import { Map, Marker, Popup } from '@vis.gl/react-maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { PosicionUnidad } from '../../api/reportes';

interface MapComponentProps {
  posiciones: PosicionUnidad[];
  onMarkerClick: (posicion: PosicionUnidad) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ posiciones, onMarkerClick }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [selectedPosicion, setSelectedPosicion] = useState<PosicionUnidad | null>(null);

  // Estilo del mapa: CartoDB Voyager (más contraste y color)
  const mapStyle = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

  // Cerrar popup al hacer click fuera del mapa
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        mapContainerRef.current &&
        !mapContainerRef.current.contains(event.target as Node)
      ) {
        setSelectedPosicion(null);
      }
    }
    if (selectedPosicion) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedPosicion]);

  // Ajustar el mapa para mostrar todos los puntos (fit bounds) incluso en el primer render
  useEffect(() => {
    if (!mapRef.current) return;
    // Solo hacer fitBounds si hay al menos 1 posición válida
    const validPositions = posiciones.filter(pos => {
      const lat = parseFloat(pos.lat);
      const lng = parseFloat(pos.lng);
      return !isNaN(lat) && !isNaN(lng);
    });
    if (validPositions.length === 0) return;
    const bounds = new maplibregl.LngLatBounds();
    validPositions.forEach(pos => {
      const lat = parseFloat(pos.lat);
      const lng = parseFloat(pos.lng);
      bounds.extend([lng, lat]);
    });
    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, { padding: 160, duration: 800 });
    }
  }, [posiciones]);

  const isActive = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr.replace(' ', 'T')); // Asegura formato ISO
    const diffMs = now.getTime() - date.getTime();
    return diffMs < 24 * 60 * 60 * 1000; // Menos de 24 horas
  };

  // Auto-pan al seleccionar un marcador para que el popup quede visible
  useEffect(() => {
    if (!mapRef.current || !selectedPosicion) return;
    const lat = parseFloat(selectedPosicion.lat);
    const lng = parseFloat(selectedPosicion.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      // Centra el marcador, pero sube un poco el centro para que el popup no tape el marcador
      mapRef.current.easeTo({
        center: [lng, lat],
        offset: [0, -80], // mueve el centro hacia arriba (en píxeles)
        duration: 700
      });
    }
  }, [selectedPosicion]);

  return (
    <div ref={mapContainerRef} style={{ width: '100%', minHeight: '400px', height: '60vh', position: 'relative' }}>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: -58.5, // Más cerca de Buenos Aires
          latitude: -34.6,
          zoom: 8 // Zoom más cercano
        }}
        style={{ width: '100%', height: '100%', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}
        mapStyle={mapStyle}
        scrollZoom={true}
        onClick={() => setSelectedPosicion(null)}
      >
        {/* Aquí se podría renderizar una capa de partidos si se provee un GeoJSON */}
        {posiciones.map((posicion, index) => {
          const lat = parseFloat(posicion.lat);
          const lng = parseFloat(posicion.lng);
          if (isNaN(lat) || isNaN(lng)) return null;
          // Sin filtros de estado: todos los camiones se muestran igual (rojo)
          // Estado visual: verde si reportó en las últimas 24h, rojo si no
          const isActive = (() => {
            const now = new Date();
            const date = new Date(posicion.date.replace(' ', 'T'));
            const diffMs = now.getTime() - date.getTime();
            return diffMs < 24 * 60 * 60 * 1000;
          })();
          return (
            <React.Fragment key={`${posicion.plate}-${index}`}>
              <Marker
                longitude={lng}
                latitude={lat}
                anchor="bottom"
                onClick={e => {
                  e.originalEvent.stopPropagation();
                  setSelectedPosicion(posicion);
                  onMarkerClick(posicion);
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    background: isActive ? '#22c55e' : '#ef4444',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                    padding: 2,
                    cursor: 'pointer',
                    border: '2.5px solid #fff',
                  }}
                >
                  <svg
                    width={24}
                    height={24}
                    viewBox="0 0 640 512"
                  >
                    <path
                      d="M624 352h-16V275.9c0-16.8-6.7-33-18.7-45l-91.3-91.3C486.1 130.7 477.2 128 468 128H400V96c0-17.7-14.3-32-32-32H72c-39.8 0-72 32.2-72 72v240c0 13.3 10.7 24 24 24h40c0 35.3 28.7 64 64 64s64-28.7 64-64h192c0 35.3 28.7 64 64 64s64-28.7 64-64h56c8.8 0 16-7.2 16-16v-48c0-8.8-7.2-16-16-16zM464 192l80 80h-80v-80zm-304 240c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm320 0c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm112-64h-40c0-35.3-28.7-64-64-64s-64 28.7-64 64H192c0-35.3-28.7-64-64-64s-64 28.7-64 64H48V136c0-22.1 17.9-40 40-40h296v240h208v32z"
                      fill="#222"
                    />
                  </svg>
                </div>
              </Marker>
              {selectedPosicion && selectedPosicion.plate === posicion.plate && (
                <Popup
                  longitude={lng}
                  latitude={lat}
                  anchor="bottom"
                  closeButton={false}
                  closeOnClick={false}
                >
                  <div className="relative text-sm p-2 min-w-[220px] border-2 border-blue-500 rounded-lg shadow-md bg-white">
                    {/* Botón de cierre personalizado */}
                    <button
                      onClick={() => setSelectedPosicion(null)}
                      className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-500 hover:text-white text-blue-700 transition-colors shadow"
                      style={{ zIndex: 10, border: 'none', outline: 'none', cursor: 'pointer' }}
                      aria-label="Cerrar"
                    >
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                        <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                    <div className="font-bold text-blue-900 mb-2 text-center text-base">{posicion.plate}</div>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr>
                          <td className="font-semibold text-gray-700 pr-2 text-right align-top whitespace-nowrap">Fecha</td>
                          <td className="text-gray-900 pl-2">{new Date(posicion.date).toLocaleString('es-AR')}</td>
                        </tr>
                        <tr>
                          <td className="font-semibold text-gray-700 pr-2 text-right align-top whitespace-nowrap">Velocidad</td>
                          <td className="text-gray-900 pl-2">{posicion.speed} km/h</td>
                        </tr>
                        <tr>
                          <td className="font-semibold text-gray-700 pr-2 text-right align-top whitespace-nowrap">Dirección</td>
                          <td className="text-gray-900 pl-2">{posicion.direction}°</td>
                        </tr>
                        <tr>
                          <td className="font-semibold text-gray-700 pr-2 text-right align-top whitespace-nowrap">Evento</td>
                          <td className="text-gray-900 pl-2">{posicion.event}</td>
                        </tr>
                        {posicion.driver_name && (
                          <tr>
                            <td className="font-semibold text-gray-700 pr-2 text-right align-top whitespace-nowrap">Conductor</td>
                            <td className="text-gray-900 pl-2">{posicion.driver_name}</td>
                          </tr>
                        )}
                        {posicion.odometer && (
                          <tr>
                            <td className="font-semibold text-gray-700 pr-2 text-right align-top whitespace-nowrap">Odómetro</td>
                            <td className="text-gray-900 pl-2">{posicion.odometer.toLocaleString('es-AR')} km</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Popup>
              )}
            </React.Fragment>
          );
        })}
      </Map>
    </div>
  );
};

export default MapComponent;