import { useState } from "react";

import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Banner from "../../components/ui/Banner";
import Button from "../../components/ui/Button";
import Card, { CardBody, CardFoot, CardHead } from "../../components/ui/Card";
import DefList from "../../components/ui/DefList";
import Icon from "../../components/ui/Icon";
import Input from "../../components/ui/Input";
import PageHeader from "../../components/ui/PageHeader";
import Select from "../../components/ui/Select";
import Tabs from "../../components/ui/Tabs";
import Textarea from "../../components/ui/Textarea";
import { Switch } from "../../components/ui/Checkbox";
import { ROLE_LABELS } from "../../constants/roles";
import { useAuth } from "../../context/AuthContext";
import useDocumentTitle from "../../hooks/useDocumentTitle";

const NOTIFICATION_PREFS = [
  {
    id: "critical",
    label: "Critical clinical alerts",
    detail: "Out-of-range results and urgent flags. Cannot be disabled.",
    locked: true,
  },
  {
    id: "appointments",
    label: "Appointment changes",
    detail: "Bookings, reschedules and cancellations.",
  },
  {
    id: "results",
    label: "New results",
    detail: "Laboratory results and imaging as they become available.",
  },
  {
    id: "billing",
    label: "Billing events",
    detail: "Invoices raised, payments received, claims settled.",
  },
  {
    id: "ai",
    label: "AI completions",
    detail: "Report analyses and long-running AI tasks.",
  },
  {
    id: "digest",
    label: "Daily digest email",
    detail: "One summary each morning instead of individual emails.",
  },
];

/**
 * Settings — profile and preferences.
 *
 * Preference toggles are local state only. There is no settings endpoint in the
 * documented backend, so nothing here claims to persist.
 */
function Settings() {
  useDocumentTitle("Settings");

  const { user, role } = useAuth();

  const [tab, setTab] = useState("profile");
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    bio: "",
    language: "en-GB",
    timezone: "Asia/Kolkata",
  });
  const [prefs, setPrefs] = useState({
    critical: true,
    appointments: true,
    results: true,
    billing: false,
    ai: true,
    digest: false,
  });
  const [density, setDensity] = useState("comfortable");

  if (!user) return null;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        lede="Your profile, notification preferences and workspace options."
      />

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "profile", label: "Profile" },
          { value: "notifications", label: "Notifications" },
          { value: "security", label: "Security" },
          { value: "workspace", label: "Workspace" },
        ]}
        className="stack"
      />

      <div style={{ marginTop: "var(--s-lg)" }}>
        {tab === "profile" && (
          <div className="grid grid--split">
            <Card surface="soft">
              <CardHead title="Profile" subtitle="How you appear to the care team" />
              <CardBody>
                <div className="col col--gap-md">
                  <div className="row row--loose">
                    <Avatar name={profile.name} size="xl" square accent />
                    <div className="col col--gap-xs">
                      <span className="t-title-sm t-ink">{profile.name}</span>
                      <Badge tone="accent">{ROLE_LABELS[role]}</Badge>
                      <Button size="sm" variant="outline" icon="image">
                        Change photo
                      </Button>
                    </div>
                  </div>

                  <div className="card__divider" />

                  <Input
                    label="Full name"
                    icon="user"
                    value={profile.name}
                    onChange={(event) =>
                      setProfile({ ...profile, name: event.target.value })
                    }
                  />

                  <div className="grid grid--2 grid--tight">
                    <Input
                      label="Email"
                      type="email"
                      icon="mail"
                      value={profile.email}
                      onChange={(event) =>
                        setProfile({ ...profile, email: event.target.value })
                      }
                    />
                    <Input
                      label="Phone"
                      type="tel"
                      icon="phone"
                      placeholder="+91 98450 00000"
                      value={profile.phone}
                      onChange={(event) =>
                        setProfile({ ...profile, phone: event.target.value })
                      }
                    />
                  </div>

                  <Textarea
                    label="Short bio"
                    rows={3}
                    placeholder="Shown on your profile to colleagues and patients"
                    value={profile.bio}
                    onChange={(event) =>
                      setProfile({ ...profile, bio: event.target.value })
                    }
                  />

                  <div className="grid grid--2 grid--tight">
                    <Select
                      label="Language"
                      options={[
                        { value: "en-GB", label: "English (UK)" },
                        { value: "en-IN", label: "English (India)" },
                        { value: "hi-IN", label: "Hindi" },
                      ]}
                      value={profile.language}
                      onChange={(event) =>
                        setProfile({ ...profile, language: event.target.value })
                      }
                    />
                    <Select
                      label="Time zone"
                      options={[
                        { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
                        { value: "Europe/London", label: "Europe/London" },
                        { value: "UTC", label: "UTC" },
                      ]}
                      value={profile.timezone}
                      onChange={(event) =>
                        setProfile({ ...profile, timezone: event.target.value })
                      }
                    />
                  </div>
                </div>
              </CardBody>
              <CardFoot split>
                <span className="t-caption">
                  Changes are not saved — no profile endpoint is connected.
                </span>
                <Button variant="primary" icon="check" disabled>
                  Save changes
                </Button>
              </CardFoot>
            </Card>

            <div className="col col--gap-lg">
              <Card surface="soft">
                <CardHead title="Account" />
                <CardBody>
                  <DefList
                    columns={1}
                    items={[
                      { label: "Account ID", value: user.id },
                      { label: "Role", value: ROLE_LABELS[role] },
                      { label: "Email", value: user.email },
                      {
                        label: "Linked record",
                        value: user.doctorId || user.patientId || "—",
                      },
                    ]}
                  />
                </CardBody>
              </Card>

              <Banner tone="accent" icon="info">
                Profile editing, avatar upload and preferences all need backend
                endpoints that are not part of the documented API yet.
              </Banner>
            </div>
          </div>
        )}

        {tab === "notifications" && (
          <Card surface="soft">
            <CardHead
              title="Notification preferences"
              subtitle="Choose what reaches you and how"
            />
            <CardBody padding="none">
              <div className="list">
                {NOTIFICATION_PREFS.map((pref) => (
                  <div className="list__row" key={pref.id}>
                    <div className="grow col col--gap-xxs">
                      <span className="row row--tight">
                        <span className="t-data t-ink">{pref.label}</span>
                        {pref.locked && <Badge tone="muted" icon="lock">Required</Badge>}
                      </span>
                      <span className="t-caption">{pref.detail}</span>
                    </div>

                    <Switch
                      checked={prefs[pref.id]}
                      disabled={pref.locked}
                      onChange={(event) =>
                        setPrefs({ ...prefs, [pref.id]: event.target.checked })
                      }
                    />
                  </div>
                ))}
              </div>
            </CardBody>
            <CardFoot split>
              <span className="t-caption row row--tight">
                <Icon name="info" size={13} />
                Critical clinical alerts cannot be switched off
              </span>
              <Button variant="primary" icon="check" disabled>
                Save preferences
              </Button>
            </CardFoot>
          </Card>
        )}

        {tab === "security" && (
          <div className="grid grid--split">
            <Card surface="soft">
              <CardHead title="Password" subtitle="Change your sign-in password" />
              <CardBody>
                <div className="col col--gap-md">
                  <Input label="Current password" type="password" icon="lock" />
                  <Input
                    label="New password"
                    type="password"
                    icon="lock"
                    hint="At least 8 characters with a number and a symbol"
                  />
                  <Input label="Confirm new password" type="password" icon="lock" />
                </div>
              </CardBody>
              <CardFoot split>
                <span className="t-caption">Not connected to /auth yet.</span>
                <Button variant="primary" disabled>
                  Update password
                </Button>
              </CardFoot>
            </Card>

            <div className="col col--gap-lg">
              <Card surface="soft">
                <CardHead title="Two-factor authentication" />
                <CardBody>
                  <div className="col col--gap-md">
                    <p className="t-body-sm">
                      Adds a one-time code to sign-in. Strongly recommended for any
                      account with access to clinical records.
                    </p>
                    <Banner tone="warning" icon="alertTriangle">
                      Two-factor authentication is not enforced in this preview
                      because authentication itself is not connected.
                    </Banner>
                    <Button variant="outline" icon="shieldCheck" disabled>
                      Set up two-factor
                    </Button>
                  </div>
                </CardBody>
              </Card>

              <Card surface="soft">
                <CardHead title="Active sessions" />
                <CardBody>
                  <EmptySessionNote />
                </CardBody>
              </Card>
            </div>
          </div>
        )}

        {tab === "workspace" && (
          <div className="grid grid--split">
            <Card surface="soft">
              <CardHead title="Appearance" />
              <CardBody>
                <div className="col col--gap-md">
                  <div>
                    <span className="field__label">Interface</span>
                    <p className="t-body-sm" style={{ marginTop: 4 }}>
                      MediAssist uses a single dark clinical theme. It is designed for
                      long reading sessions on ward and consulting-room displays, so
                      there is no light variant.
                    </p>
                  </div>

                  <Select
                    label="Table density"
                    options={[
                      { value: "comfortable", label: "Comfortable" },
                      { value: "compact", label: "Compact" },
                    ]}
                    value={density}
                    onChange={(event) => setDensity(event.target.value)}
                    hint="Affects row height in list views"
                  />
                </div>
              </CardBody>
            </Card>

            <Card surface="soft">
              <CardHead title="Defaults" />
              <CardBody>
                <div className="col col--gap-md">
                  <Select
                    label="Landing page"
                    options={[
                      { value: "dashboard", label: "Dashboard" },
                      { value: "appointments", label: "Appointments" },
                      { value: "ai", label: "AI Assistant" },
                    ]}
                    defaultValue="dashboard"
                  />
                  <Select
                    label="Default appointment scope"
                    options={[
                      { value: "today", label: "Today" },
                      { value: "upcoming", label: "Upcoming" },
                    ]}
                    defaultValue="upcoming"
                  />
                </div>
              </CardBody>
              <CardFoot split>
                <span className="t-caption">Preferences are local to this session.</span>
                <Button variant="primary" icon="check" disabled>
                  Save
                </Button>
              </CardFoot>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

/** Session listing needs a backend endpoint; state that rather than faking rows. */
function EmptySessionNote() {
  return (
    <div className="col col--gap-sm">
      <div className="row row--loose">
        <span className="file-row__icon" aria-hidden="true">
          <Icon name="globe" size={16} />
        </span>
        <div className="grow col col--gap-xxs">
          <span className="t-data t-ink">This device</span>
          <span className="t-caption">Current session</span>
        </div>
        <Badge tone="success" dot>
          Active
        </Badge>
      </div>

      <p className="t-caption">
        Other sessions cannot be listed until the auth service exposes them.
      </p>
    </div>
  );
}

export default Settings;
