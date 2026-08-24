import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom icons
const pickupIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const dropIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const agentIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper component to auto-recenter and fit bounds dynamically
function MapBoundsUpdater({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [bounds, map]);
  return null;
}

export default function TrackingMap({ pickupLocation, dropLocation, agentLocation }) {
  const pLat = Number(pickupLocation?.lat) || 37.7749;
  const pLng = Number(pickupLocation?.lng) || -122.4194;
  const dLat = Number(dropLocation?.lat) || 37.7833;
  const dLng = Number(dropLocation?.lng) || -122.4167;

  const positions = [
    [pLat, pLng],
    [dLat, dLng]
  ];

  if (agentLocation?.lat && agentLocation?.lng) {
    positions.push([Number(agentLocation.lat), Number(agentLocation.lng)]);
  }

  return (
    <div className="w-full h-80 rounded-2xl overflow-hidden border border-slate-800 relative z-0">
      <MapContainer
        center={[pLat, pLng]}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsUpdater bounds={positions} />

        {/* Pickup Marker */}
        <Marker position={[pLat, pLng]} icon={pickupIcon}>
          <Popup>
            <div className="text-slate-900 font-semibold text-xs">
              <strong>Pickup Location</strong>
              <div className="text-[10px] text-slate-600 font-mono">[{pLat.toFixed(4)}, {pLng.toFixed(4)}]</div>
            </div>
          </Popup>
        </Marker>

        {/* Drop Marker */}
        <Marker position={[dLat, dLng]} icon={dropIcon}>
          <Popup>
            <div className="text-slate-900 font-semibold text-xs">
              <strong>Drop Location</strong>
              <div className="text-[10px] text-slate-600 font-mono">[{dLat.toFixed(4)}, {dLng.toFixed(4)}]</div>
            </div>
          </Popup>
        </Marker>

        {/* Agent Live Marker */}
        {agentLocation && agentLocation.lat && agentLocation.lng && (
          <Marker position={[Number(agentLocation.lat), Number(agentLocation.lng)]} icon={agentIcon}>
            <Popup>
              <div className="text-slate-900 font-semibold text-xs">
                <strong>Delivery Agent Location</strong>
                <div className="text-[10px] text-slate-600 font-mono">Live GPS tracking</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route Line */}
        <Polyline positions={[[pLat, pLng], [dLat, dLng]]} color="#0284c7" weight={4} dashArray="5, 10" />
      </MapContainer>
    </div>
  );
}
