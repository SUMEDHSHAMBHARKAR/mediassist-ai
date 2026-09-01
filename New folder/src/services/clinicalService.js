import { medicalRecords } from "../mock/medicalRecords";
import { prescriptions } from "../mock/prescriptions";
import { reports } from "../mock/reports";
import { resolve } from "./mockTransport";

/**
 * Medical records service.
 *
 *   list          -> (composed client-side today)
 *   listByPatient -> GET    /medical-records/patient/{patient_id}
 *   getById       -> GET    /medical-records/{medical_record_id}
 *   create        -> POST   /medical-records/
 *   update        -> PUT    /medical-records/{medical_record_id}
 *   remove        -> DELETE /medical-records/{medical_record_id}
 */
export const medicalRecordsService = {
  list() {
    return resolve(medicalRecords);
  },

  getById(recordId) {
    const record = medicalRecords.find((entry) => String(entry.id) === String(recordId) || entry.id === recordId);

    if (!record) {
      return Promise.reject(new Error(`No medical record found for id ${recordId}.`));
    }

    return resolve(record);
  },

  listByPatient(patientId, params = {}) {
    let result = medicalRecords.filter((entry) => String(entry.patientId || entry.patient_id) === String(patientId) || entry.patientId === patientId);

    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter((entry) => entry.diagnosis?.toLowerCase().includes(q) || entry.chief_complaint?.toLowerCase().includes(q));
    }

    return resolve(result.sort((a, b) => new Date(b.visitDate || b.visit_date) - new Date(a.visitDate || a.visit_date)));
  },

  listByDoctor(doctorId) {
    return resolve(medicalRecords.filter((entry) => String(entry.doctorId || entry.doctor_id) === String(doctorId) || entry.doctorId === doctorId));
  },

  create(payload) {
    return resolve({ ...payload, id: Date.now() }, { delay: 460 });
  },

  update(recordId, payload) {
    return resolve({ id: recordId, ...payload }, { delay: 460 });
  },

  remove(recordId) {
    return resolve({ id: recordId, deleted: true }, { delay: 360 });
  },
};

/**
 * Reports service.
 *
 *   listByPatient -> GET    /reports/patient/{patient_id}
 *   getById       -> GET    /reports/{report_id}
 *   create/upload -> POST   /reports/ (multipart/form-data)
 *   download      -> GET    /reports/download/{report_id}
 *   remove        -> DELETE /reports/{report_id}
 */
export const reportsService = {
  list() {
    return resolve(reports);
  },

  getById(reportId) {
    const report = reports.find((entry) => String(entry.id) === String(reportId) || entry.id === reportId);

    if (!report) {
      return Promise.reject(new Error(`No report found for id ${reportId}.`));
    }

    return resolve(report);
  },

  listByPatient(patientId, params = {}) {
    let result = reports.filter((entry) => String(entry.patientId || entry.patient_id) === String(patientId) || entry.patientId === patientId);

    if (params.report_type) {
      result = result.filter((r) => r.type === params.report_type || r.report_type === params.report_type);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter((r) => r.title?.toLowerCase().includes(q) || r.notes?.toLowerCase().includes(q));
    }

    return resolve(result.sort((a, b) => new Date(b.uploadedAt || b.uploaded_at) - new Date(a.uploadedAt || a.uploaded_at)));
  },

  create(payload) {
    return this.upload(payload);
  },

  upload(payload) {
    const isForm = payload instanceof FormData;
    const patientId = isForm ? payload.get("patient_id") : payload.patient_id || payload.patientId;
    const reportType = isForm ? payload.get("report_type") : payload.report_type || payload.type;
    const notes = isForm ? payload.get("notes") : payload.notes;
    const file = isForm ? payload.get("file") : payload.file;

    return resolve(
      {
        id: Date.now(),
        patient_id: patientId,
        patientId,
        report_type: reportType || "Other",
        type: reportType || "Other",
        notes: notes || null,
        original_filename: file?.name || payload.fileName || "report.pdf",
        fileName: file?.name || payload.fileName || "report.pdf",
        content_type: file?.type || "application/pdf",
        file_size: file?.size || 1024,
        sizeBytes: file?.size || 1024,
        status: "Uploaded",
        uploaded_at: new Date().toISOString(),
        uploadedAt: new Date().toISOString(),
      },
      { delay: 520 },
    );
  },

  /** Represents stream GET /reports/download/{report_id} */
  download(reportId) {
    return resolve({ id: reportId, ready: true, blob: new Blob(["mock report content"], { type: "application/pdf" }) }, { delay: 300 });
  },

  remove(reportId) {
    return resolve({ id: reportId, deleted: true }, { delay: 340 });
  },
};

/**
 * Prescriptions service.
 *
 *   listByPatient -> GET  /prescriptions/patient/{patient_id}
 *   listByDoctor  -> GET  /prescriptions/doctor/{doctor_id}
 *   getById       -> GET  /prescriptions/{prescription_id}
 *   create        -> POST /prescriptions/
 *   update        -> PUT  /prescriptions/{prescription_id}
 *   remove        -> DELETE /prescriptions/{prescription_id}
 */
export const prescriptionsService = {
  list() {
    return resolve(prescriptions);
  },

  getById(prescriptionId) {
    const prescription = prescriptions.find((entry) => String(entry.id) === String(prescriptionId) || entry.id === prescriptionId);

    if (!prescription) {
      return Promise.reject(
        new Error(`No prescription found for id ${prescriptionId}.`),
      );
    }

    return resolve(prescription);
  },

  listByPatient(patientId) {
    return resolve(
      prescriptions
        .filter((entry) => String(entry.patientId || entry.patient_id) === String(patientId) || entry.patientId === patientId)
        .sort((a, b) => new Date(b.issuedAt || b.prescription_date) - new Date(a.issuedAt || a.prescription_date)),
    );
  },

  listByDoctor(doctorId) {
    return resolve(prescriptions.filter((entry) => String(entry.doctorId || entry.doctor_id) === String(doctorId) || entry.doctorId === doctorId));
  },

  create(payload) {
    const items = payload.prescription_items || payload.items || [];
    return resolve(
      {
        ...payload,
        id: Date.now(),
        code: `RX-${Date.now()}`,
        patient_id: payload.patient_id || payload.patientId,
        doctor_id: payload.doctor_id || payload.doctorId,
        medical_record_id: payload.medical_record_id || payload.recordId,
        prescription_date: payload.prescription_date || new Date().toISOString(),
        prescription_items: items.map((item, idx) => ({
          id: idx + 1,
          medicine_name: item.medicine_name || item.name,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration || `${item.durationDays || 30} days`,
          route: item.route || "oral",
          notes: item.notes || item.instructions || null,
        })),
        items: items,
      },
      { delay: 480 },
    );
  },

  update(prescriptionId, updateData) {
    return resolve({ id: prescriptionId, ...updateData }, { delay: 420 });
  },

  remove(prescriptionId) {
    return resolve({ id: prescriptionId, deleted: true }, { delay: 350 });
  },
};
