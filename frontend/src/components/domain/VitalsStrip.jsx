import cx from "../../utils/classNames";
import { formatRelative } from "../../utils/format";
import Icon from "../ui/Icon";

/**
 * VitalsStrip — the latest observation set as a row of read-outs.
 *
 * Out-of-range values are flagged with colour AND a warning glyph, never colour
 * alone, so severity survives a monochrome print or colour-vision deficiency.
 */

/** Range checks are display hints only — clinical thresholds live in the backend. */
function flagFor(key, value) {
  if (value === null || value === undefined) return null;

  switch (key) {
    case "bloodPressure": {
      const [systolic, diastolic] = String(value).split("/").map(Number);
      if (systolic >= 160 || diastolic >= 100) return "critical";
      if (systolic >= 140 || diastolic >= 90) return "flag";
      return null;
    }
    case "heartRate":
      if (value > 110 || value < 50) return "critical";
      if (value > 100 || value < 55) return "flag";
      return null;
    case "temperature":
      if (value >= 38.5) return "critical";
      if (value >= 37.5) return "flag";
      return null;
    case "spo2":
      if (value < 94) return "critical";
      if (value < 96) return "flag";
      return null;
    case "bmi":
      if (value >= 30 || value < 16) return "critical";
      if (value >= 25 || value < 18.5) return "flag";
      return null;
    default:
      return null;
  }
}

const CELLS = [
  { key: "bloodPressure", label: "Blood pressure", unit: "mmHg" },
  { key: "heartRate", label: "Heart rate", unit: "bpm" },
  { key: "temperature", label: "Temperature", unit: "°C" },
  { key: "spo2", label: "SpO₂", unit: "%" },
  { key: "bmi", label: "BMI", unit: "" },
];

function VitalsStrip({ vitals, showRecordedAt = true, className }) {
  if (!vitals) return null;

  return (
    <div className={className}>
      <div className="vitals">
        {CELLS.map((cell) => {
          const value = vitals[cell.key];
          const flag = flagFor(cell.key, value);

          return (
            <div className="vitals__cell" key={cell.key}>
              <div
                className={cx(
                  "vitals__value",
                  flag === "flag" && "vitals__value--flag",
                  flag === "critical" && "vitals__value--critical",
                )}
              >
                {value ?? "—"}
                {cell.unit && <span className="vitals__unit">{cell.unit}</span>}
                {flag && (
                  <>
                    {" "}
                    <Icon
                      name="alertTriangle"
                      size={13}
                      strokeWidth={2}
                      style={{ display: "inline" }}
                    />
                    <span className="sr-only">
                      {flag === "critical" ? "Critically abnormal" : "Outside range"}
                    </span>
                  </>
                )}
              </div>
              <div className="vitals__label">{cell.label}</div>
            </div>
          );
        })}
      </div>

      {showRecordedAt && vitals.recordedAt && (
        <p className="t-caption" style={{ marginTop: "var(--s-xs)" }}>
          Recorded {formatRelative(vitals.recordedAt)}
        </p>
      )}
    </div>
  );
}

export default VitalsStrip;
