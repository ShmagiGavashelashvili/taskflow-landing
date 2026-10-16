import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Toaster } from "@/components/ui/sonner";
import { commentQueries } from "@/lib/api/comments";
import type { CommentView } from "@/lib/schemas/comments";
import { errorResponse, jsonResponse, sentRequest, stubFetch } from "@/tests/fetch";
import CommentThread from "./CommentThread";

const ME = { id: "usr_priya", name: "Priya Shah" };

const EXISTING: CommentView = {
  id: "cmt_01",
  taskId: "tsk_copy",
  authorId: "usr_demo",
  author: { id: "usr_demo", name: "Alex Morgan" },
  body: "Can we try a shorter subhead?",
  createdAt: "2026-10-13T06:00:00.000Z",
  editedAt: null,
};

function renderThread() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  // What the server-rendered page seeds.
  queryClient.setQueryData(commentQueries.thread("tsk_copy").queryKey, [EXISTING]);
  render(
    <QueryClientProvider client={queryClient}>
      <CommentThread taskId="tsk_copy" currentUser={ME} />
      <Toaster />
    </QueryClientProvider>,
  );
}

const thread = () => within(screen.getByRole("list", { name: "Comments" }));

/** A response the test releases by hand, to observe the optimistic state in between. */
function deferred() {
  let release!: (response: Response) => void;
  const promise = new Promise<Response>((resolve) => (release = resolve));
  return { promise, release };
}

describe("CommentThread: adding a comment", () => {
  it("shows the comment straight away, sends it, and keeps it once saved", async () => {
    const user = userEvent.setup();
    const pending = deferred();
    const fetchMock = stubFetch((_path, init) =>
      init.method === "POST" ? pending.promise : jsonResponse([EXISTING]),
    );
    renderThread();

    await user.type(screen.getByRole("textbox", { name: "Add a comment" }), "Shortened it, have a look.");
    await user.click(screen.getByRole("button", { name: "Comment" }));

    // Optimistic: visible before the server answers, and the box is cleared for the next one.
    expect(thread().getByText("Shortened it, have a look.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Add a comment" })).toHaveValue("");
    expect(sentRequest(fetchMock, 0)).toEqual({
      path: "/api/tasks/tsk_copy/comments",
      method: "POST",
      body: { body: "Shortened it, have a look." },
    });

    const saved: CommentView = {
      ...EXISTING,
      id: "cmt_new",
      authorId: ME.id,
      author: ME,
      body: "Shortened it, have a look.",
      createdAt: "2026-10-14T12:00:00.000Z",
    };
    fetchMock.mockImplementation(async (_input, init) => (init?.method === "POST" ? jsonResponse(saved, 201) : jsonResponse([EXISTING, saved])));
    pending.release(jsonResponse(saved, 201));

    // Once saved, it's an ordinary comment of mine: no longer "Sending…", and editable.
    await waitFor(() => expect(thread().queryByText("Sending…")).not.toBeInTheDocument());
    const items = thread().getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[1]).getByText("Priya Shah")).toBeInTheDocument();
    expect(within(items[1]).getByRole("button", { name: "Edit comment" })).toBeInTheDocument();
  });

  it("takes the comment back out and restores the draft when the server refuses it", async () => {
    const user = userEvent.setup();
    stubFetch((_path, init) =>
      init.method === "POST" ? errorResponse(503, "UNAVAILABLE", "The service is busy.") : jsonResponse([EXISTING]),
    );
    renderThread();

    await user.type(screen.getByRole("textbox", { name: "Add a comment" }), "Lost in transit");
    await user.click(screen.getByRole("button", { name: "Comment" }));

    expect(await screen.findByText(/Couldn't post your comment. The service is busy./)).toBeInTheDocument();
    expect(thread().queryByText("Lost in transit")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Add a comment" })).toHaveValue("Lost in transit");
  });

  it("doesn't send an empty comment", async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch(() => jsonResponse([EXISTING]));
    renderThread();

    await user.type(screen.getByRole("textbox", { name: "Add a comment" }), "   ");
    await user.click(screen.getByRole("button", { name: "Comment" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(thread().getAllByRole("listitem")).toHaveLength(1);
  });
});
