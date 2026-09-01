import { ROLES } from "../../constants/roles";
import { useAuth } from "../../context/AuthContext";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import AdminDashboard from "./AdminDashboard";
import DoctorDashboard from "./DoctorDashboard";
import PatientDashboard from "./PatientDashboard";

/**
 * Dashboard — routes /dashboard to the view for the signed-in role.
 *
 * The three dashboards are separate components rather than one component with
 * branches, because they answer genuinely different questions and share only
 * their primitives.
 */
function Dashboard() {
  const { user, role } = useAuth();

  useDocumentTitle("Dashboard");

  if (role === ROLES.PATIENT) return <PatientDashboard user={user} />;
  if (role === ROLES.ADMIN) return <AdminDashboard user={user} />;

  return <DoctorDashboard user={user} />;
}

export default Dashboard;
