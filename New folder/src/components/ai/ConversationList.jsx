import cx from "../../utils/classNames";
import Icon from "../ui/Icon";
import { EmptyState, SkeletonRows } from "../ui/States";
import { formatRelative } from "../../utils/format";

const MODE_ICON = { rag: "database", assist: "ai", search: "search" };

/**
 * ConversationList — the history rail.
 * Presentational: the caller owns selection and creation.
 */
function ConversationList({
  conversations = [],
  activeId,
  onSelect,
  loading = false,
}) {
  if (loading) {
    return (
      <div style={{ padding: "var(--s-md)" }}>
        <SkeletonRows rows={4} />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <EmptyState
        size="inline"
        icon="ai"
        title="No conversations"
        message="Your saved threads will appear here."
      />
    );
  }

  return (
    <ul>
      {conversations.map((conversation) => (
        <li key={conversation.id}>
          <button
            type="button"
            className={cx("convo", conversation.id === activeId && "is-active")}
            onClick={() => onSelect(conversation)}
          >
            <span className="convo__title">{conversation.title}</span>
            <span className="convo__meta row row--tight">
              <Icon name={MODE_ICON[conversation.mode] || "ai"} size={11} />
              {conversation.messageCount} turns · {formatRelative(conversation.updatedAt)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default ConversationList;
