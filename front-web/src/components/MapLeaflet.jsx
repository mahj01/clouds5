import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Icon personnalisée
const customIcon = new L.Icon({
  iconUrl: '/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const MapLeaflet = () => {
  const markers = [
    { lat: -18.8792, lng: 47.5079, label: 'Antananarivo' },
    { lat: -19.9316, lng: 46.9653, label: 'Toliara' },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h2>Carte Madagascar</h2>
      <MapContainer
        center={[-18.8792, 47.5079]}
        zoom={6}
        scrollWheelZoom={true}
        style={{ height: '500px', width: '100%', borderRadius: '12px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((m, idx) => (
          <Marker key={idx} position={[m.lat, m.lng]} icon={customIcon}>
            <Popup>{m.label}</Popup>
          </Marker>
        ))}
        <Circle center={[-18.8792, 47.5079]} radius={50000} color="blue" />
      </MapContainer>
    </div>
  );
};




export default MapLeaflet;
