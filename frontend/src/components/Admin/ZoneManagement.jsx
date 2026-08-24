import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import { MapPin, Plus, Trash2, Edit3, Save, X } from 'lucide-react';

export default function ZoneManagement() {
  const { addToast } = useNotification();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newZone, setNewZone] = useState({
    name: '',
    code: '',
    pincodes: '',
    centerLat: '37.7749',
    centerLng: '-122.4194'
  });

  const fetchZones = async () => {
    try {
      const res = await adminService.getZones();
      if (res.success) {
        setZones(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleCreateZone = async (e) => {
    e.preventDefault();
    try {
      const res = await adminService.createZone(newZone);
      if (res.success) {
        addToast(`Zone ${res.data.name} created!`, 'success');
        setNewZone({ name: '', code: '', pincodes: '', centerLat: '37.7749', centerLng: '-122.4194' });
        fetchZones();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create zone', 'error');
    }
  };

  const handleDeleteZone = async (id) => {
    try {
      const res = await adminService.deleteZone(id);
      if (res.success) {
        addToast('Zone deleted successfully', 'success');
        fetchZones();
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
          <p className="text-xs text-slate-400">Configure pickup & drop areas, pincodes, and geographic bounds</p>
        </div>

        {/* Create Form */}
        <form onSubmit={handleCreateZone} className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
            <Plus className="w-4 h-4 text-sky-400" />
            <span>Add New Zone</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
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
              <label className="block text-slate-400 mb-1">Assigned Pincodes (comma-separated)</label>
              <input
                type="text"
                required
                placeholder="94102, 94103, 94104"
                value={newZone.pincodes}
                onChange={(e) => setNewZone({ ...newZone, pincodes: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg transition"
          >
            Create Zone
          </button>
        </form>

        {/* List */}
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
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-400">
                <span className="block text-slate-500 font-semibold mb-1">Assigned Pincodes:</span>
                <div className="flex flex-wrap gap-1">
                  {zone.pincodes?.map((pin) => (
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
