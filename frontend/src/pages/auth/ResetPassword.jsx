import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import Banner, { Progress } from "../../components/ui/Banner";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import Input from "../../components/ui/Input";
import authService from "../../services/authService";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import AuthLayout from "../../layouts/AuthLayout";

/** Simple strength read-out. Four independent checks, no external library. */
function strengthOf(password) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];

  const score = checks.filter(Boolean).length;
  const meta = [
    { label: "Too short", tone: "critical" },
    { label: "Weak", tone: "critical" },
    { label: "Fair", tone: "warning" },
    { label: "Strong", tone: "success" },
    { label: "Very strong", tone: "success" },
  ][score];

  return { score, percent: (score / 4) * 100, ...meta };
}

/**
 * ResetPassword — set a new password against a reset token.
 * The token arrives as a query parameter; its absence is surfaced, not hidden.
 */
function ResetPassword() {
  useDocumentTitle("Set new password");

  const [params] = useSearchParams();
  const token = params.get("token");

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [status, setStatus] = useState("idle");
  const [touched, setTouched] = useState(false);

  const strength = strengthOf(form.password);
  const mismatch = touched && form.confirm !== form.password;
  const tooWeak = touched && strength.score < 2;

  const submit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (strength.score < 2 || form.confirm !== form.password) return;

    setStatus("saving");

    try {
      await authService.resetPassword(token);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  return (
    <AuthLayout
      headline="Set a new password."
      lede="Choose a password you do not use elsewhere. Existing sessions on other devices will be signed out."
    >
      {status === "done" ? (
        <div className="col col--gap-md">
          <span className="state__icon" aria-hidden="true" style={{ margin: 0 }}>
            <Icon name="checkCircle" size={22} />
          </span>
          <h2 className="t-display-sm">Password updated</h2>
          <p className="t-body-sm">
            Your password has been changed. Sign in with your new credentials.
          </p>
          <Button variant="primary" to="/login" block iconEnd="arrowRight">
            Go to sign in
          </Button>
        </div>
      ) : (
        <>
          <header className="auth__form-head">
            <span className="t-label t-label--sm">Account recovery</span>
            <h2 className="t-display-sm" style={{ marginTop: "var(--s-xs)" }}>
              New password
            </h2>
          </header>

          {!token && (
            <Banner tone="warning" title="No reset token" className="stack">
              This screen normally opens from an emailed link carrying a token.
              You are viewing it directly, so nothing will be saved.
            </Banner>
          )}

          <form onSubmit={submit} noValidate style={{ marginTop: "var(--s-md)" }}>
            <div className="col col--gap-md">
              <div className="col col--gap-xs">
                <Input
                  label="New password"
                  type="password"
                  icon="lock"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={(event) =>
                    setForm({ ...form, password: event.target.value })
                  }
                  error={tooWeak ? "Choose a stronger password." : null}
                  required
                />

                {form.password && (
                  <>
                    <Progress value={strength.percent} tone={strength.tone} label="Password strength" />
                    <span className="t-caption">
                      Strength: <span className="t-ink">{strength.label}</span> · mix
                      upper case, numbers and symbols
                    </span>
                  </>
                )}
              </div>

              <Input
                label="Confirm new password"
                type="password"
                icon="lock"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={form.confirm}
                onChange={(event) => setForm({ ...form, confirm: event.target.value })}
                error={mismatch ? "Passwords do not match." : null}
                required
              />

              {status === "error" && (
                <Banner tone="critical" title="Could not update password">
                  The reset link may have expired. Request a new one.
                </Banner>
              )}

              <Button
                type="submit"
                variant="primary"
                block
                loading={status === "saving"}
              >
                {status === "saving" ? "Saving" : "Update password"}
              </Button>
            </div>
          </form>

          <footer className="auth__foot">
            <Link className="text-link text-link--sm" to="/forgot-password">
              Request a new link
            </Link>
          </footer>
        </>
      )}
    </AuthLayout>
  );
}

export default ResetPassword;
