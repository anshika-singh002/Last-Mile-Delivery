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

  // Client-side fallback: If coordinates are default/missing or out-of-sync with pincodes, resolve via live geocoding API
  useEffect(() => {
    let isMounted = true;
    async function resolvePincodeGeo(pincode) {
      if (!pincode) return null;
      const cleanPin = String(pincode).trim();

      // Check known Indian table
      const PINCODE_MAP = {
        '390022': { lat: 22.3323, lng: 73.2207 },
        '390019': { lat: 22.3030, lng: 73.2329 },
        '110001': { lat: 28.6333, lng: 77.2167 },
        '560001': { lat: 12.9716, lng: 77.5946 },
        '400001': { lat: 18.9322, lng: 72.8347 },
        '500001': { lat: 17.3850, lng: 78.4867 },
        '600001': { lat: 13.0827, lng: 80.2707 },
        '700001': { lat: 22.5726, lng: 88.3639 },
        '411001': { lat: 18.5204, lng: 73.8567 },
        '380001': { lat: 23.0225, lng: 72.5714 }
      };

      if (PINCODE_MAP[cleanPin]) return PINCODE_MAP[cleanPin];

      // 1. Try Nominatim with countrycodes=in for 6-digit PIN
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${cleanPin}&countrycodes=in&format=json&limit=1`);
        if (r.ok) {
          const d = await r.json();
          if (d && d[0]) {
            return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) };
          }
        }
      } catch (e) {}

      // 2. Try Zippopotam
      try {
        const r = await fetch(`https://api.zippopotam.us/in/${cleanPin}`);
        if (r.ok) {
          const d = await r.json();
          if (d.places && d.places[0]) {
            return { lat: parseFloat(d.places[0].latitude), lng: parseFloat(d.places[0].longitude) };
          }
        }
      } catch (e) {}

      // 3. Try Postal Pincode API
      try {
        const r = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
        if (r.ok) {
          const d = await r.json();
          if (d[0]?.Status === 'Success' && d[0]?.PostOffice?.[0]) {
            const po = d[0].PostOffice[0];
            const q = `${po.District}, ${po.State}, India`;
            const or = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`);
            if (or.ok) {
              const od = await or.json();
              if (od && od[0]) {
                return { lat: parseFloat(od[0].lat), lng: parseFloat(od[0].lon) };
              }
            }
          }
        }
      } catch (e) {}

      return null;
    }

    async function loadLocations() {
      if (pickupPincode) {
        const geo = await resolvePincodeGeo(pickupPincode);
        if (geo && isMounted) setResolvedPickup(geo);
      } else if (pickupLocation) {
        setResolvedPickup(pickupLocation);
      }

      if (dropPincode) {
        const geo = await resolvePincodeGeo(dropPincode);
        if (geo && isMounted) setResolvedDrop(geo);
      } else if (dropLocation) {
        setResolvedDrop(dropLocation);
      }
    }

    loadLocations();
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
