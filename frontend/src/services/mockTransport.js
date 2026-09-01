/**
 * mockTransport — resolves fixture data as a promise.
 *
 * This exists so pages can be written against an async service boundary that
 * behaves like the real one: loading states are genuine, errors are catchable,
 * and swapping a service body from `resolve(fixture)` to `api.get(path)` needs
 * no change in any component.
 *
 * The small delay is intentional. Without it, loading and skeleton states would
 * never be exercised and the UI would only ever be verified in its happy path.
 */

const DEFAULT_DELAY = 260;

export function resolve(data, { delay = DEFAULT_DELAY } = {}) {
  return new Promise((done) => {
    setTimeout(() => done(structuredCloneSafe(data)), delay);
  });
}

/** Reject with an Error, for exercising error states from the UI. */
export function reject(message = "The request failed.", { delay = DEFAULT_DELAY } = {}) {
  return new Promise((_, fail) => {
    setTimeout(() => fail(new Error(message)), delay);
  });
}

/**
 * Fixtures are cloned on the way out so a component mutating a result cannot
 * corrupt the shared dataset — the same isolation a network response gives.
 */
function structuredCloneSafe(value) {
  if (value === null || typeof value !== "object") return value;

  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value));
  }
}

export { DEFAULT_DELAY };
