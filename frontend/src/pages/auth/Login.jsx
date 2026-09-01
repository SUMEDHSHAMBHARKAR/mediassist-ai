import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import AuthLayout from "../../layouts/AuthLayout";
import { useAuth } from "../../context/AuthContext";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import Banner from "../../components/ui/Banner";
import Button from "../../components/ui/Button";
import { Checkbox } from "../../components/ui/Checkbox";
import Input from "../../components/ui/Input";

const PROOF = [
  { label: "Clinicians", value: "240+" },
  { label: "Records", value: "1.2M" },
  { label: "Uptime", value: "99.9%" },
];

/**
 * Login — authenticates against the FastAPI backend. The backend determines
 * the user's role from their account rather than trusting a client-side choice.
 */
function Login() {
  useDocumentTitle("Sign in");

  const { signIn, pending, error, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={location.state?.from || "/dashboard"} replace />;
  }

  const emailError =
    touched && !form.email.trim() ? "Enter your work email address." : null;
  const passwordError =
    touched && form.password.length < 6
      ? "Passwords are at least 6 characters."
      : null;

  const submit = async (event) => {
    event.preventDefault();
    setTouched(true);

    if (!form.email.trim() || form.password.length < 6) return;

    try {
      await signIn({ identifier: form.email, password: form.password });
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch {
      // Surfaced through the context's `error`, rendered below.
    }
  };

  return (
    <AuthLayout
      headline="Clinical intelligence, one workspace."
      lede="Records, scheduling, prescribing and AI-assisted review for the whole care team — grounded in your own clinical data."
      proof={PROOF}
    >
      <header className="auth__form-head">
        <span className="t-label t-label--sm">Sign in</span>
        <h2 className="t-display-sm" style={{ marginTop: "var(--s-xs)" }}>
          Welcome back
        </h2>
        <p className="t-body-sm" style={{ marginTop: "var(--s-xs)" }}>
          Use your MediAssist credentials to continue.
        </p>
      </header>

      <form onSubmit={submit} noValidate>
        <div className="col col--gap-md">
          <Input
            label="Work email"
            type="email"
            icon="mail"
            autoComplete="username"
            placeholder="name@mediassist.health"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            error={emailError}
            required
          />

          <Input
            label="Password"
            type="password"
            icon="lock"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            error={passwordError}
            required
          />

          <div className="row row--between row--wrap">
            <Checkbox label="Keep me signed in" defaultChecked />
            <Link className="text-link text-link--sm text-link--muted" to="/forgot-password">
              Forgot password
            </Link>
          </div>

          {error && (
            <Banner tone="critical" title="Sign-in failed">
              {error.message}
            </Banner>
          )}

          <Button type="submit" variant="primary" block loading={pending} iconEnd="arrowRight">
            {pending ? "Signing in" : "Sign in"}
          </Button>

          <Banner tone="accent" icon="info">
            Your workspace is selected from the role assigned to your account.
          </Banner>
        </div>
      </form>

      <footer className="auth__foot row row--between row--wrap">
        <span>
          No account?{" "}
          <Link className="text-link text-link--sm" to="/register">
            Request access
          </Link>
        </span>
        <span className="t-caption">v0.1 · Frontend preview</span>
      </footer>
    </AuthLayout>
  );
}

export default Login;
