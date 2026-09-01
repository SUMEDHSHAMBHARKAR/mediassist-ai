import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Banner from "../../components/ui/Banner";
import Button from "../../components/ui/Button";
import { Checkbox } from "../../components/ui/Checkbox";
import Icon from "../../components/ui/Icon";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { DEPARTMENT_OPTIONS } from "../../constants/departments";
import { ROLES, ROLE_ICONS, ROLE_LABELS } from "../../constants/roles";
import { useAuth } from "../../context/AuthContext";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import AuthLayout from "../../layouts/AuthLayout";
import cx from "../../utils/classNames";

const PROOF = [
  { label: "Departments", value: "11" },
  { label: "Avg. onboarding", value: "2 days" },
  { label: "Audited", value: "100%" },
];

/**
 * Register — access request form.
 *
 * Only patient and clinician self-registration is offered; administrator
 * accounts are provisioned internally, which is why that role is not selectable.
 */
function Register() {
  useDocumentTitle("Request access");

  const { register, pending, error } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState(ROLES.PATIENT);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    registration: "",
    password: "",
    confirm: "",
  });
  const [accepted, setAccepted] = useState(false);
  const [touched, setTouched] = useState(false);

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const errors = {
    name: touched && !form.name.trim() ? "Enter your full name." : null,
    email: touched && !form.email.includes("@") ? "Enter a valid email address." : null,
    password:
      touched && form.password.length < 8
        ? "Use at least 8 characters."
        : null,
    confirm:
      touched && form.confirm !== form.password ? "Passwords do not match." : null,
    department:
      touched && role === ROLES.DOCTOR && !form.department
        ? "Select your department."
        : null,
  };

  const isValid =
    form.name.trim() &&
    form.email.includes("@") &&
    form.password.length >= 8 &&
    form.confirm === form.password &&
    accepted &&
    (role !== ROLES.DOCTOR || form.department);

  const submit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (!isValid) return;

    try {
      await register({ ...form, role });
      navigate("/dashboard", { replace: true });
    } catch {
      // Rendered from the context error below.
    }
  };

  return (
    <AuthLayout
      headline="Join the care team."
      lede="Request an account and an administrator will verify your credentials before access is granted."
      proof={PROOF}
    >
      <header className="auth__form-head">
        <span className="t-label t-label--sm">Request access</span>
        <h2 className="t-display-sm" style={{ marginTop: "var(--s-xs)" }}>
          Create account
        </h2>
        <p className="t-body-sm" style={{ marginTop: "var(--s-xs)" }}>
          Administrator accounts are provisioned internally and cannot be
          requested here.
        </p>
      </header>

      <form onSubmit={submit} noValidate>
        <div className="col col--gap-md">
          <fieldset>
            <legend className="field__label" style={{ marginBottom: "var(--s-xs)" }}>
              I am a
            </legend>

            <div className="role-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              {[ROLES.PATIENT, ROLES.DOCTOR].map((value) => (
                <button
                  type="button"
                  key={value}
                  className={cx("role-opt", role === value && "is-active")}
                  onClick={() => setRole(value)}
                  aria-pressed={role === value}
                >
                  <Icon name={ROLE_ICONS[value]} size={18} />
                  {ROLE_LABELS[value]}
                </button>
              ))}
            </div>
          </fieldset>

          <Input
            label="Full name"
            icon="user"
            autoComplete="name"
            placeholder={role === ROLES.DOCTOR ? "Dr. Priya Nair" : "Aarav Sharma"}
            value={form.name}
            onChange={set("name")}
            error={errors.name}
            required
          />

          <Input
            label="Email"
            type="email"
            icon="mail"
            autoComplete="email"
            placeholder="name@example.com"
            value={form.email}
            onChange={set("email")}
            error={errors.email}
            required
          />

          <Input
            label="Mobile number"
            type="tel"
            icon="phone"
            autoComplete="tel"
            placeholder="+91 98200 00000"
            value={form.phone}
            onChange={set("phone")}
          />

          {role === ROLES.DOCTOR && (
            <div className="grid grid--2 grid--tight">
              <Select
                label="Department"
                options={DEPARTMENT_OPTIONS}
                placeholder="Select department"
                value={form.department}
                onChange={set("department")}
                error={errors.department}
                required
              />
              <Input
                label="Medical registration no."
                icon="shieldCheck"
                placeholder="KMC/12345/2018"
                value={form.registration}
                onChange={set("registration")}
                hint="Verified before activation"
              />
            </div>
          )}

          <Input
            label="Password"
            type="password"
            icon="lock"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={set("password")}
            error={errors.password}
            required
          />

          <Input
            label="Confirm password"
            type="password"
            icon="lock"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={form.confirm}
            onChange={set("confirm")}
            error={errors.confirm}
            required
          />

          <Checkbox
            label="I confirm the information above is accurate and I accept the clinical data handling policy."
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
          />

          {touched && !accepted && (
            <span className="field__error" role="alert">
              <Icon name="alertCircle" size={13} />
              You must accept the data handling policy to continue.
            </span>
          )}

          {error && (
            <Banner tone="critical" title="Registration failed">
              {error.message}
            </Banner>
          )}

          <Button type="submit" variant="primary" block loading={pending} iconEnd="arrowRight">
            {pending ? "Submitting" : "Request access"}
          </Button>
        </div>
      </form>

      <footer className="auth__foot">
        Already have an account?{" "}
        <Link className="text-link text-link--sm" to="/login">
          Sign in
        </Link>
      </footer>
    </AuthLayout>
  );
}

export default Register;
