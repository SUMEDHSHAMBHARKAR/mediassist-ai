import Button from "./Button";
import Icon from "./Icon";
import Modal from "./Modal";

/**
 * ConfirmDialog — destructive/irreversible action gate.
 * `tone="danger"` is the default because that is the case it exists for.
 */
function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Confirm action",
  message,
  detail,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger-solid" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="row row--top row--loose">
        <span
          className={
            tone === "danger" ? "state__icon state__icon--critical" : "state__icon"
          }
          style={{ width: 40, height: 40, margin: 0, flex: "none" }}
          aria-hidden="true"
        >
          <Icon name={tone === "danger" ? "alertTriangle" : "info"} size={18} />
        </span>

        <div className="col col--gap-xs">
          <p className="t-body-sm t-strong">{message}</p>
          {detail && <p className="t-caption">{detail}</p>}
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
