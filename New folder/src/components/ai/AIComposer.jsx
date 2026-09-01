import { useEffect, useRef } from "react";

import cx from "../../utils/classNames";
import Icon from "../ui/Icon";
import IconButton from "../ui/IconButton";

/**
 * AIComposer — prompt input with mode selection.
 *
 * The mode is part of the composer rather than a setting, because it changes what
 * the answer means: Grounded cites retrieved documents, Assist does not, and
 * Search returns documents without generating prose. That distinction is
 * clinically important, so it stays visible at the point of asking.
 */
function AIComposer({
  value,
  onChange,
  onSubmit,
  modes = [],
  mode,
  onModeChange,
  busy = false,
  onStop,
  disabled = false,
  placeholder = "Ask about a patient, a report or a guideline",
  contextChip,
  onClearContext,
}) {
  const inputRef = useRef(null);

  // Grow with content up to the CSS max-height, then scroll.
  useEffect(() => {
    const node = inputRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 200)}px`;
  }, [value]);

  const submit = () => {
    if (busy || disabled || !value.trim()) return;
    onSubmit();
  };

  const activeMode = modes.find((entry) => entry.value === mode);

  return (
    <div className="col col--gap-xs">
      {contextChip && (
        <div className="row row--tight">
          <span className="badge badge--accent badge--lg">
            <Icon name="patients" size={11} />
            {contextChip}
          </span>
          {onClearContext && (
            <IconButton
              icon="close"
              label="Remove context"
              size="sm"
              onClick={onClearContext}
            />
          )}
        </div>
      )}

      <div className="composer">
        <label className="sr-only" htmlFor="ai-composer-input">
          Prompt
        </label>
        <textarea
          id="ai-composer-input"
          ref={inputRef}
          className="composer__input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
        />

        <div className="composer__bar">
          <div className="composer__modes">
            {modes.map((entry) => (
              <button
                type="button"
                key={entry.value}
                className={cx("segment__btn", mode === entry.value && "is-active")}
                onClick={() => onModeChange(entry.value)}
                aria-pressed={mode === entry.value}
                title={entry.hint}
                style={{ border: "1px solid var(--hairline-strong)" }}
              >
                <Icon name={entry.icon} size={13} />
                {entry.label}
              </button>
            ))}
          </div>

          <div className="row row--tight">
            <span className="composer__hint hide-mobile">
              {busy ? "Generating…" : "Enter to send · Shift+Enter for a new line"}
            </span>

            {busy && onStop ? (
              <IconButton
                icon="stop"
                label="Stop generating"
                variant="filled"
                onClick={onStop}
              />
            ) : (
              <IconButton
                icon="send"
                label="Send prompt"
                variant="accent"
                onClick={submit}
                disabled={disabled || !value.trim()}
              />
            )}
          </div>
        </div>
      </div>

      {activeMode && (
        <p className="t-caption">
          <span className="t-label t-label--sm">{activeMode.label}</span> ·{" "}
          {activeMode.hint}
        </p>
      )}
    </div>
  );
}

export default AIComposer;
