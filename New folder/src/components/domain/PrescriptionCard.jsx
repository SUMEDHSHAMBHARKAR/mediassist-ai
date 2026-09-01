import { Link } from "react-router-dom";

import {
  DOSAGE_FREQUENCIES,
  DOSAGE_ROUTES,
  optionLabel,
} from "../../constants/statuses";
import cx from "../../utils/classNames";
import { formatDate, orDash } from "../../utils/format";
import Icon from "../ui/Icon";
import StatusBadge from "./StatusBadge";

/**
 * RxItem — a single medication line.
 *
 * Dosage, frequency, route and duration are always shown as four labelled cells
 * rather than a single run-on sentence, so a prescribing error is easier to spot.
 */
export function RxItem({ item, index }) {
  return (
    <li className="rx-item">
      <div className="rx-item__head">
        <div className="col col--gap-xxs">
          <span className="rx-item__name">
            {index !== undefined && (
              <span className="t-muted t-tabular">{index + 1}. </span>
            )}
            {item.name} {item.strength && <span className="t-muted">{item.strength}</span>}
          </span>
          {item.form && <span className="t-caption">{item.form}</span>}
        </div>
        <Icon name="prescriptions" size={16} className="t-muted" />
      </div>

      <dl className="rx-grid">
        <div>
          <dt className="deflist__label">Dose</dt>
          <dd className="deflist__value">{orDash(item.dosage)}</dd>
        </div>
        <div>
          <dt className="deflist__label">Frequency</dt>
          <dd className="deflist__value">
            {optionLabel(DOSAGE_FREQUENCIES, item.frequency)}
          </dd>
        </div>
        <div>
          <dt className="deflist__label">Route</dt>
          <dd className="deflist__value">{optionLabel(DOSAGE_ROUTES, item.route)}</dd>
        </div>
        <div>
          <dt className="deflist__label">Duration</dt>
          <dd className="deflist__value">
            {item.durationDays ? `${item.durationDays} days` : "—"}
          </dd>
        </div>
      </dl>

      {item.instructions && (
        <p className="t-caption" style={{ marginTop: "var(--s-xs)" }}>
          <span className="t-label t-label--sm">Instructions · </span>
          {item.instructions}
        </p>
      )}
    </li>
  );
}

/** PrescriptionCard — prescription summary with its medication list. */
function PrescriptionCard({
  prescription,
  patient,
  doctor,
  showItems = true,
  actions,
  className,
}) {
  return (
    <article className={cx("card", className)}>
      <header className="card__head">
        <div className="card__head-text">
          <h3 className="card__title t-tabular">{prescription.code}</h3>
          <p className="card__subtitle">
            Issued {formatDate(prescription.issuedAt)} · valid to{" "}
            {formatDate(prescription.validUntil)}
          </p>
        </div>
        <StatusBadge kind="prescription" value={prescription.status} />
      </header>

      <div className="card__body col col--gap-md">
        <div className="meta">
          {patient && (
            <span className="meta__item">
              <Icon name="patients" size={13} />
              <Link to={`/patients/${patient.id}`} className="t-strong">
                {patient.name}
              </Link>
            </span>
          )}
          {patient && doctor && <span className="meta__sep" aria-hidden="true" />}
          {doctor && (
            <span className="meta__item">
              <Icon name="doctors" size={13} />
              <Link to={`/doctors/${doctor.id}`} className="t-strong">
                {doctor.name}
              </Link>
            </span>
          )}
          <span className="meta__sep" aria-hidden="true" />
          <span className="meta__item">
            <Icon name="prescriptions" size={13} />
            {prescription.items.length}{" "}
            {prescription.items.length === 1 ? "medication" : "medications"}
          </span>
        </div>

        {showItems && (
          <ul className="col col--gap-xs">
            {prescription.items.map((item, index) => (
              <RxItem key={item.id} item={item} index={index} />
            ))}
          </ul>
        )}

        {prescription.notes && (
          <div className="banner banner--accent">
            <span className="banner__icon" aria-hidden="true">
              <Icon name="info" size={16} />
            </span>
            <div>
              <span className="banner__title">Prescriber note</span>
              <div>{prescription.notes}</div>
            </div>
          </div>
        )}
      </div>

      <footer className="card__foot">
        <Link
          to={`/prescriptions/${prescription.id}`}
          className="text-link text-link--sm"
        >
          Open prescription
          <Icon name="arrowRight" size={13} />
        </Link>
        {actions && <div className="row row--tight">{actions}</div>}
      </footer>
    </article>
  );
}

export default PrescriptionCard;
