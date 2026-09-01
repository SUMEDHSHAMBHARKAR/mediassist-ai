/**
 * cx — conditional className joiner.
 * Accepts strings, falsy values (skipped) and objects of { class: condition }.
 */
export function cx(...parts) {
  const out = [];

  for (const part of parts) {
    if (!part) continue;

    if (typeof part === "string") {
      out.push(part);
      continue;
    }

    if (typeof part === "object") {
      for (const [key, value] of Object.entries(part)) {
        if (value) out.push(key);
      }
    }
  }

  return out.join(" ");
}

export default cx;
