/**
 * Icon — single inline SVG registry.
 *
 * Hand-drawn stroke geometry on a 24x24 grid so icon weight stays consistent
 * with the design system's 1px hairlines. No icon dependency is added.
 *
 * Usage: <Icon name="patients" size={18} />
 */

const PATHS = {
  /* ------------------------------------------------------------ navigation */
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </>
  ),
  patients: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  doctors: (
    <>
      <path d="M6 3v6a6 6 0 0 0 12 0V3" />
      <path d="M4 3h4M16 3h4" />
      <path d="M12 15v3a3 3 0 0 0 3 3h1" />
      <circle cx="19" cy="19" r="2" />
    </>
  ),
  appointments: (
    <>
      <rect x="3" y="4" width="18" height="17" />
      <path d="M3 9h18M8 2v4M16 2v4" />
      <path d="M8 14h3M8 17h6" />
    </>
  ),
  records: (
    <>
      <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" />
      <path d="M14 3v5h5" />
      <path d="M12 11v5M9.5 13.5h5" />
    </>
  ),
  reports: (
    <>
      <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 17v-3M12 17v-5M15 17v-2" />
    </>
  ),
  prescriptions: (
    <>
      <path d="M6 3h4a3 3 0 0 1 0 6H6V3z" />
      <path d="M6 9v12" />
      <path d="M10 9l8 12M18 9l-8 12" />
    </>
  ),
  billing: (
    <>
      <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </>
  ),
  ai: (
    <>
      <path d="M12 2.5l1.9 4.7L18.6 9l-4.7 1.8L12 15.5l-1.9-4.7L5.4 9l4.7-1.8z" />
      <path d="M18.5 15.5l.9 2.2 2.1.8-2.1.8-.9 2.2-.9-2.2-2.1-.8 2.1-.8z" />
      <path d="M5 16.5l.6 1.5 1.4.5-1.4.5L5 20.5l-.6-1.5L3 18.5l1.4-.5z" />
    </>
  ),
  admin: (
    <>
      <path d="M12 2.5l8 3.2v5.6c0 4.8-3.3 9-8 10.2-4.7-1.2-8-5.4-8-10.2V5.7z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </>
  ),
  notifications: (
    <>
      <path d="M18 8.5A6 6 0 0 0 6 8.5c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5" />
      <path d="M13.7 20a2 2 0 0 1-3.4 0" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </>
  ),
  activity: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  analytics: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 16v-4M12 16V7M17 16v-7" />
    </>
  ),

  /* --------------------------------------------------------------- actions */
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5L21 21" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  close: <path d="M5 5l14 14M19 5L5 19" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  chevronDown: <path d="M5 8.5l7 7 7-7" />,
  chevronUp: <path d="M5 15.5l7-7 7 7" />,
  chevronLeft: <path d="M15.5 5l-7 7 7 7" />,
  chevronRight: <path d="M8.5 5l7 7-7 7" />,
  chevronsLeft: <path d="M11 5l-7 7 7 7M20 5l-7 7 7 7" />,
  chevronsRight: <path d="M13 5l7 7-7 7M4 5l7 7-7 7" />,
  arrowRight: <path d="M4 12h15M13 6l6 6-6 6" />,
  arrowLeft: <path d="M20 12H5M11 6l-6 6 6 6" />,
  arrowUp: <path d="M12 20V4M6 10l6-6 6 6" />,
  arrowDown: <path d="M12 4v16M6 14l6 6 6-6" />,
  more: (
    <>
      <circle cx="12" cy="5" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="12" cy="19" r="1.4" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4L20 8l-4-4L4 16z" />
      <path d="M14.5 5.5l4 4" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V3h8v3" />
      <path d="M5 6l1 15h12l1-15" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12" />
      <path d="M7 11l5 5 5-5" />
      <path d="M4 20h16" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M4 20h16" />
    </>
  ),
  send: <path d="M4 12l16-8-6 16-3-6z" />,
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-13.7-4.9L3 9" />
      <path d="M3 4v5h5" />
      <path d="M4 13a8 8 0 0 0 13.7 4.9L21 15" />
      <path d="M21 20v-5h-5" />
    </>
  ),
  check: <path d="M4 12.5l5 5L20 6.5" />,
  filter: <path d="M3 5h18l-7 8v6l-4 2v-8z" />,
  sort: <path d="M8 5v14M4.5 15.5L8 19l3.5-3.5M16 19V5M12.5 8.5L16 5l3.5 3.5" />,
  logout: (
    <>
      <path d="M10 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5" />
      <path d="M16 8l4 4-4 4" />
      <path d="M20 12H9" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M4 4l16 16" />
      <path d="M9.5 5.5A9.9 9.9 0 0 1 12 5c6.4 0 10 6 10 6a17 17 0 0 1-3 3.6" />
      <path d="M6.2 7.6A16.6 16.6 0 0 0 2 11s3.6 6 10 6a9.6 9.6 0 0 0 3.6-.7" />
      <path d="M10.3 10.3a2.5 2.5 0 0 0 3.4 3.4" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </>
  ),
  paperclip: (
    <path d="M21 11l-9.2 9.2a4.5 4.5 0 0 1-6.4-6.4L14 4.8a3 3 0 0 1 4.3 4.3L9.5 18a1.5 1.5 0 0 1-2.1-2.1l7.8-7.8" />
  ),
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4l-9 9" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </>
  ),
  print: (
    <>
      <path d="M7 8V3h10v5" />
      <rect x="3" y="8" width="18" height="8" />
      <path d="M7 16h10v5H7z" />
    </>
  ),
  calendarPlus: (
    <>
      <rect x="3" y="4" width="18" height="17" />
      <path d="M3 9h18M8 2v4M16 2v4" />
      <path d="M12 12v6M9 15h6" />
    </>
  ),
  calendarX: (
    <>
      <rect x="3" y="4" width="18" height="17" />
      <path d="M3 9h18M8 2v4M16 2v4" />
      <path d="M10 13l4 4M14 13l-4 4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.5l3.5 2" />
    </>
  ),
  history: (
    <>
      <path d="M3.5 9A9 9 0 1 1 3 12" />
      <path d="M3 4v5h5" />
      <path d="M12 7.5V12l3.5 2" />
    </>
  ),
  play: <path d="M7 4l12 8-12 8z" />,
  stop: <rect x="6" y="6" width="12" height="12" />,

  /* ---------------------------------------------------------------- status */
  alertTriangle: (
    <>
      <path d="M12 3.5L22 20H2z" />
      <path d="M12 9v5" />
      <path d="M12 17.2v.1" />
    </>
  ),
  alertCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5" />
      <path d="M12 16.4v.1" />
    </>
  ),
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.2l2.7 2.7L16.5 9" />
    </>
  ),
  xCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <path d="M12 7.6v.1" />
    </>
  ),
  inbox: (
    <>
      <path d="M3 13h5l1.5 3h5L16 13h5" />
      <path d="M4.6 4.5h14.8L21 13v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z" />
    </>
  ),
  offline: (
    <>
      <path d="M3 3l18 18" />
      <path d="M8.5 15.5a5 5 0 0 1 7 0" />
      <path d="M5 12a10 10 0 0 1 3-2" />
      <path d="M19 12a10 10 0 0 0-6.5-2.9" />
      <path d="M12 19.5v.1" />
    </>
  ),
  shieldCheck: (
    <>
      <path d="M12 2.5l8 3.2v5.6c0 4.8-3.3 9-8 10.2-4.7-1.2-8-5.4-8-10.2V5.7z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14.5v2.5" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="8" r="4.5" />
      <path d="M11.2 11.2L20 20" />
      <path d="M16.5 15.5l-2 2M19 18l-2 2" />
    </>
  ),

  /* -------------------------------------------------------------- clinical */
  heart: (
    <path d="M12 20S3.5 14.7 3.5 9.2A4.7 4.7 0 0 1 12 6.4a4.7 4.7 0 0 1 8.5 2.8C20.5 14.7 12 20 12 20z" />
  ),
  pulse: (
    <>
      <rect x="3" y="4" width="18" height="16" />
      <path d="M6 13h2.5l1.5-3 2 6 2-4 1.5 1H18" />
    </>
  ),
  droplet: <path d="M12 3l5.2 6.6a6.5 6.5 0 1 1-10.4 0z" />,
  thermometer: (
    <>
      <path d="M13.5 14V4.5a2 2 0 0 0-4 0V14a4 4 0 1 0 4 0z" />
      <path d="M11.5 9.5H15" />
    </>
  ),
  weight: (
    <>
      <rect x="3" y="4" width="18" height="17" />
      <path d="M12 8a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" />
      <path d="M12 8V6" />
    </>
  ),
  cake: (
    <>
      <path d="M4 21h16v-6a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3z" />
      <path d="M12 12V8" />
      <path d="M8 12V9M16 12V9" />
      <path d="M4 17h16" />
    </>
  ),
  department: (
    <>
      <path d="M4 21V6l8-3v18" />
      <path d="M12 10h8v11" />
      <path d="M7 9v.1M7 13v.1M7 17v.1M16 14v.1M16 18v.1" />
    </>
  ),
  bed: (
    <>
      <path d="M3 20V9" />
      <path d="M3 13h18a0 0 0 0 1 0 0v7" />
      <path d="M7 13V9h6a4 4 0 0 1 4 4" />
      <path d="M3 17h18" />
    </>
  ),

  /* ----------------------------------------------------------------- meta */
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" />
      <path d="M3 6.5l9 6 9-6" />
    </>
  ),
  phone: (
    <path d="M21 16.5v3a1.5 1.5 0 0 1-1.7 1.5A18.5 18.5 0 0 1 3 4.7 1.5 1.5 0 0 1 4.5 3h3a1.5 1.5 0 0 1 1.5 1.3c.1 1 .3 1.9.6 2.8a1.5 1.5 0 0 1-.4 1.6L8 9.9a14 14 0 0 0 6.1 6.1l1.2-1.2a1.5 1.5 0 0 1 1.6-.4c.9.3 1.8.5 2.8.6A1.5 1.5 0 0 1 21 16.5z" />
  ),
  mapPin: (
    <>
      <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </>
  ),
  userPlus: (
    <>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1" />
      <path d="M19 8v6M16 11h6" />
    </>
  ),
  creditCard: (
    <>
      <rect x="2" y="5" width="20" height="14" />
      <path d="M2 10h20" />
      <path d="M6 15h4" />
    </>
  ),
  cash: (
    <>
      <rect x="2" y="6" width="20" height="12" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12v.1M18 12v.1" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
      <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
    </>
  ),
  cpu: (
    <>
      <rect x="6" y="6" width="12" height="12" />
      <rect x="10" y="10" width="4" height="4" />
      <path d="M10 3v3M14 3v3M10 18v3M14 18v3M3 10h3M3 14h3M18 10h3M18 14h3" />
    </>
  ),
  book: (
    <>
      <path d="M4 4h6a3 3 0 0 1 2 1 3 3 0 0 1 2-1h6v14h-6a3 3 0 0 0-2 1 3 3 0 0 0-2-1H4z" />
      <path d="M12 5v14" />
    </>
  ),
  quote: (
    <>
      <path d="M8 6H4v6h4c0 3-1.5 4.5-4 5" />
      <path d="M20 6h-4v6h4c0 3-1.5 4.5-4 5" />
    </>
  ),
  star: (
    <path d="M12 3.5l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.9l6-.8z" />
  ),
  file: (
    <>
      <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" />
      <path d="M14 3v5h5" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" />
      <circle cx="8.5" cy="9.5" r="1.8" />
      <path d="M21 16l-5-5-9 9" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3l9 5-9 5-9-5z" />
      <path d="M3 13l9 5 9-5" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" />
    </>
  ),
  zap: <path d="M13 2L5 14h6l-1 8 8-12h-6z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </>
  ),
  list: <path d="M8 6h13M8 12h13M8 18h13M3.5 6v.1M3.5 12v.1M3.5 18v.1" />,
};

export const ICON_NAMES = Object.keys(PATHS);

function Icon({ name, size = 18, className = "", strokeWidth = 1.5, ...rest }) {
  const glyph = PATHS[name];

  // A missing key is a developer error, not a runtime one — render nothing
  // rather than breaking the surrounding layout.
  if (!glyph) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      style={{ flex: "none" }}
      {...rest}
    >
      {glyph}
    </svg>
  );
}

export default Icon;
