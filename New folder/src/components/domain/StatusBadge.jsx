import {
  APPOINTMENT_STATUS_META,
  PATIENT_STATUS_META,
  PAYMENT_STATUS_META,
  REPORT_STATUS_META,
  RX_STATUS_META,
  SEVERITY_META,
  statusMeta,
} from "../../constants/statuses";
import Badge from "../ui/Badge";

/**
 * StatusBadge — resolves a domain status string to its label and tone.
 *
 * One component for every status vocabulary so a "cancelled" appointment and a
 * "void" invoice always read with the same visual weight. `kind` selects the map.
 */
const MAPS = {
  appointment: APPOINTMENT_STATUS_META,
  payment: PAYMENT_STATUS_META,
  report: REPORT_STATUS_META,
  prescription: RX_STATUS_META,
  severity: SEVERITY_META,
  patient: PATIENT_STATUS_META,
};

function StatusBadge({ kind, value, size, dot = false, icon, className }) {
  const meta = statusMeta(MAPS[kind] || {}, value);

  return (
    <Badge tone={meta.tone} size={size} dot={dot} icon={icon} className={className}>
      {meta.label}
    </Badge>
  );
}

export default StatusBadge;
