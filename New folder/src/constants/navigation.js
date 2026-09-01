import { ROLES } from "./roles";

/**
 * Sidebar navigation, grouped and filtered by role.
 *
 * `roles` omitted means the item is visible to everyone. Keeping this as data
 * means the Sidebar component contains no role logic.
 */
const NAV_GROUPS = [
  {
    id: "overview",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
      { to: "/ai", label: "AI Assistant", icon: "ai" },
    ],
  },
  {
    id: "care",
    label: "Care",
    items: [
      {
        to: "/patients",
        label: "Patients",
        icon: "patients",
        roles: [ROLES.DOCTOR, ROLES.ADMIN],
      },
      { to: "/doctors", label: "Clinicians", icon: "doctors" },
      { to: "/appointments", label: "Appointments", icon: "appointments" },
    ],
  },
  {
    id: "clinical",
    label: "Clinical",
    items: [
      { to: "/medical-records", label: "Medical Records", icon: "records" },
      { to: "/reports", label: "Reports", icon: "reports" },
      { to: "/prescriptions", label: "Prescriptions", icon: "prescriptions" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      { to: "/billing", label: "Billing", icon: "billing" },
      { to: "/notifications", label: "Notifications", icon: "notifications" },
      {
        to: "/admin",
        label: "Administration",
        icon: "admin",
        roles: [ROLES.ADMIN],
      },
    ],
  },
];

/** Returns only the groups and items the given role may see. */
export function navigationForRole(role) {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || item.roles.includes(role)),
  })).filter((group) => group.items.length > 0);
}

/** Flat list used by the global command/search surface. */
export function navigationFlat(role) {
  return navigationForRole(role).flatMap((group) => group.items);
}

export default NAV_GROUPS;
