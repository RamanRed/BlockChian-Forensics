import api from "./api";

const verificationService = {
  async verifyEvidence(evidenceId) {
    const { data } = await api.post(`/verify/${evidenceId}`);
    return data;
  }
};

export default verificationService;
