import api from './api';

export const jobService = {
  getJobs: async (params) => {
    const response = await api.get('/api/jobs', { params });
    return response.data;
  },

  getJobById: async (id) => {
    const response = await api.get(`/api/jobs/${id}`);
    return response.data;
  },

  createJob: async (jobData) => {
    const response = await api.post('/api/jobs', jobData);
    return response.data;
  },

  getJobMatches: async () => {
    const response = await api.get('/api/jobs/matches');
    return response.data;
  },

  getSavedJobs: async () => {
    const response = await api.get('/api/jobs/saved');
    return response.data;
  },

  saveJob: async (jobId) => {
    const response = await api.post(`/api/jobs/${jobId}/save`);
    return response.data;
  },

  unsaveJob: async (jobId) => {
    const response = await api.delete(`/api/jobs/${jobId}/save`);
    return response.data;
  },

  getApplications: async () => {
    const response = await api.get('/api/jobs/applications');
    return response.data;
  },

  getApplicationById: async (id) => {
    const response = await api.get(`/api/jobs/applications/${id}`);
    return response.data;
  },

  applyToJob: async (jobId, data) => {
    const response = await api.post(`/api/jobs/${jobId}/apply`, data);
    return response.data;
  },

  updateApplicationStatus: async (applicationId, status) => {
    const response = await api.patch(`/api/jobs/applications/${applicationId}/status`, { status });
    return response.data;
  },
};

export default jobService;
