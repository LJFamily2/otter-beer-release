/**
 * jsdom implements no `window.matchMedia`, and framer-motion needs a working
 * one: `initPrefersReducedMotion()` queries `(prefers-reduced-motion)` exactly
 * once per module instance, caches the answer in a module-level singleton, and
 * from then on only updates it from a "change" event on the MediaQueryList it
 * captured. A mock that just returns `{ matches: false }` therefore locks every
 * test in a worker into "motion allowed" — redefining `window.matchMedia`
 * afterwards has no effect, because framer is still holding the first list.
 *
 * So the mock below hands out a live object whose `matches` is a getter over a
 * mutable flag, and keeps the change listeners framer registers, so
 * `setPrefersReducedMotion()` can flip the preference mid-file.
 *
 * Installed from jest.setup.ts; import `setPrefersReducedMotion` from this same
 * module in a test to drive it (both get the same instance — Jest gives each
 * test file its own module registry shared with its setup file).
 */

type MediaListener = (event: { matches: boolean }) => void;

const reducedMotionListeners = new Set<MediaListener>();
let prefersReducedMotion = false;

export function installMatchMediaMock() {
  // Suites that opt into `@jest-environment node` have no window to patch.
  if (typeof window === "undefined") return;

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => {
      const tracksReducedMotion = query.includes("prefers-reduced-motion");

      const subscribe = (listener: MediaListener) => {
        if (tracksReducedMotion) reducedMotionListeners.add(listener);
      };
      const unsubscribe = (listener: MediaListener) => {
        reducedMotionListeners.delete(listener);
      };

      return {
        get matches() {
          return tracksReducedMotion ? prefersReducedMotion : false;
        },
        media: query,
        onchange: null,
        addEventListener: (type: string, listener: MediaListener) => {
          if (type === "change") subscribe(listener);
        },
        removeEventListener: (_type: string, listener: MediaListener) => {
          unsubscribe(listener);
        },
        addListener: subscribe,
        removeListener: unsubscribe,
        dispatchEvent: () => true,
      };
    },
  });
}

/** Set the `prefers-reduced-motion` preference and notify existing listeners. */
export function setPrefersReducedMotion(value: boolean) {
  prefersReducedMotion = value;
  for (const listener of reducedMotionListeners) listener({ matches: value });
}
