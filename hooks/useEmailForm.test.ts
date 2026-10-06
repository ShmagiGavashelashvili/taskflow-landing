import { act, renderHook } from "@testing-library/react";
import type { ChangeEvent, FormEvent } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEmailForm } from "./useEmailForm";

const SIMULATED_LATENCY_MS = 800;
const changeEvent = (value: string) => ({ target: { value } }) as ChangeEvent<HTMLInputElement>;
const submitEvent = () => ({ preventDefault: vi.fn() }) as unknown as FormEvent<HTMLFormElement>;

describe("useEmailForm", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("starts idle and empty", () => {
    const { result } = renderHook(() => useEmailForm());
    expect(result.current).toMatchObject({ email: "", error: null, status: "idle" });
  });

  it("tracks the typed email", () => {
    const { result } = renderHook(() => useEmailForm());
    act(() => result.current.onChange(changeEvent("jane@example.com")));
    expect(result.current.email).toBe("jane@example.com");
  });

  it("prevents the default form submission", () => {
    const { result } = renderHook(() => useEmailForm());
    const event = submitEvent();
    act(() => result.current.onSubmit(event));
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("shows an error and stays idle when submitting an empty field", () => {
    const { result } = renderHook(() => useEmailForm());
    act(() => result.current.onSubmit(submitEvent()));
    expect(result.current.error).toBe("Please enter your email address.");
    expect(result.current.status).toBe("idle");
  });

  it("shows an error for an invalid email", () => {
    const { result } = renderHook(() => useEmailForm());
    act(() => result.current.onChange(changeEvent("nope")));
    act(() => result.current.onSubmit(submitEvent()));
    expect(result.current.error).toBe("That doesn't look like a valid email address.");
    expect(result.current.status).toBe("idle");
  });

  it.each(["jane@example.com", "a.b+tag@sub.domain.io", "x@y.co", "  jane@example.com  "])(
    "accepts %j",
    (value) => {
      const { result } = renderHook(() => useEmailForm());
      act(() => result.current.onChange(changeEvent(value)));
      act(() => result.current.onSubmit(submitEvent()));
      expect(result.current.error).toBeNull();
      expect(result.current.status).toBe("submitting");
    },
  );

  it.each(["   "])("asks for an address when the value is blank (%j)", (value) => {
    const { result } = renderHook(() => useEmailForm());
    act(() => result.current.onChange(changeEvent(value)));
    act(() => result.current.onSubmit(submitEvent()));
    expect(result.current.error).toBe("Please enter your email address.");
  });

  it.each(["plain", "no-at.example.com", "@example.com", "jane@", "jane@example", "jane@example.c", "ja ne@example.com", "a@b@c.com"])(
    "rejects %j as invalid",
    (value) => {
      const { result } = renderHook(() => useEmailForm());
      act(() => result.current.onChange(changeEvent(value)));
      act(() => result.current.onSubmit(submitEvent()));
      expect(result.current.error).toBe("That doesn't look like a valid email address.");
      expect(result.current.status).toBe("idle");
    },
  );

  it("clears the error as soon as the user edits the field", () => {
    const { result } = renderHook(() => useEmailForm());
    act(() => result.current.onSubmit(submitEvent()));
    expect(result.current.error).not.toBeNull();
    act(() => result.current.onChange(changeEvent("j")));
    expect(result.current.error).toBeNull();
  });

  it("goes submitting then success after the simulated latency", () => {
    const { result } = renderHook(() => useEmailForm());
    act(() => result.current.onChange(changeEvent("jane@example.com")));
    act(() => result.current.onSubmit(submitEvent()));
    expect(result.current.status).toBe("submitting");
    act(() => vi.advanceTimersByTime(SIMULATED_LATENCY_MS - 1));
    expect(result.current.status).toBe("submitting");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.status).toBe("success");
  });

  it("ignores a second submit while submitting", () => {
    const { result } = renderHook(() => useEmailForm());
    act(() => result.current.onChange(changeEvent("jane@example.com")));
    act(() => result.current.onSubmit(submitEvent()));
    expect(vi.getTimerCount()).toBe(1);
    const second = submitEvent();
    act(() => result.current.onSubmit(second));
    expect(second.preventDefault).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(SIMULATED_LATENCY_MS));
    expect(result.current.status).toBe("success");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("resets to the initial state", () => {
    const { result } = renderHook(() => useEmailForm());
    act(() => result.current.onChange(changeEvent("jane@example.com")));
    act(() => result.current.onSubmit(submitEvent()));
    act(() => vi.advanceTimersByTime(SIMULATED_LATENCY_MS));
    act(() => result.current.reset());
    expect(result.current).toMatchObject({ email: "", error: null, status: "idle" });
  });

  it("cancels the pending timer on unmount", () => {
    const { result, unmount } = renderHook(() => useEmailForm());
    act(() => result.current.onChange(changeEvent("jane@example.com")));
    act(() => result.current.onSubmit(submitEvent()));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
