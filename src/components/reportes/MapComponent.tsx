import React, { useState } from 'react';
import { Map, Marker, Popup } from '@vis.gl/react-maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { PosicionUnidad } from '../../api/reportes';

interface MapComponentProps {
  posiciones: PosicionUnidad[];
  onMarkerClick: (posicion: PosicionUnidad) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ posiciones, onMarkerClick }) => {
  const [selectedPosicion, setSelectedPosicion] = useState<PosicionUnidad | null>(null);

  // Estilo del mapa usando OpenStreetMap (gratis, sin API key)
  const mapStyle = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

  return (
    <Map
      initialViewState={{
        longitude: -58.3816, // Buenos Aires
        latitude: -34.6037,
        zoom: 5
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle={mapStyle}
      scrollZoom={true}
    >
      {posiciones.map((posicion, index) => {
        const lat = parseFloat(posicion.lat);
        const lng = parseFloat(posicion.lng);
        
        if (isNaN(lat) || isNaN(lng)) return null;
        
        const isMoving = posicion.event_code === 'MOV' || parseFloat(posicion.speed) > 0;
        
        return (
          <React.Fragment key={`${posicion.plate}-${index}`}>
            <Marker
              longitude={lng}
              latitude={lat}
              anchor="bottom"
              onClick={() => {
                setSelectedPosicion(posicion);
                onMarkerClick(posicion);
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: isMoving ? '#22c55e' : '#ef4444',
                  border: '2px solid white',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              />
            </Marker>
            {selectedPosicion && selectedPosicion.plate === posicion.plate && (
              <Popup
                longitude={lng}
                latitude={lat}
                anchor="bottom"
                onClose={() => setSelectedPosicion(null)}
                closeButton={true}
                closeOnClick={false}
              >
                <div className="text-sm p-2 min-w-[200px]">
                  <p className="font-bold text-blue-900 mb-2">{posicion.plate}</p>
                  <p className="mb-1">
                    <span className="font-semibold">Fecha:</span> {new Date(posicion.date).toLocaleString('es-AR')}
                  </p>
                  <p className="mb-1">
                    <span className="font-semibold">Velocidad:</span> {posicion.speed} km/h
                  </p>
                  <p className="mb-1">
                    <span className="font-semibold">Dirección:</span> {posicion.direction}°
                  </p>
                  <p className="mb-1">
                    <span className="font-semibold">Evento:</span> {posicion.event}
                  </p>
                  {posicion.driver_name && (
                    <p className="mb-1">
                      <span className="font-semibold">Conductor:</span> {posicion.driver_name}
                    </p>
                  )}
                  {posicion.odometer && (
                    <p className="mb-1">
                      <span className="font-semibold">Odómetro:</span> {posicion.odometer.toLocaleString('es-AR')} km
                    </p>
                  )}
                </div>
              </Popup>
            )}
          </React.Fragment>
        );
      })}
    </Map>
  );
};

export default MapComponent;
