import cx from "../../utils/classNames";
import Avatar from "../ui/Avatar";

/**
 * RecordHeader — shared header band for detail pages (patient, clinician,
 * invoice, record).
 *
 * A large uppercase display name, a badge cluster, page actions and a strip of
 * key facts. Using one header everywhere is what makes the detail pages read as
 * the same product rather than seven separate screens.
 *
 * facts: [{ label, value }]
 */
function RecordHeader({
  name,
  eyebrow,
  badges,
  meta,
  actions,
  facts = [],
  avatarStatus,
  square = true,
  className,
}) {
  return (
    <header className={cx("record-head", className)}>
      <div className="record-head__main">
        <div className="record-head__identity">
          <Avatar
            name={name}
            size="xl"
            square={square}
            accent
            status={avatarStatus}
          />

          <div className="col col--gap-xs" style={{ minWidth: 0 }}>
            {eyebrow && <span className="t-label t-label--sm">{eyebrow}</span>}
            <h1 className="record-head__name">{name}</h1>

            {badges && <div className="row row--tight row--wrap">{badges}</div>}
            {meta}
          </div>
        </div>

        {actions && <div className="record-head__actions">{actions}</div>}
      </div>

      {facts.length > 0 && (
        <dl className="record-head__facts">
          {facts.map((fact) => (
            <div className="record-head__fact" key={fact.label}>
              <dt className="record-head__fact-label">{fact.label}</dt>
              <dd className="record-head__fact-value">{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}

export default RecordHeader;
