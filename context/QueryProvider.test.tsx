import { useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import QueryProvider from "./QueryProvider";

function Probe({ queryFn }: { queryFn: () => Promise<string> }) {
  const query = useQuery({ queryKey: ["probe"], queryFn });
  if (query.isError) return <p>failed</p>;
  return <p>{query.data ?? "loading"}</p>;
}

describe("QueryProvider", () => {
  it("lets children run queries", async () => {
    render(
      <QueryProvider>
        <Probe queryFn={async () => "loaded"} />
      </QueryProvider>,
    );
    expect(await screen.findByText("loaded")).toBeInTheDocument();
  });

  it("doesn't retry requests the server rejected", async () => {
    const queryFn = vi.fn(async (): Promise<string> => {
      throw new ApiError(404, "NOT_FOUND", "Not found");
    });
    render(
      <QueryProvider>
        <Probe queryFn={queryFn} />
      </QueryProvider>,
    );
    expect(await screen.findByText("failed")).toBeInTheDocument();
    expect(queryFn).toHaveBeenCalledTimes(1);
  });
});
