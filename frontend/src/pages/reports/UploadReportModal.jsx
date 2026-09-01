import { useState } from "react";

import Banner from "../../components/ui/Banner";
import Button from "../../components/ui/Button";
import FileUpload, { FileRow } from "../../components/ui/FileUpload";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import Textarea from "../../components/ui/Textarea";
import { REPORT_TYPES } from "../../constants/statuses";
import { reportsService } from "../../services/clinicalService";

function UploadReportModal({
  open,
  onClose,
  patients = [],
  _doctors = [],
  defaultPatientId,
  onUploaded,
}) {
  const [form, setForm] = useState({
    patientId: defaultPatientId || "",
    type: "Lab Report",
    notes: "",
  });
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | uploading | done | error
  const [errorMessage, setErrorMessage] = useState(null);
  const [touched, setTouched] = useState(false);

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const errors = {
    patientId: touched && !form.patientId ? "Select the patient." : null,
    files: touched && files.length === 0 ? "Attach at least one file." : null,
  };

  const isValid = form.patientId && files.length > 0;

  const submit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (!isValid || status === "uploading") return;

    setStatus("uploading");
    setErrorMessage(null);

    try {
      await reportsService.upload({
        file: files[0],
        patient_id: Number(form.patientId),
        report_type: form.type || "Lab Report",
        notes: form.notes.trim() || undefined,
      });

      setStatus("done");
      onUploaded?.();
    } catch (err) {
      setErrorMessage(err?.message || "Failed to upload file to backend.");
      setStatus("error");
    }
  };

  const reset = () => {
    setFiles([]);
    setStatus("idle");
    setTouched(false);
    setForm({ patientId: defaultPatientId || "", type: "Lab Report", notes: "" });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Upload Report"
      subtitle="Upload laboratory results or diagnostic reports"
      footer={
        status === "done" ? (
          <>
            <Button variant="ghost" onClick={reset} icon="plus">
              Upload another
            </Button>
            <Button variant="primary" onClick={onClose}>
              Done
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose} disabled={status === "uploading"}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon="upload"
              onClick={submit}
              loading={status === "uploading"}
            >
              {status === "uploading" ? "Uploading" : "Upload report"}
            </Button>
          </>
        )
      }
    >
      {status === "done" ? (
        <div className="col col--gap-md">
          <Banner tone="success" title="Upload complete">
            {files[0]?.name} uploaded and saved successfully.
          </Banner>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <div className="col col--gap-lg">
            <div className="col col--gap-xs">
              <FileUpload
                multiple={false}
                onFilesSelected={(selected) => setFiles(selected)}
                title="Drop a report file here or browse"
                hint="PDF, JPG, PNG or document files"
              />
              {errors.files && (
                <span className="field__error" role="alert">
                  {errors.files}
                </span>
              )}
            </div>

            {files.length > 0 && (
              <div className="col col--gap-xs">
                {files.map((file) => (
                  <FileRow
                    key={file.name}
                    name={file.name}
                    size={file.size}
                    status={status === "uploading" ? "uploading" : "queued"}
                    onRemove={
                      status === "uploading"
                        ? undefined
                        : () => setFiles(files.filter((entry) => entry !== file))
                    }
                  />
                ))}
              </div>
            )}

            <div className="grid grid--2 grid--tight">
              <Select
                label="Patient"
                options={patients.map((patient) => ({
                  value: patient.id,
                  label: `${patient.name} · ${patient.mobile_no}`,
                }))}
                placeholder="Select patient"
                value={form.patientId}
                onChange={set("patientId")}
                error={errors.patientId}
                disabled={Boolean(defaultPatientId)}
                required
              />
              <Select
                label="Report type"
                options={REPORT_TYPES}
                value={form.type}
                onChange={set("type")}
              />
            </div>

            <Textarea
              label="Notes (optional)"
              rows={3}
              placeholder="Clinical notes or key findings"
              value={form.notes}
              onChange={set("notes")}
            />

            {status === "error" && (
              <Banner tone="critical" title="Upload failed">
                {errorMessage || "The transfer did not complete. Try again."}
              </Banner>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}

export default UploadReportModal;
