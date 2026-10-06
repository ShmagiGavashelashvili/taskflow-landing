/**
 * Controllable IntersectionObserver for jsdom. By default every observed element
 * is reported as intersecting right away; set `control.auto = false` to drive it by hand.
 */
interface Entry {
  observer: MockIntersectionObserver;
  target: Element;
}

export const control = { auto: true, entries: [] as Entry[] };

export class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds = [0];

  constructor(private callback: IntersectionObserverCallback) {}

  observe(target: Element) {
    control.entries.push({ observer: this, target });
    if (control.auto) queueMicrotask(() => this.fire(target, true));
  }
  unobserve(target: Element) {
    control.entries = control.entries.filter((e) => e.target !== target);
  }
  disconnect() {
    control.entries = control.entries.filter((e) => e.observer !== this);
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  fire(target: Element, isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting, target, intersectionRatio: isIntersecting ? 1 : 0 } as IntersectionObserverEntry],
      this,
    );
  }
}

/** Reports every currently observed element as (not) intersecting. */
export function triggerAll(isIntersecting: boolean) {
  for (const { observer, target } of [...control.entries]) observer.fire(target, isIntersecting);
}

export function resetIntersection() {
  control.auto = true;
  control.entries = [];
}
