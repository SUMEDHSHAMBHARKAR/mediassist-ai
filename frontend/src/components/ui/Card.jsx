import { Link } from "react-router-dom";

import cx from "../../utils/classNames";

/**
 * Card — the system's flat surface. No shadow; depth comes from the surface
 * step plus a 1px hairline.
 *
 * `surface` picks the elevation step: soft | card | elevated | inset | flat.
 * `stripe` adds the 4px signal stripe for clinically significant cards.
 */
function Card({
  children,
  surface = "card",
  stripe = false,
  tone,
  to,
  className,
  ...rest
}) {
  const classes = cx(
    "card",
    surface !== "card" && `card--${surface}`,
    tone && `card--${tone}`,
    to && "card--link",
    className,
  );

  const content = (
    <>
      {stripe && <div className="card__stripe" aria-hidden="true" />}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <section className={classes} {...rest}>
      {content}
    </section>
  );
}

/** Card header: title block on the left, actions on the right. */
export function CardHead({ title, subtitle, actions, icon, children, className }) {
  return (
    <header className={cx("card__head", className)}>
      {children || (
        <>
          <div className="card__head-text">
            <h2 className="card__title">{title}</h2>
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
          {(actions || icon) && (
            <div className="row row--tight">
              {actions}
              {icon}
            </div>
          )}
        </>
      )}
    </header>
  );
}

export function CardBody({ children, padding = "md", className }) {
  return (
    <div
      className={cx(
        "card__body",
        padding === "tight" && "card__body--tight",
        padding === "none" && "card__body--flush",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardFoot({ children, split = false, className }) {
  return (
    <footer className={cx("card__foot", split && "card__foot--split", className)}>
      {children}
    </footer>
  );
}

export default Card;
