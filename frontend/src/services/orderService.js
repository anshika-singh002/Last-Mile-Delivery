import api from './api';

export const orderService = {
  previewCharge: async (orderData) => {
    const response = await api.post('/orders/preview-charge', orderData);
    return response.data;
  },
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },
  getOrders: async (filters = {}) => {
    const response = await api.get('/orders', { params: filters });
    return response.data;
  },
  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  updateStatus: async (id, statusData) => {
    const response = await api.patch(`/orders/${id}/status`, statusData);
    return response.data;
  },
  assignAgent: async (id, agentId) => {
    const response = await api.post(`/orders/${id}/assign`, { agentId });
    return response.data;
  },
  autoAssign: async (id) => {
    const response = await api.post(`/orders/${id}/auto-assign`);
    return response.data;
  },
  rescheduleOrder: async (id, rescheduleData) => {
    const response = await api.post(`/orders/${id}/reschedule`, rescheduleData);
    return response.data;
  },
  getTimeline: async (id) => {
    const response = await api.get(`/orders/${id}/timeline`);
    return response.data;
  }
};
