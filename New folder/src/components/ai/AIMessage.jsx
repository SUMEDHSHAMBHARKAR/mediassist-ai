import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Icon from "../ui/Icon";
import cx from "../../utils/classNames";
import { formatTime } from "../../utils/format";
import RichText from "./RichText";
import SourceCard from "./SourceCard";

/**
 * AIMessage — one turn in the conversation.
 *
 * Assistant turns carry their citations inline and a standing reminder that the
 * output needs clinical verification. That warning is not dismissible: in a
 * medical product it is part of the message, not a one-time notice.
 */
function AIMessage({
  message,
  authorName = "You",
  onRetry,
  onCopy,
  onOpenSource,
  showSources = true,
}) {
  const isUser = message.role === "user";
  const isError = message.role === "error";

  return (
    <article
      className={cx(
        "msg",
        isUser && "msg--user",
        isError && "msg--error",
        !isUser && !isError && "msg--ai",
      )}
    >
      <span
        className={cx("msg__avatar", !isUser && !isError && "msg__avatar--ai")}
        aria-hidden="true"
      >
        {isUser ? (
          authorName.slice(0, 2).toUpperCase()
        ) : isError ? (
          <Icon name="alertTriangle" size={15} />
        ) : (
          <Icon name="ai" size={15} />
        )}
      </span>

      <div className="msg__col">
        <div className="msg__head">
          <span className="msg__author">
            {isUser ? authorName : isError ? "Request failed" : "MediAssist AI"}
          </span>
          {message.at && <span className="msg__time">{formatTime(message.at)}</span>}
          {message.mode === "rag" && !isUser && (
            <Badge tone="accent" icon="database">
              Grounded
            </Badge>
          )}
        </div>

        <div className="msg__bubble">
          <RichText text={message.content} />
        </div>

        {!isUser && !isError && showSources && message.sources?.length > 0 && (
          <div className="col col--gap-xs" style={{ marginTop: "var(--s-sm)" }}>
            <span className="t-label t-label--sm">
              {message.sources.length} source
              {message.sources.length === 1 ? "" : "s"} cited
            </span>

            {message.sources.map((source, index) => (
              <SourceCard
                key={source.id}
                source={source}
                index={index}
                onOpen={onOpenSource}
                compact
              />
            ))}
          </div>
        )}

        <div className="msg__actions">
          {isError && onRetry && (
            <Button size="sm" variant="outline" icon="refresh" onClick={onRetry}>
              Retry
            </Button>
          )}

          {!isUser && !isError && (
            <>
              {onCopy && (
                <Button
                  size="sm"
                  variant="ghost"
                  icon="copy"
                  onClick={() => onCopy(message)}
                >
                  Copy
                </Button>
              )}

              {(message.tokens || message.latencyMs) && (
                <span className="t-caption">
                  {message.tokens ? `${message.tokens} tokens` : ""}
                  {message.tokens && message.latencyMs ? " · " : ""}
                  {message.latencyMs ? `${(message.latencyMs / 1000).toFixed(1)}s` : ""}
                </span>
              )}
            </>
          )}
        </div>

        {!isUser && !isError && (
          <p className="t-caption row row--tight" style={{ marginTop: "var(--s-xs)" }}>
            <Icon name="alertTriangle" size={12} className="t-warning" />
            Machine generated — verify against the source record before acting.
          </p>
        )}
      </div>
    </article>
  );
}

/** Generating indicator shown while a completion is in flight. */
export function AITyping({ label = "Thinking" }) {
  return (
    <article className="msg msg--ai" aria-live="polite">
      <span className="msg__avatar msg__avatar--ai" aria-hidden="true">
        <Icon name="ai" size={15} />
      </span>

      <div className="msg__col">
        <div className="msg__head">
          <span className="msg__author">MediAssist AI</span>
          <span className="msg__time">{label}</span>
        </div>

        <div className="msg__bubble" style={{ padding: 0 }}>
          <span className="typing">
            <span className="typing__dot" />
            <span className="typing__dot" />
            <span className="typing__dot" />
          </span>
        </div>
      </div>
    </article>
  );
}

export default AIMessage;
