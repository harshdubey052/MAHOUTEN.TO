// Mahouten API Layer
import axios from './axios.js';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => axios.post('/api/v1/auth/register/', data),
  login:    (data) => axios.post('/api/v1/auth/login/', data),
  refresh:  ()     => axios.post('/api/v1/auth/refresh/'),
  logout:   ()     => axios.post('/api/v1/auth/logout/'),
  me:       ()     => axios.get('/api/v1/auth/me/'),
};

// ── Profiles ──────────────────────────────────────────────────────────────────
export const profileApi = {
  list:   ()       => axios.get('/api/v1/profiles/'),
  create: (data)   => axios.post('/api/v1/profiles/', data),
  update: (id, d)  => axios.patch(`/api/v1/profiles/${id}/`, d),
  delete: (id)     => axios.delete(`/api/v1/profiles/${id}/`),
};

// ── Catalog ───────────────────────────────────────────────────────────────────
export const catalogApi = {
  homeRows:    ()          => axios.get('/api/v1/home/rows/').then(r => r.data),
  animeList:   (params)    => axios.get('/api/v1/anime/', { params }).then(r => r.data),
  animeDetail: (slug)      => axios.get(`/api/v1/anime/${slug}/`).then(r => r.data),
  episodes:    (slug)      => axios.get(`/api/v1/anime/${slug}/episodes/`).then(r => r.data),
  search:      (q, params) => axios.get('/api/v1/search/', { params: { q, ...params } }).then(r => r.data),
  genres:      ()          => axios.get('/api/v1/genres/').then(r => r.data),
  reviews:     (slug)      => axios.get(`/api/v1/anime/${slug}/reviews/`).then(r => r.data),
  addReview:   (slug, d)   => axios.post(`/api/v1/anime/${slug}/reviews/`, d),
  studioUpload: (data, onProgress) => {
    const isFormData = data instanceof FormData;
    return axios.post('/api/v1/studio/upload/', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
      onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / (e.total || 1))),
    }).then(r => r.data);
  },
  autofill: (query) => axios.get('/api/v1/studio/autofill/', { params: { query } }).then(r => r.data),
};

// ── Library ───────────────────────────────────────────────────────────────────
export const libraryApi = {
  myList:         ()     => axios.get('/api/v1/my-list/').then(r => r.data),
  addToList:      (id)   => axios.post('/api/v1/my-list/', { anime_id: id }),
  removeFromList: (id)   => axios.delete(`/api/v1/my-list/${id}/`),
  checkInList:    (id)   => axios.get(`/api/v1/my-list/check/${id}/`).then(r => r.data),
  history:        ()     => axios.get('/api/v1/history/').then(r => r.data),
};

// ── Streaming ─────────────────────────────────────────────────────────────────
export const streamingApi = {
  progress:     (profileId) => axios.get('/api/v1/progress/', { params: { profile_id: profileId } }).then(r => r.data),
  saveProgress: (data)      => axios.post('/api/v1/progress/', data),
  continueWatching: (profileId) => axios.get('/api/v1/continue-watching/', { params: { profile_id: profileId } }).then(r => r.data),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  // Stats
  stats: () => axios.get('/api/v1/admin/stats/').then(r => r.data),

  // Shows
  shows:       (params) => axios.get('/api/v1/admin/shows/', { params }).then(r => r.data),
  createShow:  (data)   => axios.post('/api/v1/admin/shows/', data),
  updateShow:  (id, d)  => axios.patch(`/api/v1/admin/shows/${id}/`, d),
  deleteShow:  (id)     => axios.delete(`/api/v1/admin/shows/${id}/`),

  // Seasons
  seasons:       (showId) => axios.get('/api/v1/admin/seasons/', { params: { show: showId } }).then(r => r.data),
  createSeason:  (data)   => axios.post('/api/v1/admin/seasons/', data),
  updateSeason:  (id, d)  => axios.patch(`/api/v1/admin/seasons/${id}/`, d),
  deleteSeason:  (id)     => axios.delete(`/api/v1/admin/seasons/${id}/`),

  // Episodes
  episodes:       (params) => axios.get('/api/v1/admin/episodes/', { params }).then(r => r.data),
  createEpisode:  (data)   => axios.post('/api/v1/admin/episodes/', data),
  updateEpisode:  (id, d)  => axios.patch(`/api/v1/admin/episodes/${id}/`, d),
  deleteEpisode:  (id)     => axios.delete(`/api/v1/admin/episodes/${id}/`),
  bulkEpisodes:   (data)   => axios.post('/api/v1/admin/episodes/bulk/', data),

  // Video upload with progress
  uploadVideo: (episodeId, formData, onProgress) => {
    return axios.post(`/api/v1/admin/episodes/${episodeId}/upload-video/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / (e.total || 1))),
    });
  },
  processingStatus: (episodeId) => axios.get(`/api/v1/admin/episodes/${episodeId}/processing-status/`).then(r => r.data),

  // Uploads
  uploadImage:    (fd) => axios.post('/api/v1/admin/upload/image/', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  uploadSubtitle: (fd) => axios.post('/api/v1/admin/upload/subtitle/', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),

  // Users
  users:      (params) => axios.get('/api/v1/admin/users/', { params }).then(r => r.data),
  updateUser: (id, d)  => axios.patch(`/api/v1/admin/users/${id}/`, d),

  // Genres
  genres:       ()      => axios.get('/api/v1/genres/').then(r => r.data),
  createGenre:  (data)  => axios.post('/api/v1/admin/genres/', data),
  updateGenre:  (id, d) => axios.patch(`/api/v1/admin/genres/${id}/`, d),
  deleteGenre:  (id)    => axios.delete(`/api/v1/admin/genres/${id}/`),

  // Homepage rows
  homepageRows: ()      => axios.get('/api/v1/admin/homepage-rows/').then(r => r.data),
  createRow:    (data)  => axios.post('/api/v1/admin/homepage-rows/', data),
  updateRow:    (id, d) => axios.patch(`/api/v1/admin/homepage-rows/${id}/`, d),
  deleteRow:    (id)    => axios.delete(`/api/v1/admin/homepage-rows/${id}/`),

  // Audit logs
  auditLogs: (params) => axios.get('/api/v1/admin/audit-logs/', { params }).then(r => r.data),
};

