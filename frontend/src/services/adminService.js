import api from './api';

export const adminService = {
  getAnalytics: async () => {
    const response = await api.get('/admin/analytics');
    return response.data;
  },
  getZones: async () => {
    const response = await api.get('/admin/zones');
    return response.data;
  },
  createZone: async (zoneData) => {
    const response = await api.post('/admin/zones', zoneData);
    return response.data;
  },
  updateZone: async (id, zoneData) => {
    const response = await api.put(`/admin/zones/${id}`, zoneData);
    return response.data;
  },
  deleteZone: async (id) => {
    const response = await api.delete(`/admin/zones/${id}`);
    return response.data;
  },
  getRateCards: async () => {
    const response = await api.get('/admin/rate-cards');
    return response.data;
  },
  createRateCard: async (cardData) => {
    const response = await api.post('/admin/rate-cards', cardData);
    return response.data;
  },
  updateRateCard: async (id, cardData) => {
    const response = await api.put(`/admin/rate-cards/${id}`, cardData);
    return response.data;
  },
  getAgents: async () => {
    const response = await api.get('/admin/agents');
    return response.data;
  }
};