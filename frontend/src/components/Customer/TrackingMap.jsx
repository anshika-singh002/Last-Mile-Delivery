import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon issues in React
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
    if (bounds && bounds.length >= 2) {
      try {
        const leafletBounds = L.latLngBounds(bounds);
        map.fitBounds(leafletBounds, { padding: [50, 50], maxZoom: 13, animate: true });
      } catch (err) {
        console.error('Fit bounds error:', err);
      }
    }
  }, [bounds, map]);
  return null;
}

export default function TrackingMap({ pickupLocation, dropLocation, agentLocation, pickupPincode, dropPincode }) {
  const [resolvedPickup, setResolvedPickup] = useState(pickupLocation);
  const [resolvedDrop, setResolvedDrop] = useState(dropLocation);

  // Client-side fallback: If coordinates are default/missing, resolve via live geocoding API
  useEffect(() => {
    let isMounted = true;
    async function resolveCoords() {
      // If pickup coordinates are missing or default SF center and we have a pincode
      if (pickupPincode && (!pickupLocation || (Math.abs(pickupLocation.lat - 37.7749) < 0.001 && Math.abs(pickupLocation.lng - (-122.4194)) < 0.001))) {
        try {
          const res = await fetch(`https://api.zippopotam.us/in/${pickupPincode.trim()}`);
          if (res.ok) {
            const data = await res.json();
            if (isMounted && data.places && data.places[0]) {
              setResolvedPickup({ lat: parseFloat(data.places[0].latitude), lng: parseFloat(data.places[0].longitude) });
            }
          }
        } catch (e) {}
      } else if (pickupLocation) {
        setResolvedPickup(pickupLocation);
      }

      // If drop coordinates are missing or default SF center and we have a pincode
      if (dropPincode && (!dropLocation || (Math.abs(dropLocation.lat - 37.7833) < 0.001 && Math.abs(dropLocation.lng - (-122.4167)) < 0.001))) {
        try {
          const res = await fetch(`https://api.zippopotam.us/in/${dropPincode.trim()}`);
          if (res.ok) {
            const data = await res.json();
            if (isMounted && data.places && data.places[0]) {
              setResolvedDrop({ lat: parseFloat(data.places[0].latitude), lng: parseFloat(data.places[0].longitude) });
            }
          }
        } catch (e) {}
      } else if (dropLocation) {
        setResolvedDrop(dropLocation);
      }
    }
    resolveCoords();
    return () => { isMounted = false; };
  }, [pickupLocation, dropLocation, pickupPincode, dropPincode]);

  const pLat = Number(resolvedPickup?.lat) || 28.6333;
  const pLng = Number(resolvedPickup?.lng) || 77.2167;
  const dLat = Number(resolvedDrop?.lat) || 12.9716;
  const dLng = Number(resolvedDrop?.lng) || 77.5946;

  const positions = [
    [pLat, pLng],
    [dLat, dLng]
  ];

  if (agentLocation?.lat && agentLocation?.lng) {
    positions.push([Number(agentLocation.lat), Number(agentLocation.lng)]);
  }

  // Key guarantees that Leaflet remounts when coordinates change
  const mapKey = `${pLat.toFixed(4)}_${pLng.toFixed(4)}_${dLat.toFixed(4)}_${dLng.toFixed(4)}`;

  return (
    <div className="w-full h-80 rounded-2xl overflow-hidden border border-slate-800 relative z-0">
      <MapContainer
        key={mapKey}
        center={[pLat, pLng]}
        zoom={11}
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
              {pickupPincode && <div className="text-[11px] text-slate-700">Pincode: {pickupPincode}</div>}
              <div className="text-[10px] text-slate-500 font-mono">[{pLat.toFixed(4)}, {pLng.toFixed(4)}]</div>
            </div>
          </Popup>
        </Marker>

        {/* Drop Marker */}
        <Marker position={[dLat, dLng]} icon={dropIcon}>
          <Popup>
            <div className="text-slate-900 font-semibold text-xs">
              <strong>Drop Location</strong>
              {dropPincode && <div className="text-[11px] text-slate-700">Pincode: {dropPincode}</div>}
              <div className="text-[10px] text-slate-500 font-mono">[{dLat.toFixed(4)}, {dLng.toFixed(4)}]</div>
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
