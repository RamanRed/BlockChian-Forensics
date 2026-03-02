import api from "./api";

const authService = {
  async login(payload) {
    const { data } = await api.post("/auth/login", payload);
    return data;
  },
  async register(payload) {
    const { data } = await api.post("/auth/register", payload);
    return data;
  },
  async getProfile() {
    const { data } = await api.get("/auth/me");
    return data;
  }
};

export default authService;
