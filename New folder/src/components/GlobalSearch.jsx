import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { departmentLabel } from "../constants/departments";
import { navigationFlat } from "../constants/navigation";
import { ROLES } from "../constants/roles";
import { useAuth } from "../context/AuthContext";
import useAsyncData from "../hooks/useAsyncData";
import useDebounce from "../hooks/useDebounce";
import doctorsService from "../services/doctorsService";
import patientsService from "../services/patientsService";
import { searchBy } from "../utils/collection";
import Icon from "./ui/Icon";
import SearchInput from "./ui/SearchInput";

/**
 * GlobalSearch — navbar quick-find across patients, clinicians and destinations.
 *
 * The directory is loaded once through the services and filtered locally so
 * keystrokes stay instant. When the backend takes over, the loader becomes a
 * debounced search request and the rendering below is unchanged.
 */
function GlobalSearch() {
  const { role } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const term = useDebounce(query, 150);
  const canSeePatients = role === ROLES.DOCTOR || role === ROLES.ADMIN;

  const { data: patients } = useAsyncData(() => patientsService.list(), [], {
    enabled: canSeePatients,
    initialData: [],
  });
  const { data: doctors } = useAsyncData(() => doctorsService.list(), [], {
    initialData: [],
  });

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const trimmed = term.trim();

  const patientHits = trimmed
    ? searchBy(patients || [], trimmed, ["name", "mrn", "phone"]).slice(0, 4)
    : [];
  const doctorHits = trimmed
    ? searchBy(doctors || [], trimmed, ["name", "specialisation", "department"]).slice(0, 3)
    : [];
  const pageHits = trimmed
    ? navigationFlat(role).filter((item) =>
        item.label.toLowerCase().includes(trimmed.toLowerCase()),
      )
    : [];

  const hasResults =
    patientHits.length > 0 || doctorHits.length > 0 || pageHits.length > 0;

  const go = (to) => {
    setOpen(false);
    setQuery("");
    navigate(to);
  };

  return (
    <div className="dropdown navbar__search" ref={rootRef} style={{ display: "block" }}>
      <SearchInput
        value={query}
        onChange={(value) => {
          setQuery(value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search patients, clinicians, pages"
        label="Global search"
        size="sm"
      />

      {open && trimmed.length > 0 && (
        <div className="dropdown__panel dropdown__panel--left" style={{ minWidth: "100%" }}>
          {!hasResults ? (
            <p className="t-caption" style={{ padding: "var(--s-sm) var(--s-md)" }}>
              No matches for “{trimmed}”.
            </p>
          ) : (
            <>
              {patientHits.length > 0 && (
                <>
                  <span className="dropdown__label">Patients</span>
                  {patientHits.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      className="dropdown__item"
                      onClick={() => go(`/patients/${patient.id}`)}
                    >
                      <Icon name="patients" size={15} />
                      <span className="grow t-truncate">{patient.name}</span>
                      <span className="t-caption">{patient.mrn}</span>
                    </button>
                  ))}
                </>
              )}

              {doctorHits.length > 0 && (
                <>
                  <span className="dropdown__label">Clinicians</span>
                  {doctorHits.map((doctor) => (
                    <button
                      key={doctor.id}
                      type="button"
                      className="dropdown__item"
                      onClick={() => go(`/doctors/${doctor.id}`)}
                    >
                      <Icon name="doctors" size={15} />
                      <span className="grow t-truncate">{doctor.name}</span>
                      <span className="t-caption t-nowrap">
                        {departmentLabel(doctor.department)}
                      </span>
                    </button>
                  ))}
                </>
              )}

              {pageHits.length > 0 && (
                <>
                  <span className="dropdown__label">Go to</span>
                  {pageHits.map((page) => (
                    <button
                      key={page.to}
                      type="button"
                      className="dropdown__item"
                      onClick={() => go(page.to)}
                    >
                      <Icon name={page.icon} size={15} />
                      <span className="grow t-truncate">{page.label}</span>
                      <Icon name="arrowRight" size={13} />
                    </button>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
