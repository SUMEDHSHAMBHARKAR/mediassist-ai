import cx from "../../utils/classNames";
import { initials } from "../../utils/format";

/**
 * Avatar — initials by default. Photography is only used where a real portrait
 * exists; otherwise initials keep list rows uniform and avoid stock imagery.
 */
function Avatar({
  name = "",
  src,
  size = "md",
  square = false,
  status,
  accent = false,
  className,
}) {
  return (
    <span
      className={cx(
        "avatar",
        size !== "md" && `avatar--${size}`,
        square && "avatar--square",
        accent && "avatar--accent",
        className,
      )}
      title={name || undefined}
    >
      {src ? <img src={src} alt="" loading="lazy" /> : initials(name)}

      {status && (
        <span
          className={cx("avatar__status", `avatar__status--${status}`)}
          aria-hidden="true"
        />
      )}
    </span>
  );
}

/** Identity — avatar + name + secondary line. Used in every list and table. */
export function Identity({
  name,
  meta,
  src,
  size = "md",
  square = false,
  status,
  accent = false,
  className,
}) {
  return (
    <span className={cx("identity", className)}>
      <Avatar
        name={name}
        src={src}
        size={size}
        square={square}
        status={status}
        accent={accent}
      />
      <span className="identity__text">
        <span className="identity__name">{name}</span>
        {meta && <span className="identity__meta">{meta}</span>}
      </span>
    </span>
  );
}

export default Avatar;
