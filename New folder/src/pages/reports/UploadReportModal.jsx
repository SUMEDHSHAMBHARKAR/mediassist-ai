import { useEffect, useRef, useState } from "react";

import Banner from "../../components/ui/Banner";
import Button from "../../components/ui/Button";
import FileUpload, { FileRow } from "../../components/ui/FileUpload";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import Textarea from "../../components/ui/Textarea";
import { Checkbox } from "../../components/ui/Checkbox";
import { REPORT_TYPES } from "../../constants/statuses";
import { reportsService } from "../../services/clinicalService";

/**
 * UploadReportModal — attach a report file to a patient.
 *
 * The progress shown while "uploading" is simulated locally so the queued /
 * uploading / done / error states are all reachable and reviewable. Nothing is
 * transmitted: the real implementation posts to /reports/ with FormData.
 */
function UploadReportModal({
  open,
  onClose,
  patients = [],
  doctors = [],
  defaultPatientId,
  onUploaded,
}) {
  const [form, setForm] = useState({
    patientId: defaultPatientId || "",
    doctorId: "",
    title: "",
    type: "lab",
    summary: "",
  });
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | uploading | done | error
  const [progress, setProgress] = useState(0);
  const [analyse, setAnalyse] = useState(true);
  const [touched, setTouched] = useState(false);

  const timerRef = useRef(null);

  // Clear the simulated progress timer if the dialog closes mid-flight.
  useEffect(() => () => window.clearInterval(timerRef.current), []);

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const errors = {
    patientId: touched && !form.patientId ? "Select the patient." : null,
    title: touched && !form.title.trim() ? "Give the report a title." : null,
    files: touched && files.length === 0 ? "Attach at least one file." : null,
  };

  const isValid = form.patientId && form.title.trim() && files.length > 0;

  const submit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (!isValid || status === "uploading") return;

    setStatus("uploading");
    setProgress(0);

    // Simulated transfer so the progress and completion states are exercised.
    timerRef.current = window.setInterval(() => {
      setProgress((current) => {
        const next = current + 12;
        if (next >= 100) {
          window.clearInterval(timerRef.current);
          return 100;
        }
        return next;
      });
    }, 160);

    try {
      await reportsService.upload({
        ...form,
        file: files[0],
        patient_id: Number(form.patientId) || form.patientId,
        report_type: form.type || "Other",
        notes: form.summary,
        fileName: files[0].name,
        sizeBytes: files[0].size,
        status: "Uploaded",
        aiAnalysed: analyse,
      });
      window.clearInterval(timerRef.current);
      setProgress(100);
      setStatus("done");
      onUploaded?.();
    } catch {
      window.clearInterval(timerRef.current);
      setStatus("error");
    }
  };

  const reset = () => {
    setFiles([]);
    setProgress(0);
    setStatus("idle");
    setTouched(false);
    setForm({ patientId: defaultPatientId || "", doctorId: "", title: "", type: "lab", summary: "" });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Upload report"
      subtitle="Laboratory results, imaging, discharge summaries and referrals"
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
          <Banner tone="success" title="Upload accepted">
            {files[0]?.name} was accepted and is queued for processing. It will move
            to Ready once the server finishes indexing it.
          </Banner>
          {analyse && (
            <Banner tone="accent" icon="ai">
              AI analysis was requested. A summary will be attached to the report
              once the AI service is connected.
            </Banner>
          )}
          <Banner tone="accent" icon="info">
            The reports API is not connected yet, so nothing was actually
            transmitted or stored.
          </Banner>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <div className="col col--gap-lg">
            <div className="col col--gap-xs">
              <FileUpload
                multiple={false}
                onFilesSelected={(selected) => setFiles(selected)}
                title="Drop a report here or browse"
                hint="PDF, JPG, PNG or DICOM · up to 25 MB"
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
                    progress={progress}
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
                  label: `${patient.name} · ${patient.mrn}`,
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

            <Input
              label="Report title"
              placeholder="Comprehensive metabolic panel"
              value={form.title}
              onChange={set("title")}
              error={errors.title}
              required
            />

            <Select
              label="Requesting clinician"
              options={doctors.map((doctor) => ({
                value: doctor.id,
                label: `${doctor.name} · ${doctor.specialisation}`,
              }))}
              placeholder="Unassigned"
              value={form.doctorId}
              onChange={set("doctorId")}
            />

            <Textarea
              label="Summary (optional)"
              rows={3}
              placeholder="Key findings, if already known"
              value={form.summary}
              onChange={set("summary")}
            />

            <Checkbox
              label="Request AI analysis once processing completes"
              checked={analyse}
              onChange={(event) => setAnalyse(event.target.checked)}
            />

            {status === "error" && (
              <Banner tone="critical" title="Upload failed">
                The transfer did not complete. Check the file and try again.
              </Banner>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}

export default UploadReportModal;
