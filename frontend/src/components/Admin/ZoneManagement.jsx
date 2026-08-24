import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import { MapPin, Plus, Trash2 } from 'lucide-react';

export default function ZoneManagement() {
  const { addToast } = useNotification();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [newZone, setNewZone] = useState({
    name: '',
    code: '',
    pincodes: '',
    centerLat: '',
    centerLng: ''
  });
  const [detectingCoords, setDetectingCoords] = useState(false);

  const fetchZones = async () => {
    try {
      const res = await adminService.getZones();
      if (res.success) {
        setZones(Array.isArray(res.data) ? res.data : []);
      } else {
        setZones([]);
      }
    } catch (err) {
      console.error(err);
      setZones([]);
      addToast('Failed to load zones', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleAutoDetectCoords = async (pinToQuery) => {
    const pin = (pinToQuery || newZone.pincodes.split(',')[0] || '').trim();
    if (!pin) {
      addToast('Please enter a pincode first to auto-detect coordinates', 'info');
      return;
    }
    setDetectingCoords(true);
    try {
      let lat = null;
      let lng = null;
      // Try Zippopotam India
      try {
        const r = await fetch(`https://api.zippopotam.us/in/${pin}`);
        if (r.ok) {
          const d = await r.json();
          lat = d.places[0].latitude;
          lng = d.places[0].longitude;
        }
      } catch (e) {}

      // Try Zippopotam US
      if (!lat) {
        try {
          const r = await fetch(`https://api.zippopotam.us/us/${pin}`);
          if (r.ok) {
            const d = await r.json();
            lat = d.places[0].latitude;
            lng = d.places[0].longitude;
          }
        } catch (e) {}
      }

      // Try Nominatim OSM
      if (!lat) {
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(pin)}&format=json&limit=1`);
          if (r.ok) {
            const d = await r.json();
            if (d && d[0]) {
              lat = d[0].lat;
              lng = d[0].lon;
            }
          }
        } catch (e) {}
      }

      if (lat && lng) {
        setNewZone(prev => ({
          ...prev,
          centerLat: String(parseFloat(lat).toFixed(6)),
          centerLng: String(parseFloat(lng).toFixed(6))
        }));
        addToast(`Auto-detected coordinates for Pincode ${pin}!`, 'success');
      } else {
        addToast(`Could not auto-find coordinates for ${pin}. You can enter lat/lng manually.`, 'info');
      }
    } catch (err) {
      addToast('Failed to auto-detect coordinates', 'error');
    } finally {
      setDetectingCoords(false);
    }
  };

  const handleCreateZone = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const payload = {
        ...newZone,
        pincodes: String(newZone.pincodes || '')
          .split(',')
          .map(p => p.trim())
          .filter(Boolean),
        centerLat: newZone.centerLat ? parseFloat(newZone.centerLat) : undefined,
        centerLng: newZone.centerLng ? parseFloat(newZone.centerLng) : undefined
      };

      const res = await adminService.createZone(payload);
      if (res.success) {
        addToast(`Zone ${res.data.name} created with center [${res.data.centerLat}, ${res.data.centerLng}]!`, 'success');
        setNewZone({
          name: '',
          code: '',
          pincodes: '',
          centerLat: '',
          centerLng: ''
        });
        fetchZones();
      } else {
        addToast('Failed to create zone', 'error');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create zone', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteZone = async (id) => {
    try {
      const res = await adminService.deleteZone(id);
      if (res.success) {
        addToast('Zone deleted successfully', 'success');
        fetchZones();
      } else {
        addToast('Failed to delete zone', 'error');
      }
    } catch (err) {
      addToast('Failed to delete zone', 'error');
    }
  };

  if (loading) return <LoadingSpinner text="Fetching zone configurations..." />;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">Zone Management</h2>
          <p className="text-xs text-slate-400">Configure pickup & drop areas and mapped pincodes</p>
        </div>

        <form onSubmit={handleCreateZone} className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
            <Plus className="w-4 h-4 text-sky-400" />
            <span>Add New Zone</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Zone Name</label>
              <input
                type="text"
                required
                placeholder="Downtown (Zone Alpha)"
                value={newZone.name}
                onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Zone Code</label>
              <input
                type="text"
                required
                placeholder="ALPHA"
                value={newZone.code}
                onChange={(e) => setNewZone({ ...newZone, code: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Center Lat</label>
              <input
                type="number"
                step="0.000001"
                value={newZone.centerLat}
                onChange={(e) => setNewZone({ ...newZone, centerLat: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Center Lng</label>
              <input
                type="number"
                step="0.000001"
                value={newZone.centerLng}
                onChange={(e) => setNewZone({ ...newZone, centerLng: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-400">Assigned Pincodes (comma-separated)</label>
                <button
                  type="button"
                  onClick={() => handleAutoDetectCoords()}
                  disabled={detectingCoords}
                  className="text-[11px] font-bold text-sky-400 hover:text-sky-300 transition underline flex items-center space-x-1"
                >
                  <span>{detectingCoords ? 'Detecting GPS...' : '📍 Auto-detect GPS from Pincode'}</span>
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="e.g. 560001, 110001, 400001 or 94102"
                value={newZone.pincodes}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewZone({ ...newZone, pincodes: val });
                  const firstPin = val.split(',')[0].trim();
                  if (firstPin.length >= 5 && (!newZone.centerLat || !newZone.centerLng)) {
                    handleAutoDetectCoords(firstPin);
                  }
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Entering an Indian (6-digit) or global pincode will automatically locate the exact latitude & longitude on the map.
              </p>
            </div>

            <button
              type="submit"
              disabled={creating || detectingCoords}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white font-bold text-xs rounded-lg transition"
            >
              {creating ? 'Creating...' : 'Create Zone'}
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {zones.map((zone) => (
            <div key={zone.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-sky-400" />
                  <span className="font-bold text-white text-sm">{zone.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {zone.code}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteZone(zone.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
                  type="button"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-400">
                <span className="block text-slate-500 font-semibold mb-1">Assigned Pincodes:</span>
                <div className="flex flex-wrap gap-1">
                  {(zone.pincodes || []).map((pin) => (
                    <span key={pin} className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">
                      {pin}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}