import api from "./api";

const adminService = {
  async getAuditLogs(params = {}) {
    const { data } = await api.get("/admin/audit/logs", { params });
    return data;
  },
  async getUsers() {
    const { data } = await api.get("/admin/users");
    return data;
  },
  async updateUserRole(userId, role) {
    const { data } = await api.patch(`/admin/users/${userId}/role`, null, {
      params: { role }
    });
    return data;
  },
  async deleteEvidence(evidenceId) {
    const { data } = await api.delete(`/admin/evidence/${evidenceId}`);
    return data;
  }
};

export default adminService;
