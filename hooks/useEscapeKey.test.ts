import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useEscapeKey } from "./useEscapeKey";

const press = (key: string) => window.dispatchEvent(new KeyboardEvent("keydown", { key }));

describe("useEscapeKey", () => {
  it("calls the handler on Escape while active", () => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey(true, onEscape));
    press("Escape");
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("ignores other keys", () => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey(true, onEscape));
    press("Enter");
    press("a");
    expect(onEscape).not.toHaveBeenCalled();
  });

  it("does nothing while inactive", () => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey(false, onEscape));
    press("Escape");
    expect(onEscape).not.toHaveBeenCalled();
  });

  it("starts and stops listening as `active` changes", () => {
    const onEscape = vi.fn();
    const { rerender } = renderHook(({ active }) => useEscapeKey(active, onEscape), {
      initialProps: { active: false },
    });
    rerender({ active: true });
    press("Escape");
    expect(onEscape).toHaveBeenCalledTimes(1);
    rerender({ active: false });
    press("Escape");
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("stops listening on unmount", () => {
    const onEscape = vi.fn();
    const { unmount } = renderHook(() => useEscapeKey(true, onEscape));
    unmount();
    press("Escape");
    expect(onEscape).not.toHaveBeenCalled();
  });

  it("uses the latest handler", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ handler }) => useEscapeKey(true, handler), {
      initialProps: { handler: first },
    });
    rerender({ handler: second });
    press("Escape");
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
