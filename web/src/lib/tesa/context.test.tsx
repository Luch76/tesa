import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { useContext } from "react";
import { TesaProvider, useTesa } from "./context";
import { TesaContext } from "./learner-context";

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.classList.remove("light", "dark");
});

describe("TESA learner context", () => {
  it("retains context identity when the module is reevaluated", async () => {
    vi.resetModules();
    const refreshed = await import("./learner-context");
    expect(refreshed.TesaContext).toBe(TesaContext);
  });
  it("switches to light mode and retains it after resetting learner progress", () => {
    const { result } = renderHook(() => useTesa(), { wrapper: TesaProvider });
    expect(result.current.state.theme).toBe("dark");
    act(() => result.current.update({ theme: "light" }));
    expect(document.documentElement.classList.contains("light")).toBe(true);
    act(() => result.current.reset());
    expect(result.current.state.theme).toBe("light");
  });
  it("shares the stable context between provider and consumers", () => {
    const { result } = renderHook(() => ({ learner: useTesa(), shared: useContext(TesaContext) }), {
      wrapper: TesaProvider,
    });
    expect(result.current.shared).toBe(result.current.learner);
    act(() => result.current.learner.update({ language: "es" }));
    expect(result.current.shared?.state.language).toBe("es");
    expect(result.current.learner.t("English", "Español")).toBe("Español");
  });
});
