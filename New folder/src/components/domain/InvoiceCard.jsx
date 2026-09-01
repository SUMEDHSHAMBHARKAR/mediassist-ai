import { Link } from "react-router-dom";

import { PAYMENT_METHODS, optionLabel } from "../../constants/statuses";
import cx from "../../utils/classNames";
import { formatCurrency, formatDate } from "../../utils/format";
import Badge from "../ui/Badge";
import Icon from "../ui/Icon";
import { Progress } from "../ui/Banner";
import StatusBadge from "./StatusBadge";

/**
 * InvoiceCard — invoice summary.
 *
 * The outstanding balance, not the total, is the headline figure: it is the
 * number that determines whether anyone needs to act.
 */
function InvoiceCard({ invoice, patient, actions, className }) {
  const outstanding = Math.max(0, invoice.total - invoice.amountPaid);
  const paidRatio = invoice.total > 0 ? (invoice.amountPaid / invoice.total) * 100 : 0;
  const isOverdue = invoice.status === "overdue";

  return (
    <article
      className={cx("card", isOverdue && "card--critical", className)}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <div className="card__body card__body--tight col col--gap-sm" style={{ flex: "1 1 auto" }}>
        <div className="row row--between row--top row--wrap">
          <div className="col col--gap-xxs">
            <span className="t-mono t-muted">{invoice.invoiceNo}</span>
            {patient && (
              <Link to={`/patients/${patient.id}`} className="t-title-sm t-ink">
                {patient.name}
              </Link>
            )}
          </div>
          <StatusBadge kind="payment" value={invoice.status} />
        </div>

        <div className="divider" />

        <div className="row row--between row--top">
          <div className="col col--gap-xxs">
            <span className="t-label t-label--sm">Outstanding</span>
            <span
              className={cx(
                "t-title-lg t-tabular",
                outstanding > 0 ? "t-ink" : "t-success",
              )}
            >
              {formatCurrency(outstanding)}
            </span>
          </div>
          <div className="col col--gap-xxs" style={{ alignItems: "flex-end" }}>
            <span className="t-label t-label--sm">Total</span>
            <span className="t-data t-strong t-tabular">
              {formatCurrency(invoice.total)}
            </span>
          </div>
        </div>

        {invoice.amountPaid > 0 && outstanding > 0 && (
          <div className="col col--gap-xxs">
            <Progress value={paidRatio} tone="warning" label="Amount paid" />
            <span className="t-caption">
              {formatCurrency(invoice.amountPaid)} received of{" "}
              {formatCurrency(invoice.total)}
            </span>
          </div>
        )}

        <div className="meta">
          <span className="meta__item">
            <Icon name="billing" size={13} />
            Issued {formatDate(invoice.issuedAt)}
          </span>
          <span className="meta__sep" aria-hidden="true" />
          <span className={cx("meta__item", isOverdue && "t-critical")}>
            <Icon name="clock" size={13} />
            Due {formatDate(invoice.dueAt)}
          </span>
          {invoice.method && (
            <>
              <span className="meta__sep" aria-hidden="true" />
              <span className="meta__item">
                <Icon name="creditCard" size={13} />
                {optionLabel(PAYMENT_METHODS, invoice.method)}
              </span>
            </>
          )}
        </div>

        {invoice.insuranceClaim && (
          <div className="row row--tight row--wrap">
            <Badge tone="outline" icon="shieldCheck">
              {invoice.insuranceClaim.provider}
            </Badge>
            <Badge
              tone={
                invoice.insuranceClaim.status === "approved"
                  ? "success"
                  : invoice.insuranceClaim.status === "rejected"
                    ? "critical"
                    : "warning"
              }
            >
              Claim {invoice.insuranceClaim.status}
            </Badge>
          </div>
        )}
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
