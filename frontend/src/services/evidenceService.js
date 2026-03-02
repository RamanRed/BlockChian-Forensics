import api from "./api";

const evidenceService = {
  async uploadEvidence(formData) {
    const { data } = await api.post("/evidence/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return data;
  },
  async getAllEvidence(params = {}) {
    const { data } = await api.get("/evidence/all", { params });
    return data;
  },
  async getEvidenceById(id) {
    const { data } = await api.get(`/evidence/${id}`);
    return data;
  },
  async getQuarantineList() {
    const { data } = await api.get("/admin/quarantine");
    return data;
  }
};

export default evidenceService;
