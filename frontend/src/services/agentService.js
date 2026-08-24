import api from './api';

export const agentService = {
  getProfile: async () => {
    const response = await api.get('/agent/profile');
    return response.data;
  },
  updateLocation: async (data) => {
    const response = await api.put('/agent/location', data);
    return response.data;
  }
};
