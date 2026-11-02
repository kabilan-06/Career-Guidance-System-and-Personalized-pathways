import api from './api';

const get = (request) => request.then(({ data }) => data);

export const mentorService = {
  getDashboard:   ()       => get(api.get('/api/mentor/dashboard')),
  getStudents:    (params) => get(api.get('/api/mentor/students', { params })),
  getStudent:     (id)     => get(api.get(`/api/mentor/students/${id}`)),   // fixed: singular → plural

  // Advisor profile (real endpoint on MentorAuthController)
  getProfile:     ()       => get(api.get('/api/mentor/profile')),
  changePassword: (data)   => get(api.put('/api/mentor/change-password', data)),

  // Per-student assessment review (real endpoints on AssessmentReviewController)
  getStudentAssessment:   (id)     => get(api.get(`/api/mentor/students/${id}/assessment`)),
  submitAssessmentFeedback: (id, feedback) => get(api.post(`/api/mentor/students/${id}/assessment/feedback`, { feedback })),

  // Per-student resume review (real endpoints on ResumeReviewController)
  getStudentResume: (id)   => get(api.get(`/api/mentor/students/${id}/resume`)),
  submitResumeFeedback: (id, feedback) => get(api.post(`/api/mentor/students/${id}/resume/feedback`, { feedback })),
  approveResume:    (id, comment) => get(api.patch(`/api/mentor/students/${id}/resume/approve`, comment ? { comment } : {})),
  rejectResume:     (id, feedback) => get(api.patch(`/api/mentor/students/${id}/resume/reject`, { feedback })),
  downloadResume:   (id)   => api.get(`/api/mentor/students/${id}/resume/download`, { responseType: 'blob' }),

  // Feedback history for the Feedback Hub (real endpoint on MentorFeedbackController)
  getFeedback:     ()      => get(api.get('/api/mentor/feedback')),
};
