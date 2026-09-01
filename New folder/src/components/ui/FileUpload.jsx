import { useRef, useState } from "react";

import cx from "../../utils/classNames";
import { formatBytes } from "../../utils/format";
import Icon from "./Icon";
import IconButton from "./IconButton";

/**
 * FileUpload — drop zone plus selected-file list.
 *
 * Selection only; nothing is transmitted. `onFilesSelected` hands the File
 * objects to the caller, which is where an upload service will later live.
 */
function FileUpload({
  onFilesSelected,
  accept = ".pdf,.jpg,.jpeg,.png,.dcm",
  multiple = false,
  hint = "PDF, JPG, PNG or DICOM · up to 25 MB per file",
  title = "Drop files here or browse",
  className,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const emit = (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length > 0) onFilesSelected?.(multiple ? files : [files[0]]);
  };

  return (
    <div className={className}>
      <div
        className={cx("upload", dragging && "is-dragging")}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          emit(event.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={title}
      >
        <span className="upload__icon">
          <Icon name="upload" size={24} />
        </span>
        <span className="upload__title">{title}</span>
        <span className="upload__hint">{hint}</span>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(event) => {
            emit(event.target.files);
            event.target.value = "";
          }}
          tabIndex={-1}
        />
      </div>
    </div>
  );
}

/**
 * FileRow — one selected/stored file with its transfer state.
 * status: "queued" | "uploading" | "done" | "error"
 */
export function FileRow({
  name,
  size,
  status = "done",
  progress = 0,
  meta,
  onRemove,
  onDownload,
  icon = "file",
}) {
  return (
    <div className="col col--gap-xs">
      <div className="file-row">
        <span className="file-row__icon" aria-hidden="true">
          <Icon name={icon} size={16} />
        </span>

        <span className="file-row__meta">
          <span className="file-row__name">{name}</span>
          <span className="file-row__sub">
            {[size ? formatBytes(size) : null, meta].filter(Boolean).join(" · ")}
            {status === "uploading" && ` · Uploading ${Math.round(progress)}%`}
            {status === "queued" && " · Queued"}
            {status === "error" && " · Upload failed"}
          </span>
        </span>

        {status === "uploading" && <span className="spinner" aria-hidden="true" />}
        {status === "error" && (
          <Icon name="alertCircle" size={16} className="t-critical" />
        )}
        {status === "done" && onDownload && (
          <IconButton
            icon="download"
            label={`Download ${name}`}
            size="sm"
            onClick={onDownload}
          />
        )}
        {onRemove && (
          <IconButton
            icon="close"
            label={`Remove ${name}`}
            size="sm"
            onClick={onRemove}
          />
        )}
      </div>

      {status === "uploading" && (
        <div className="progress">
          <div
            className="progress__fill"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default FileUpload;
