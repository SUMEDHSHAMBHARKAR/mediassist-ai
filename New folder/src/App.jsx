import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { LoadingState } from "./components/ui/States";
import MainLayout from "./layouts/MainLayout";

/**
 * Routing.
 *
 * Auth and the dashboard load eagerly because one of them is always the first
 * screen. Every other area is code-split per route: this keeps the initial bundle
 * small and means a large area like the AI workspace costs nothing until it is
 * opened.
 */
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";

const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));

const Patients = lazy(() => import("./pages/patients/Patients"));
const PatientDetail = lazy(() => import("./pages/patients/PatientDetail"));

const Doctors = lazy(() => import("./pages/doctors/Doctors"));
const DoctorDetail = lazy(() => import("./pages/doctors/DoctorDetail"));

const Appointments = lazy(() => import("./pages/appointments/Appointments"));
const BookAppointment = lazy(() => import("./pages/appointments/BookAppointment"));
const AppointmentDetail = lazy(() => import("./pages/appointments/AppointmentDetail"));

const MedicalRecords = lazy(() => import("./pages/medical-records/MedicalRecords"));
const MedicalRecordDetail = lazy(
  () => import("./pages/medical-records/MedicalRecordDetail"),
);

const Reports = lazy(() => import("./pages/reports/Reports"));
const ReportDetail = lazy(() => import("./pages/reports/ReportDetail"));

const Prescriptions = lazy(() => import("./pages/prescriptions/Prescriptions"));
const CreatePrescription = lazy(
  () => import("./pages/prescriptions/CreatePrescription"),
);
const PrescriptionDetail = lazy(
  () => import("./pages/prescriptions/PrescriptionDetail"),
);

const Billing = lazy(() => import("./pages/billing/Billing"));
const InvoiceDetail = lazy(() => import("./pages/billing/InvoiceDetail"));

const Notifications = lazy(() => import("./pages/notifications/Notifications"));
const Settings = lazy(() => import("./pages/settings/Settings"));
const Admin = lazy(() => import("./pages/admin/Admin"));

const AIAssistant = lazy(() => import("./pages/ai/AIAssistant"));
const ReportAnalysis = lazy(() => import("./pages/ai/ReportAnalysis"));
const AIUsage = lazy(() => import("./pages/ai/AIUsage"));

const NotFound = lazy(() => import("./pages/NotFound"));

/** Shown only while a route chunk is in flight. */
function RouteFallback() {
  return (
    <div className="page">
      <LoadingState label="Loading" />
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Unauthenticated surface — no application shell. */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Application shell. */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:id" element={<PatientDetail />} />

          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctors/:id" element={<DoctorDetail />} />

          <Route path="/appointments" element={<Appointments />} />
          <Route path="/appointments/book" element={<BookAppointment />} />
          <Route path="/appointments/:id" element={<AppointmentDetail />} />

          <Route path="/medical-records" element={<MedicalRecords />} />
          <Route path="/medical-records/new" element={<MedicalRecords />} />
          <Route path="/medical-records/:id" element={<MedicalRecordDetail />} />

          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/:id" element={<ReportDetail />} />

          <Route path="/prescriptions" element={<Prescriptions />} />
          <Route path="/prescriptions/new" element={<CreatePrescription />} />
          <Route path="/prescriptions/:id" element={<PrescriptionDetail />} />

          <Route path="/billing" element={<Billing />} />
          <Route path="/billing/:id" element={<InvoiceDetail />} />

          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<Admin />} />

          <Route path="/ai" element={<AIAssistant />} />
          <Route path="/ai/analysis" element={<ReportAnalysis />} />
          <Route path="/ai/usage" element={<AIUsage />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
