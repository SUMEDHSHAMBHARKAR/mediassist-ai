import { useState } from "react";
import { Link } from "react-router-dom";

import Banner from "../../components/ui/Banner";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import Input from "../../components/ui/Input";
import authService from "../../services/authService";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import AuthLayout from "../../layouts/AuthLayout";

/**
 * ForgotPassword — reset request.
 *
 * Two states: the form, and a confirmation panel. The confirmation deliberately
 * does not reveal whether the address exists.
 */
function ForgotPassword() {
  useDocumentTitle("Reset password");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [touched, setTouched] = useState(false);

  const invalid = touched && !email.includes("@");

  const submit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (!email.includes("@")) return;

    setStatus("sending");

    try {
      await authService.requestPasswordReset(email);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <AuthLayout
      headline="Regain access securely."
      lede="Reset links are single-use, expire in 30 minutes and are recorded in the audit trail."
    >
      {status === "sent" ? (
        <div className="col col--gap-md">
          <span className="state__icon" aria-hidden="true" style={{ margin: 0 }}>
            <Icon name="mail" size={22} />
          </span>

          <h2 className="t-display-sm">Check your inbox</h2>
          <p className="t-body-sm">
            If an account exists for <span className="t-ink">{email}</span>, a reset
            link is on its way. The link expires in 30 minutes.
          </p>

          <Banner tone="accent" icon="info">
            Email delivery is not connected in this preview. Open the reset screen
            directly to review it.
          </Banner>

          <div className="col col--gap-xs">
            <Button variant="primary" to="/reset-password" block iconEnd="arrowRight">
              Open reset screen
            </Button>
            <Button variant="ghost" to="/login" block icon="arrowLeft">
              Back to sign in
            </Button>
          </div>
        </div>
      ) : (
        <>
          <header className="auth__form-head">
            <span className="t-label t-label--sm">Account recovery</span>
            <h2 className="t-display-sm" style={{ marginTop: "var(--s-xs)" }}>
              Reset password
            </h2>
            <p className="t-body-sm" style={{ marginTop: "var(--s-xs)" }}>
              Enter the email registered to your account and we will send a reset
              link.
            </p>
          </header>

          <form onSubmit={submit} noValidate>
            <div className="col col--gap-md">
              <Input
                label="Registered email"
                type="email"
                icon="mail"
                autoComplete="username"
                placeholder="name@mediassist.health"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={invalid ? "Enter a valid email address." : null}
                required
              />

              {status === "error" && (
                <Banner tone="critical" title="Request failed">
                  The reset request could not be sent. Try again in a moment.
                </Banner>
              )}

              <Button
                type="submit"
                variant="primary"
                block
                loading={status === "sending"}
                iconEnd="arrowRight"
              >
                {status === "sending" ? "Sending link" : "Send reset link"}
              </Button>
            </div>
          </form>

          <footer className="auth__foot">
            <Link className="text-link text-link--sm" to="/login">
              Back to sign in
            </Link>
          </footer>
        </>
      )}
    </AuthLayout>
  );
}

export default ForgotPassword;
