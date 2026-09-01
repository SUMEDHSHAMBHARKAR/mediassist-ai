import Brand from "../components/Brand";

/**
 * AuthLayout — split canvas for the unauthenticated surface.
 *
 * This is the one place the design system's full-bleed editorial band is used at
 * full strength: a desaturated clinical photograph carries the left half while
 * the form occupies a disciplined column on the right. Below 1024px the image
 * band is dropped entirely rather than shrunk, so the form gets the full width.
 *
 * The image is a remote clinical photograph rather than a bundled asset; it is
 * decorative and the layout does not depend on it loading.
 */
const IMAGE_URL =
  "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1600&q=70";

function AuthLayout({ children, headline, lede, proof }) {
  return (
    <div className="auth">
      <aside className="auth__aside">
        <img className="auth__aside-img" src={IMAGE_URL} alt="" aria-hidden="true" />
        <div className="auth__aside-veil" aria-hidden="true" />

        <Brand to={null} sub="Clinical Platform" />

        <div>
          <div className="stripe" style={{ width: 72, marginBottom: "var(--s-lg)" }} />
          <h1 className="t-display-lg auth__headline">{headline}</h1>
          {lede && <p className="auth__lede">{lede}</p>}
        </div>

        {proof && (
          <div className="auth__proof">
            {proof.map((item) => (
              <div className="auth__proof-cell" key={item.label}>
                <span className="auth__proof-value">{item.value}</span>
                <span className="t-label t-label--sm" style={{ display: "block" }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </aside>

      <main className="auth__panel">
        <div className="auth__form">
          <div className="auth__mobile-brand">
            <Brand to={null} />
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}

export default AuthLayout;
