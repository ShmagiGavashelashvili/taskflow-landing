import { describe, expect, it, vi } from "vitest";
import { processGlobal, setProcessGlobal } from "./process-global";

describe("processGlobal", () => {
  it("creates a value once and returns it afterwards", () => {
    const init = vi.fn(() => ({ n: 1 }));
    const first = processGlobal("test.once", init);
    expect(processGlobal("test.once", init)).toBe(first);
    expect(init).toHaveBeenCalledTimes(1);
  });

  it("is shared by another copy of the module (Next bundles server code per entry point)", async () => {
    const mine = processGlobal("test.shared", () => ({}));
    vi.resetModules();
    const other = await import("./process-global");
    expect(other.processGlobal).not.toBe(processGlobal);
    expect(other.processGlobal("test.shared", () => ({ different: true }))).toBe(mine);
  });

  it("can be replaced and cleared", () => {
    setProcessGlobal("test.replace", 1);
    expect(processGlobal("test.replace", () => 0)).toBe(1);
    setProcessGlobal("test.replace", undefined);
    expect(processGlobal("test.replace", () => 2)).toBe(2);
  });
});
