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

  register(payload) {
    return http.post("/auth/register", payload);
  },
};
