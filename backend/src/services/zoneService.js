const { memoryDb } = require('../config/database');
const { calculateHaversineDistance } = require('../utils/haversine');

class ZoneService {
  async getAllZones() {
    return memoryDb.zones;
  }

  async getZoneById(id) {
    return memoryDb.zones.find(z => z.id === id);
  }

  async detectZoneByPincode(pincode) {
    if (!pincode) return null;

    const cleanPin = pincode.toString().trim();
    const zone = (memoryDb.zones || []).find(
      z => Array.isArray(z.pincodes) && z.pincodes.map(p => p.toString().trim()).includes(cleanPin)
    );

    return zone || null;
  }

  async createZone({ name, code, pincodes, centerLat, centerLng }) {
    const normalizedPincodes = Array.isArray(pincodes)
      ? pincodes.map(p => p.toString().trim()).filter(Boolean)
      : String(pincodes || '')
          .split(',')
          .map(p => p.trim())
          .filter(Boolean);

    const newZone = {
      id: `zone-${Date.now()}`,
      name,
      code: String(code || '').toUpperCase(),
      pincodes: normalizedPincodes,
      centerLat: parseFloat(centerLat) || 37.7749,
      centerLng: parseFloat(centerLng) || -122.4194
    };

    memoryDb.zones.push(newZone);
    return newZone;
  }

  async updateZone(id, updateData) {
    const zone = (memoryDb.zones || []).find(z => z.id === id);
    if (!zone) throw new Error('Zone not found');

    if (updateData.name) zone.name = updateData.name;
    if (updateData.code) zone.code = String(updateData.code).toUpperCase();

    if (updateData.pincodes) {
      zone.pincodes = Array.isArray(updateData.pincodes)
        ? updateData.pincodes.map(p => p.toString().trim()).filter(Boolean)
        : String(updateData.pincodes)
            .split(',')
            .map(p => p.trim())
            .filter(Boolean);
    }

    if (updateData.centerLat != null) zone.centerLat = parseFloat(updateData.centerLat);
    if (updateData.centerLng != null) zone.centerLng = parseFloat(updateData.centerLng);

    return zone;
  }

  async deleteZone(id) {
    const index = (memoryDb.zones || []).findIndex(z => z.id === id);
    if (index === -1) throw new Error('Zone not found');
    memoryDb.zones.splice(index, 1);
    return true;
  }
}

module.exports = new ZoneService();