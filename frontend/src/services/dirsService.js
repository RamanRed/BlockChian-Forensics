import api from "./api";

// FIR Service
const firService = {
  register: (data) => api.post("/fir/register", data),
  correct: (firId, note) =>
    api.post(`/fir/${firId}/correct`, null, { params: { correction_note: note } }),
  updateStatus: (firId, data) => api.patch(`/fir/${firId}/status`, data),
  getById: (firId) => api.get(`/fir/${firId}`),
  list: (params) => api.get("/fir/", { params }),
};

// Case Diary Service
const diaryService = {
  addEntry: (firId, data) => api.post(`/diary/${firId}/entry`, data),
  getEntries: (firId) => api.get(`/diary/${firId}`),
};

// Seizure & Property Service
const seizureService = {
  createMemo: (data) => api.post("/seizure/memo", data),
  getMemo: (memoId) => api.get(`/seizure/memo/${memoId}`),
  listMemos: (params) => api.get("/seizure/memo", { params }),
  uploadProperty: (formData) =>
    api.post("/seizure/property/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getProperty: (propertyId) => api.get(`/seizure/property/${propertyId}`),
  listProperties: (params) => api.get("/seizure/property", { params }),
};

// Chain of Custody Service
const custodyService = {
  transfer: (data) => api.post("/custody/transfer", data),
  getHistory: (propertyId) => api.get(`/custody/${propertyId}`),
};

// Person Service
const personService = {
  register: (data) => api.post("/persons/", data),
  getById: (personId) => api.get(`/persons/${personId}`),
  linkToFir: (data) => api.post("/persons/link", data),
  getCases: (personId) => api.get(`/persons/${personId}/cases`),
  list: (params) => api.get("/persons/", { params }),
};

// Charge Sheet Service
const chargesheetService = {
  create: (data) => api.post("/chargesheet/", data),
  file: (csId) => api.post(`/chargesheet/${csId}/file`),
  getById: (csId) => api.get(`/chargesheet/${csId}`),
  list: (params) => api.get("/chargesheet/", { params }),
};

// Court & Public Verification Service
const courtService = {
  publicVerify: (hash) => api.get(`/court/verify/${hash}`),
  addProceeding: (data) => api.post("/court/proceedings", data),
  getProceedings: (csId) => api.get(`/court/proceedings/${csId}`),
};

// Verification Service
const verificationService = {
  verifyFir: (firId) => api.get(`/verify/fir/${firId}`),
  verifyProperty: (propertyId) => api.get(`/verify/property/${propertyId}`),
};

// Admin Service
const adminService = {
  getAuditLogs: (params) => api.get("/admin/audit/logs", { params }),
  getQuarantine: () => api.get("/admin/quarantine"),
  getUsers: () => api.get("/admin/users"),
  updateRole: (userId, role) => api.patch(`/admin/users/${userId}/role`, null, { params: { role } }),
  toggleActive: (userId, isActive) =>
    api.patch(`/admin/users/${userId}/activate`, null, { params: { is_active: isActive } }),
};

export {
  firService,
  diaryService,
  seizureService,
  custodyService,
  personService,
  chargesheetService,
  courtService,
  verificationService,
  adminService,
};
