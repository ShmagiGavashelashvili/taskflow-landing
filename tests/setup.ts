import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { MockIntersectionObserver, resetIntersection } from "./intersection";

type ChangeListener = (event: { matches: boolean; media: string }) => void;

/**
 * One shared `(prefers-reduced-motion)` query. Framer Motion caches the first value it reads
 * and then listens for `change`, so toggling must dispatch a change event to take effect.
 */
const reducedMotionQuery = {
  matches: false,
  media: "(prefers-reduced-motion)",
  listeners: new Set<ChangeListener>(),
};

export const media = {
  get reduceMotion() {
    return reducedMotionQuery.matches;
  },
  set reduceMotion(value: boolean) {
    reducedMotionQuery.matches = value;
    for (const listener of reducedMotionQuery.listeners) {
      listener({ matches: value, media: reducedMotionQuery.media });
    }
  },
};

function createMediaQueryList(query: string): MediaQueryList {
  const isReducedMotion = query.includes("prefers-reduced-motion");
  return {
    get matches() {
      return isReducedMotion && reducedMotionQuery.matches;
    },
    media: query,
    onchange: null,
    addEventListener: (_type: string, listener: ChangeListener) => {
      if (isReducedMotion) reducedMotionQuery.listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: ChangeListener) => {
      reducedMotionQuery.listeners.delete(listener);
    },
    addListener: (listener: ChangeListener) => {
      if (isReducedMotion) reducedMotionQuery.listeners.add(listener);
    },
    removeListener: (listener: ChangeListener) => {
      reducedMotionQuery.listeners.delete(listener);
    },
    dispatchEvent: () => false,
  } as unknown as MediaQueryList;
}

beforeEach(() => {
  resetIntersection();
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: createMediaQueryList,
  });
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  media.reduceMotion = false;
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});
