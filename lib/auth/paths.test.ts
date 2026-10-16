import { describe, expect, it } from "vitest";
import { staleSessionUrl } from "./paths";

describe("staleSessionUrl", () => {
  it("sends the browser through logout with the app page to return to", () => {
    expect(staleSessionUrl("/app/projects/prj_website?view=list")).toBe(
      "/api/auth/logout?next=%2Fapp%2Fprojects%2Fprj_website%3Fview%3Dlist",
    );
    expect(staleSessionUrl("/app")).toBe("/api/auth/logout?next=%2Fapp");
  });

  it.each([null, "", "https://evil.example/app", "//evil.example/app", "/\\evil", "/login", "/apples", "app/projects"])(
    "drops a return path that isn't a same-origin app page: %s",
    (path) => {
      expect(staleSessionUrl(path)).toBe("/api/auth/logout");
    },
  );
});
