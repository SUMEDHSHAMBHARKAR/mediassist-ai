/** Clinical departments — mirrors the backend's doctors_by_department grouping. */
export const DEPARTMENTS = [
  { value: "cardiology", label: "Cardiology", icon: "heart" },
  { value: "neurology", label: "Neurology", icon: "activity" },
  { value: "orthopaedics", label: "Orthopaedics", icon: "layers" },
  { value: "paediatrics", label: "Paediatrics", icon: "patients" },
  { value: "oncology", label: "Oncology", icon: "target" },
  { value: "radiology", label: "Radiology", icon: "image" },
  { value: "general_medicine", label: "General Medicine", icon: "doctors" },
  { value: "dermatology", label: "Dermatology", icon: "droplet" },
  { value: "endocrinology", label: "Endocrinology", icon: "thermometer" },
  { value: "pulmonology", label: "Pulmonology", icon: "pulse" },
  { value: "emergency", label: "Emergency", icon: "zap" },
];

export const DEPARTMENT_LABELS = DEPARTMENTS.reduce((acc, dept) => {
  acc[dept.value] = dept.label;
  return acc;
}, {});

export function departmentLabel(value) {
  return DEPARTMENT_LABELS[value] || "General Medicine";
}

export const DEPARTMENT_OPTIONS = DEPARTMENTS.map(({ value, label }) => ({
  value,
  label,
}));
