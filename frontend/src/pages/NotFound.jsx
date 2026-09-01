import Button from "../components/ui/Button";
import useDocumentTitle from "../hooks/useDocumentTitle";

/** NotFound — unmatched route inside the application shell. */
function NotFound() {
  useDocumentTitle("Page not found");

  return (
    <div className="page">
      <div className="notfound">
        <div className="stripe" style={{ width: 72 }} />
        <h1 className="t-display-md">Page not found</h1>
        <p className="t-body" style={{ maxWidth: "44ch" }}>
          The page you asked for does not exist, or it moved. Check the address or
          head back to your dashboard.
        </p>
        <div className="row row--tight" style={{ marginTop: "var(--s-sm)" }}>
          <Button variant="primary" to="/dashboard" icon="dashboard">
            Go to dashboard
          </Button>
          <Button variant="outline" to="/ai" icon="ai">
            Ask the assistant
          </Button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
