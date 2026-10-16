import { describe, expect, it, vi } from "vitest";
import { metaResponseSchema } from "@/lib/schemas/meta";
import { ApiError, apiRequest } from "./client";

function stubFetch(response: Response | Error) {
  const fetchMock = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("apiRequest", () => {
  it("returns the parsed JSON body", async () => {
    stubFetch(jsonResponse({ demoMode: true, dataSource: "memory", demoAccount: null }));

    await expect(apiRequest("/api/meta", { schema: metaResponseSchema })).resolves.toEqual({
      demoMode: true,
      dataSource: "memory",
      demoAccount: null,
    });
  });

  it("sends bodies as JSON with the session cookie", async () => {
    const fetchMock = stubFetch(jsonResponse({ id: "p1" }, 201));

    await apiRequest("/api/projects", { method: "POST", body: { name: "Launch" } });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/projects",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Launch" }),
        credentials: "same-origin",
        headers: expect.objectContaining({ "content-type": "application/json" }),
      }),
    );
  });

  it("returns undefined for an empty response", async () => {
    stubFetch(new Response(null, { status: 204 }));

    await expect(apiRequest("/api/projects/p1", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("throws an ApiError carrying the error shape", async () => {
    stubFetch(
      jsonResponse(
        { error: { code: "VALIDATION_ERROR", message: "Please check the highlighted fields.", fieldErrors: { email: ["Invalid email"] } } },
        400,
      ),
    );

    const error = await apiRequest("/api/auth/register", { method: "POST", body: {} }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Please check the highlighted fields.",
      fieldErrors: { email: ["Invalid email"] },
    });
  });

  it("treats a failure without the error shape as an internal error", async () => {
    stubFetch(new Response("<html>Bad gateway</html>", { status: 502 }));

    await expect(apiRequest("/api/meta")).rejects.toMatchObject({ status: 502, code: "INTERNAL_ERROR" });
  });

  it("treats a network failure as unavailable", async () => {
    stubFetch(new TypeError("Failed to fetch"));

    await expect(apiRequest("/api/meta")).rejects.toMatchObject({ status: 0, code: "UNAVAILABLE" });
  });

  it("rejects a response that doesn't match the schema", async () => {
    stubFetch(jsonResponse({ demoMode: "yes" }));

    await expect(apiRequest("/api/meta", { schema: metaResponseSchema })).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
  });
});
