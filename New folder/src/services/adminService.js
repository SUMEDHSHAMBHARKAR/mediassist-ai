import { auditLogs, systemServices, users } from "../mock/admin";
import { resolve } from "./mockTransport";

/**
 * Admin service.
 *
 *   listUsers   -> (user administration domain)
 *   listAudit   -> (audit domain)
 *   systemHealth-> (operational status; not a documented endpoint yet)
 *
 * Only read operations are surfaced. Role and permission mutations are not
 * implemented here because the backend contract for them is not known, and
 * inventing one would put fake authorisation behaviour in the UI.
 */
export const adminService = {
  listUsers() {
    return resolve(users, { delay: 280 });
  },

  listAudit() {
    return resolve(
      [...auditLogs].sort((a, b) => new Date(b.at) - new Date(a.at)),
      { delay: 300 },
    );
  },

  systemHealth() {
    return resolve(systemServices, { delay: 240 });
  },

  setUserActive(userId, active) {
    return resolve({ id: userId, active }, { delay: 340 });
  },
};

export default adminService;
