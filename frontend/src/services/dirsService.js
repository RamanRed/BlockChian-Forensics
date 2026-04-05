import api from "./api";

// Helper to unwrap axios response
const unwrap = (promise) => promise.then((res) => res.data);

// FIR Service
const firService = {
  register: (data) => unwrap(api.post("/fir/register", data)),
  correct: (firId, note) =>
    unwrap(api.post(`/fir/${firId}/correct`, null, { params: { correction_note: note } })),
  updateStatus: (firId, data) => unwrap(api.patch(`/fir/${firId}/status`, data)),
  getById: (firId) => unwrap(api.get(`/fir/${firId}`)),
  list: (params) => unwrap(api.get("/fir/", { params })),
};

// Case Diary Service
const diaryService = {
  addEntry: (firId, data) => unwrap(api.post(`/diary/${firId}/entry`, data)),
  getEntries: (firId) => unwrap(api.get(`/diary/${firId}`)),
};

// Seizure & Property Service
const seizureService = {
  createMemo: (data) => unwrap(api.post("/seizure/memo", data)),
  getMemo: (memoId) => unwrap(api.get(`/seizure/memo/${memoId}`)),
  listMemos: (params) => unwrap(api.get("/seizure/memo", { params })),
  uploadProperty: (formData) =>
    unwrap(api.post("/seizure/property/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })),
  getProperty: (propertyId) => unwrap(api.get(`/seizure/property/${propertyId}`)),
  listProperties: (params) => unwrap(api.get("/seizure/property", { params })),
};

// Chain of Custody Service
const custodyService = {
  transfer: (data) => unwrap(api.post("/custody/transfer", data)),
  getHistory: (propertyId) => unwrap(api.get(`/custody/${propertyId}`)),
  getAvailableLabs: () => unwrap(api.get("/auth/users/cfsl")),
};

// Person Service
const personService = {
};

// Charge Sheet Service
const chargesheetService = {
  create: (data) => unwrap(api.post("/chargesheet/", data)),
  file: (csId) => unwrap(api.post(`/chargesheet/${csId}/file`)),
  getById: (csId) => unwrap(api.get(`/chargesheet/${csId}`)),
  list: (params) => unwrap(api.get("/chargesheet/", { params })),
};

// Court & Public Verification Service
const courtService = {
  publicVerify: (hash) => api.get(`/court/verify/${hash}`),
  addProceeding: (data) => unwrap(api.post("/court/proceedings", data)),
  getProceedings: (csId) => unwrap(api.get(`/court/proceedings/${csId}`)),
  listCases: () => unwrap(api.get("/court/cases")),
  getChainOfEvents: (firId) => unwrap(api.get(`/court/chain/${firId}`)),
};

// Verdict Service
const verdictService = {
  issue: (data) => unwrap(api.post("/verdict/", data)),
  getByFir: (firId) => unwrap(api.get(`/verdict/by-fir/${firId}`)),
  getByChargesheet: (csId) => unwrap(api.get(`/verdict/by-chargesheet/${csId}`)),
  listAll: (params) => unwrap(api.get("/verdict/all", { params })),
};

// Forensic Submission Service
const forensicSubmissionService = {
  submit: (data) => unwrap(api.post("/forensic/submit", data)),
  getIncoming: () => unwrap(api.get("/forensic/incoming")),
  submitLabResult: (submissionId, formData) =>
    unwrap(api.post(`/forensic/lab-result/${submissionId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })),
  getResults: (firId) => unwrap(api.get(`/forensic/results/${firId}`)),
  listAll: (params) => unwrap(api.get("/forensic/all", { params })),
};

// Verification Service
const verificationService = {
  verifyFir: (firId) => unwrap(api.get(`/verify/fir/${firId}`)),
  verifyProperty: (propertyId) => unwrap(api.get(`/verify/property/${propertyId}`)),
};

// Admin Service
const adminService = {
  getAuditLogs: (params) => unwrap(api.get("/admin/audit/logs", { params })),
  getQuarantine: () => unwrap(api.get("/admin/quarantine")),
  getUsers: () => unwrap(api.get("/admin/users")),
  updateRole: (userId, role) => unwrap(api.patch(`/admin/users/${userId}/role`, null, { params: { role } })),
  toggleActive: (userId, isActive) =>
    unwrap(api.patch(`/admin/users/${userId}/activate`, null, { params: { is_active: isActive } })),
};

// Lab Report & Findings Service
const findingsService = {
  uploadLabReport: (firId, formData) =>
    unwrap(
      api.post(`/investigation-findings/${firId}/lab-report`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ),
  getLabReports: (firId) => unwrap(api.get(`/investigation-findings/${firId}/lab-reports`)),
  getAllFindings: (firId) => unwrap(api.get(`/investigation-findings/${firId}/all`)),
};

export {
  firService,
  diaryService,
  seizureService,
  custodyService,
  personService,
  chargesheetService,
  courtService,
  verdictService,
  forensicSubmissionService,
  verificationService,
  adminService,
  findingsService,
};
