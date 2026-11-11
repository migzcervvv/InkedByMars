import { http } from "./http";

export const authApi = {
  login(credentials) {
    return http.post("/auth/login", credentials);
  },

  logout() {
    return http.post("/auth/logout");
  },

  me() {
    return http.get("/auth/me");
  },
  listUsers() {
    return http.get('/auth/users')
  },
  createUser(payload) {
    return http.post('/auth/users', payload)
  },
  editUser(id, payload) {
    return http.put(`/auth/users/${id}`, payload)
  },
  deleteUser(id) {
    return http.delete(`/auth/users/${id}`)
  },
  resetPassword(id, password) {
    return http.post(`/auth/users/${id}/reset-password`, { password })
  },

  register(payload) {
    return http.post("/auth/register", payload);
  },
};
