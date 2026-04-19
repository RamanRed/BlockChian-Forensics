import api from "./api";

const verificationService = {
  // Verify a PropertyRegister item by its DB id
  async verifyEvidence(evidenceId) {
    const { data } = await api.get(`/verify/property/${evidenceId}`);
    return data;
  },
  // Verify a FIR by its DB id
  async verifyFir(firId) {
    const { data } = await api.get(`/verify/fir/${firId}`);
    return data;
  }
};

export default verificationService;
