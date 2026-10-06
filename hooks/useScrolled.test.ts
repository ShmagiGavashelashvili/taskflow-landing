import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useScrolled } from "./useScrolled";

function scrollTo(y: number) {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true, writable: true });
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
}

describe("useScrolled", () => {
  afterEach(() => scrollTo(0));

  it("is false at the top of the page", () => {
    const { result } = renderHook(() => useScrolled());
    expect(result.current).toBe(false);
  });

  it("is true when the page already starts scrolled", () => {
    Object.defineProperty(window, "scrollY", { value: 200, configurable: true, writable: true });
    const { result } = renderHook(() => useScrolled());
    expect(result.current).toBe(true);
  });

  it("flips when scrolling past the default threshold of 8px", () => {
    const { result } = renderHook(() => useScrolled());
    scrollTo(8);
    expect(result.current).toBe(false);
    scrollTo(9);
    expect(result.current).toBe(true);
    scrollTo(0);
    expect(result.current).toBe(false);
  });

  it("respects a custom threshold", () => {
    const { result } = renderHook(() => useScrolled(100));
    scrollTo(50);
    expect(result.current).toBe(false);
    scrollTo(101);
    expect(result.current).toBe(true);
  });

  it("removes its scroll listener on unmount", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useScrolled());
    unmount();
    expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function));
  });
});
