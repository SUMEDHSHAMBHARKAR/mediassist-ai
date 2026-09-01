import { Link } from "react-router-dom";

import cx from "../../utils/classNames";
import { formatCurrency, formatDate } from "../../utils/format";
import Icon from "../ui/Icon";
import StatusBadge from "./StatusBadge";

function InvoiceCard({ invoice, patient, actions, className }) {
  const pId = invoice.patient_id || invoice.patientId;
  const amount = invoice.amount || invoice.total || 0;
  const status = invoice.payment_status || invoice.status || "Pending";
  const dateVal = invoice.payment_date || invoice.issuedAt;

  return (
    <article
      className={cx("card", className)}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <div className="card__body card__body--tight col col--gap-sm" style={{ flex: "1 1 auto" }}>
        <div className="row row--between row--top row--wrap">
          <div className="col col--gap-xxs">
            <span className="t-mono t-muted">#{invoice.id}</span>
            <Link to={`/patients/${pId}`} className="t-title-sm t-ink">
              {patient?.name || `Patient #${pId}`}
            </Link>
          </div>
          <StatusBadge kind="payment" value={status} />
        </div>

        <div className="divider" />

        <div className="row row--between row--top">
          <div className="col col--gap-xxs">
            <span className="t-label t-label--sm">Amount Billed</span>
            <span className="t-title-lg t-tabular t-ink">
              {formatCurrency(amount)}
            </span>
          </div>
        </div>

        {invoice.notes && (
          <p className="t-body-sm t-clamp-2">{invoice.notes}</p>
        )}

        <div className="meta">
          <span className="meta__item">
            <Icon name="billing" size={13} />
            Date: {formatDate(dateVal)}
          </span>
        </div>
      </div>

      <footer className="card__foot">
        <Link to={`/billing/${invoice.id}`} className="text-link text-link--sm">
          View invoice
          <Icon name="arrowRight" size={13} />
        </Link>
        {actions && <div className="row row--tight">{actions}</div>}
      </footer>
    </article>
  );
}

export default InvoiceCard;
