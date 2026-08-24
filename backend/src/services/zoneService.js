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
    const zone = memoryDb.zones.find(z => z.pincodes.includes(cleanPin));
    if (zone) return zone;
    
    // Default fallback zone if pincode is unknown
    return memoryDb.zones[0] || null;
  }

  async createZone({ name, code, pincodes, centerLat, centerLng }) {
    const newZone = {
      id: `zone-${Date.now()}`,
      name,
      code: code.toUpperCase(),
      pincodes: Array.isArray(pincodes) ? pincodes : pincodes.split(',').map(p => p.trim()),
      centerLat: parseFloat(centerLat) || 37.7749,
      centerLng: parseFloat(centerLng) || -122.4194
    };
    memoryDb.zones.push(newZone);
    return newZone;
  }

  async updateZone(id, updateData) {
    const zone = memoryDb.zones.find(z => z.id === id);
    if (!zone) throw new Error('Zone not found');

    if (updateData.name) zone.name = updateData.name;
    if (updateData.code) zone.code = updateData.code.toUpperCase();
    if (updateData.pincodes) {
      zone.pincodes = Array.isArray(updateData.pincodes)
        ? updateData.pincodes
        : updateData.pincodes.split(',').map(p => p.trim());
    }
    if (updateData.centerLat) zone.centerLat = parseFloat(updateData.centerLat);
    if (updateData.centerLng) zone.centerLng = parseFloat(updateData.centerLng);

    return zone;
  }

  async deleteZone(id) {
    const index = memoryDb.zones.findIndex(z => z.id === id);
    if (index === -1) throw new Error('Zone not found');
    memoryDb.zones.splice(index, 1);
    return true;
  }
}

module.exports = new ZoneService();
