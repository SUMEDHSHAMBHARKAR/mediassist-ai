import { Link } from "react-router-dom";

/**
 * Brand — wordmark plus the vertical signal stripe.
 *
 * The design system's identity is typographic: a letterspaced uppercase
 * wordmark against the 4px stripe. No logo asset, no illustration.
 */
function Brand({ to = "/dashboard", sub = "Clinical Platform" }) {
  const content = (
    <>
      <span className="brand__stripe" aria-hidden="true" />
      <span className="brand__text">
        <span className="brand__name">MediAssist</span>
        <span className="brand__sub">{sub}</span>
      </span>
    </>
  );

  if (!to) {
    return (
      <span className="brand" aria-label="MediAssist AI">
        {content}
      </span>
    );
  }

  return (
    <Link className="brand" to={to} aria-label="MediAssist AI — go to dashboard">
      {content}
    </Link>
  );
}

export default Brand;
