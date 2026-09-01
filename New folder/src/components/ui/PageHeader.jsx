import cx from "../../utils/classNames";
import Breadcrumb from "./Breadcrumb";

/**
 * PageHeader — the uppercase display title, an optional lede, and the page's
 * primary actions. Every page uses this so titles never drift in size.
 */
function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
  breadcrumb,
  size = "md",
  className,
}) {
  return (
    <>
      {breadcrumb && <Breadcrumb items={breadcrumb} />}

      <header className={cx("page-head", className)}>
        <div className="page-head__text">
          {eyebrow && (
            <span className="t-label t-label--sm page-head__eyebrow">{eyebrow}</span>
          )}
          <h1
            className={cx(
              "page-head__title",
              size === "lg" ? "t-display-md" : "t-display-sm",
            )}
          >
            {title}
          </h1>
          {lede && <p className="page-head__lede">{lede}</p>}
        </div>

        {actions && <div className="page-head__actions">{actions}</div>}
      </header>
    </>
  );
}

/**
 * SectionHead — secondary heading inside a page, marked with the signal stripe
 * so section starts are scannable without adding decoration.
 */
export function SectionHead({ title, meta, actions, stripe = true, className }) {
  return (
    <div className={cx("section__head", className)}>
      <div className="section__title">
        {stripe && <span className="stripe--mark" aria-hidden="true" />}
        <h2 className="t-title-lg">{title}</h2>
        {meta && <span className="t-caption">{meta}</span>}
      </div>
      {actions && <div className="row row--tight">{actions}</div>}
    </div>
  );
}

export default PageHeader;
