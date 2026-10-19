import React from "react";
import { jest } from "@jest/globals";
import { render, screen, fireEvent, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UniversalTable } from "../src/index.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const headers = [
  { id: "name", label: "Name", searchable: true, sortable: true },
  { id: "email", label: "Email", searchable: true },
];

const SERVER_PAGE_SIZE = 5;

function makeRows(page, count = SERVER_PAGE_SIZE) {
  return Array.from({ length: count }, (_, i) => {
    const n = (page - 1) * SERVER_PAGE_SIZE + i + 1;
    return { name: `User ${n}`, email: `user${n}@example.com` };
  });
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** fetchRows mock whose every call returns a controllable deferred promise. */
function mockFetchRows() {
  const requests = [];
  const fetchRows = jest.fn(() => {
    const request = deferred();
    requests.push(request);
    return request.promise;
  });
  return { fetchRows, requests };
}

function lastQuery(fetchRows) {
  return fetchRows.mock.calls[fetchRows.mock.calls.length - 1][0];
}

// ---------------------------------------------------------------------------
// Initial load
// ---------------------------------------------------------------------------

test("initial load issues exactly one page-1 request and renders rows + server total", async () => {
  const { fetchRows, requests } = mockFetchRows();
  render(<UniversalTable headers={headers} name="Users" fetchRows={fetchRows} />);

  expect(fetchRows).toHaveBeenCalledTimes(1);
  const query = fetchRows.mock.calls[0][0].filters;
  expect(query.page).toBe(1);
  expect(query.searchTerm).toBe("");
  expect(query.column).toBe("");
  expect(query.direction).toBe("asc");
  expect(fetchRows.mock.calls[0][0].signal).toBeInstanceOf(AbortSignal);

  // Skeleton while the first page is in flight
  expect(document.querySelectorAll(".MuiSkeleton-root").length).toBeGreaterThan(0);

  await act(async () => {
    requests[0].resolve({ rows: makeRows(1), totalCount: 12 });
  });

  expect(screen.getByText("User 1")).toBeInTheDocument();
  expect(screen.getByText("User 5")).toBeInTheDocument();
  // Footer reflects the server total, not the loaded row count
  expect(screen.getByText(/1–5 of 12/i)).toBeInTheDocument();
  // Still exactly one request — no eager fetching of further pages
  expect(fetchRows).toHaveBeenCalledTimes(1);
});

// ---------------------------------------------------------------------------
// Incremental fetch on reaching the end of loaded rows
// ---------------------------------------------------------------------------

test("paginating to the end of loaded rows fetches exactly the next page", async () => {
  const user = userEvent.setup();
  const { fetchRows, requests } = mockFetchRows();
  render(<UniversalTable headers={headers} name="Users" fetchRows={fetchRows} />);

  await act(async () => {
    requests[0].resolve({ rows: makeRows(1), totalCount: 12 });
  });
  expect(fetchRows).toHaveBeenCalledTimes(1);

  await user.click(screen.getByRole("button", { name: /next page/i }));

  expect(fetchRows).toHaveBeenCalledTimes(2);
  expect(lastQuery(fetchRows).filters.page).toBe(2);

  // While appending: header intact (not the full-table skeleton) and the
  // inline loading-more skeleton shows in place of the not-yet-loaded slice
  expect(screen.getByRole("button", { name: /name/i })).toBeInTheDocument();
  expect(document.querySelectorAll(".MuiSkeleton-root").length).toBeGreaterThan(0);

  await act(async () => {
    requests[1].resolve({ rows: makeRows(2), totalCount: 12 });
  });

  expect(screen.getByText("User 6")).toBeInTheDocument();
  expect(screen.getByText(/6–10 of 12/i)).toBeInTheDocument();
  // No duplicate or further requests after append completes
  expect(fetchRows).toHaveBeenCalledTimes(2);

  // Already-loaded pages are cached — paging back costs no extra request
  await user.click(screen.getByRole("button", { name: /previous page/i }));
  expect(screen.getByText("User 1")).toBeInTheDocument();
  expect(fetchRows).toHaveBeenCalledTimes(2);
});

test("does not fire duplicate requests while a page is in flight", async () => {
  const user = userEvent.setup();
  const { fetchRows, requests } = mockFetchRows();
  render(<UniversalTable headers={headers} name="Users" fetchRows={fetchRows} />);

  await act(async () => {
    requests[0].resolve({ rows: makeRows(1), totalCount: 20 });
  });

  // Page 2 of the client pager → fetch page 2 from the server
  await user.click(screen.getByRole("button", { name: /next page/i }));
  expect(fetchRows).toHaveBeenCalledTimes(2);

  // With only one page of headroom, "next" is disabled while the page is in
  // flight → no duplicate request can be fired
  expect(screen.getByRole("button", { name: /next page/i })).toBeDisabled();
  expect(fetchRows).toHaveBeenCalledTimes(2);

  await act(async () => {
    requests[1].resolve({ rows: makeRows(2), totalCount: 20 });
  });
});

// ---------------------------------------------------------------------------
// End of data
// ---------------------------------------------------------------------------

test("no fetch fires when there is no more data (end of data)", async () => {
  const { fetchRows, requests } = mockFetchRows();
  render(<UniversalTable headers={headers} name="Users" fetchRows={fetchRows} />);

  await act(async () => {
    requests[0].resolve({ rows: makeRows(1), totalCount: 5 });
  });

  // All 5 rows loaded, count == 5 → single page, next-page button disabled
  expect(screen.getByRole("button", { name: /next page/i })).toBeDisabled();
  expect(screen.getByText("No more results")).toBeInTheDocument();
  expect(fetchRows).toHaveBeenCalledTimes(1);
});

test("empty dataset renders no rows and fires no further requests", async () => {
  const { fetchRows, requests } = mockFetchRows();
  render(<UniversalTable headers={headers} name="Users" fetchRows={fetchRows} />);

  await act(async () => {
    requests[0].resolve({ rows: [], totalCount: 0 });
  });

  expect(screen.getByText(/0–0 of 0/i)).toBeInTheDocument();
  expect(fetchRows).toHaveBeenCalledTimes(1);
});

test("a stale totalCount cannot spin into an endless fetch loop", async () => {
  const user = userEvent.setup();
  const { fetchRows, requests } = mockFetchRows();
  render(<UniversalTable headers={headers} name="Users" fetchRows={fetchRows} />);

  await act(async () => {
    requests[0].resolve({ rows: makeRows(1), totalCount: 20 });
  });

  await user.click(screen.getByRole("button", { name: /next page/i }));
  expect(fetchRows).toHaveBeenCalledTimes(2);

  // Server still claims 20 rows but returns an empty page
  await act(async () => {
    requests[1].resolve({ rows: [], totalCount: 20 });
  });

  // A zero-row page ends pagination regardless of totalCount
  expect(fetchRows).toHaveBeenCalledTimes(2);
  expect(screen.getByText("No more results")).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// Pager reachability (unknown total) and no fetch cascade
// ---------------------------------------------------------------------------

test("without totalCount the next page stays reachable via pager headroom", async () => {
  const user = userEvent.setup();
  const { fetchRows, requests } = mockFetchRows();
  render(<UniversalTable headers={headers} name="Users" fetchRows={fetchRows} />);

  await act(async () => {
    requests[0].resolve({ rows: makeRows(1) }); // no totalCount
  });

  const next = screen.getByRole("button", { name: /next page/i });
  expect(next).toBeEnabled();
  await user.click(next);

  expect(fetchRows).toHaveBeenCalledTimes(2);
  expect(lastQuery(fetchRows).filters.page).toBe(2);

  await act(async () => {
    requests[1].resolve({ rows: makeRows(2) }); // still no totalCount
  });
  expect(screen.getByText("User 6")).toBeInTheDocument();
  // Total is unknown → the label advertises "more"
  expect(screen.getByText(/6–10\+/)).toBeInTheDocument();
});

test("jump to last loads only one additional page (no cascade)", async () => {
  const user = userEvent.setup();
  const { fetchRows, requests } = mockFetchRows();
  render(<UniversalTable headers={headers} name="Users" fetchRows={fetchRows} />);

  await act(async () => {
    requests[0].resolve({ rows: makeRows(1), totalCount: 100 });
  });

  await user.click(screen.getByRole("button", { name: /last page/i }));

  // Only the immediate next server page is requested, not the whole run
  expect(fetchRows).toHaveBeenCalledTimes(2);
  expect(lastQuery(fetchRows).filters.page).toBe(2);

  await act(async () => {
    requests[1].resolve({ rows: makeRows(2), totalCount: 100 });
  });
  expect(screen.getByText("User 6")).toBeInTheDocument();
});

test("fetch mode renders server order without client re-sorting", async () => {
  const user = userEvent.setup();
  const { fetchRows, requests } = mockFetchRows();
  render(<UniversalTable headers={headers} name="Users" fetchRows={fetchRows} />);

  await act(async () => {
    requests[0].resolve({ rows: makeRows(1), totalCount: 12 });
  });

  // Server sort requested (descending), but the server returns ascending order
  await user.click(screen.getByText("Name"));
  await act(async () => {
    requests[1].resolve({
      rows: [
        { name: "Adam", email: "a@x.com" },
        { name: "Zoe", email: "z@x.com" },
      ],
      totalCount: 2,
    });
  });

  const bodyRows = within(screen.getAllByRole("rowgroup")[1]).getAllByRole(
    "row",
  );
  // Rendered in the order the server returned (Adam before Zoe), not re-sorted
  expect(within(bodyRows[0]).getByText("Adam")).toBeInTheDocument();
  expect(within(bodyRows[1]).getByText("Zoe")).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// Search — debounced reset, clears rows, aborts in-flight
// ---------------------------------------------------------------------------

test("search resets to page 1 with the search term after debounce", async () => {
  jest.useFakeTimers();
  try {
    const { fetchRows, requests } = mockFetchRows();
    render(<UniversalTable headers={headers} name="Users" fetchRows={fetchRows} />);

    await act(async () => {
      requests[0].resolve({ rows: makeRows(1), totalCount: 12 });
    });

    const searchInput = screen.getByPlaceholderText("Search");
    fireEvent.change(searchInput, { target: { value: "Jane" } });

    // No request before the debounce elapses
    expect(fetchRows).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(fetchRows).toHaveBeenCalledTimes(2);
    const query = lastQuery(fetchRows).filters;
    expect(query.page).toBe(1);
    expect(query.searchTerm).toBe("Jane");

    // Rows cleared while resetting (skeleton, no stale flash)
    expect(screen.queryByText("User 1")).not.toBeInTheDocument();
    expect(document.querySelectorAll(".MuiSkeleton-root").length).toBeGreaterThan(0);

    await act(async () => {
      requests[1].resolve({ rows: [{ name: "Jane Smith", email: "j@x.com" }], totalCount: 1 });
    });
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  } finally {
    jest.useRealTimers();
  }
});

test("a query change aborts the in-flight request", async () => {
  jest.useFakeTimers();
  try {
    const { fetchRows, requests } = mockFetchRows();
    render(<UniversalTable headers={headers} name="Users" fetchRows={fetchRows} />);

    // Page 1 never resolves before the search supersedes it
    const searchInput = screen.getByPlaceholderText("Search");
    fireEvent.change(searchInput, { target: { value: "x" } });
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(fetchRows).toHaveBeenCalledTimes(2);
    const firstSignal = fetchRows.mock.calls[0][0].signal;
    expect(firstSignal.aborted).toBe(true);

    await act(async () => {
      requests[1].resolve({ rows: [{ name: "Fresh", email: "f@x.com" }], totalCount: 1 });
    });
    expect(screen.getByText("Fresh")).toBeInTheDocument();
  } finally {
    jest.useRealTimers();
  }
});

test("a stale response from a superseded query cannot append into current state", async () => {
  jest.useFakeTimers();
  try {
    const { fetchRows, requests } = mockFetchRows();
    render(<UniversalTable headers={headers} name="Users" fetchRows={fetchRows} />);

    const searchInput = screen.getByPlaceholderText("Search");
    fireEvent.change(searchInput, { target: { value: "new" } });
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    // New query resolves first
    await act(async () => {
      requests[1].resolve({ rows: [{ name: "Fresh Row", email: "f@x.com" }], totalCount: 1 });
    });
    expect(screen.getByText("Fresh Row")).toBeInTheDocument();

    // The stale (superseded) request resolves late — must be dropped
    await act(async () => {
      requests[0].resolve({ rows: [{ name: "Stale Row", email: "s@x.com" }], totalCount: 50 });
    });
    expect(screen.queryByText("Stale Row")).not.toBeInTheDocument();
    expect(screen.getByText("Fresh Row")).toBeInTheDocument();
    expect(screen.getByText(/of 1/i)).toBeInTheDocument();
  } finally {
    jest.useRealTimers();
  }
});

// ---------------------------------------------------------------------------
// Server-side sort + parameter persistence
// ---------------------------------------------------------------------------

test("sortable column click resets to page 1 with sort params, which persist to later pages", async () => {
  const user = userEvent.setup();
  const { fetchRows, requests } = mockFetchRows();
  render(<UniversalTable headers={headers} name="Users" fetchRows={fetchRows} />);

  await act(async () => {
    requests[0].resolve({ rows: makeRows(1), totalCount: 12 });
  });

  await user.click(screen.getByText("Name"));

  expect(fetchRows).toHaveBeenCalledTimes(2);
  const sortQuery = lastQuery(fetchRows);
  expect(sortQuery.filters.page).toBe(1);
  expect(sortQuery.filters.column).toBe("name");
  expect(sortQuery.filters.direction).toBe("desc");

  await act(async () => {
    requests[1].resolve({ rows: makeRows(1), totalCount: 12 });
  });

  // Paginate → the next-page request keeps the active sort params
  await user.click(screen.getByRole("button", { name: /next page/i }));
  expect(fetchRows).toHaveBeenCalledTimes(3);
  const nextPageQuery = lastQuery(fetchRows);
  expect(nextPageQuery.filters.page).toBe(2);
  expect(nextPageQuery.filters.column).toBe("name");
  expect(nextPageQuery.filters.direction).toBe("desc");
});

// ---------------------------------------------------------------------------
// Reload
// ---------------------------------------------------------------------------

test("reload button refetches from page 1 with the current query", async () => {
  const user = userEvent.setup();
  const { fetchRows, requests } = mockFetchRows();
  render(<UniversalTable headers={headers} name="Users" fetchRows={fetchRows} />);

  await act(async () => {
    requests[0].resolve({ rows: makeRows(1), totalCount: 12 });
  });

  await user.click(screen.getByRole("button", { name: /reload/i }));

  expect(fetchRows).toHaveBeenCalledTimes(2);
  expect(lastQuery(fetchRows).filters.page).toBe(1);
});

// ---------------------------------------------------------------------------
// Failed load-more: keep rows, retry
// ---------------------------------------------------------------------------

test("failed next-page fetch keeps loaded rows and can be retried", async () => {
  const user = userEvent.setup();
  const { fetchRows, requests } = mockFetchRows();
  render(<UniversalTable headers={headers} name="Users" fetchRows={fetchRows} />);

  await act(async () => {
    requests[0].resolve({ rows: makeRows(1), totalCount: 12 });
  });

  await user.click(screen.getByRole("button", { name: /next page/i }));
  expect(fetchRows).toHaveBeenCalledTimes(2);

  await act(async () => {
    requests[1].reject(new Error("network down"));
  });

  // Retry control shown, and previously loaded rows are kept (page back
  // shows them without any additional request)
  expect(screen.getByText(/couldn.?t load more results/i)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /previous page/i }));
  expect(screen.getByText("User 1")).toBeInTheDocument();
  expect(fetchRows).toHaveBeenCalledTimes(2);

  // Retry re-requests the failed page without discarding loaded rows
  await user.click(screen.getByRole("button", { name: /next page/i }));
  const retryButton = screen.getByRole("button", { name: /retry/i });
  await user.click(retryButton);

  expect(fetchRows).toHaveBeenCalledTimes(3);
  expect(lastQuery(fetchRows).filters.page).toBe(2);

  await act(async () => {
    requests[2].resolve({ rows: makeRows(2), totalCount: 12 });
  });
  expect(screen.getByText("User 6")).toBeInTheDocument();
  expect(screen.queryByText(/couldn.?t load more results/i)).not.toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// Failed initial load: error state + retry
// ---------------------------------------------------------------------------

test("failed initial load shows an error state and retries from page 1", async () => {
  const user = userEvent.setup();
  const { fetchRows, requests } = mockFetchRows();
  render(<UniversalTable headers={headers} name="Users" fetchRows={fetchRows} />);

  await act(async () => {
    requests[0].reject(new Error("boom"));
  });

  expect(screen.getByText(/couldn.?t load data/i)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /retry/i }));
  expect(fetchRows).toHaveBeenCalledTimes(2);
  expect(lastQuery(fetchRows).filters.page).toBe(1);

  await act(async () => {
    requests[1].resolve({ rows: makeRows(1), totalCount: 5 });
  });
  expect(screen.getByText("User 1")).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// filters prop
// ---------------------------------------------------------------------------

test("changing the filters prop value resets to page 1 and passes filters through", async () => {
  const { fetchRows, requests } = mockFetchRows();
  const { rerender } = render(
    <UniversalTable
      headers={headers}
      name="Users"
      fetchRows={fetchRows}
      filters={{ status: "open" }}
    />,
  );

  expect(fetchRows).toHaveBeenCalledTimes(1);
  expect(fetchRows.mock.calls[0][0].filters).toMatchObject({ status: "open" });

  await act(async () => {
    requests[0].resolve({ rows: makeRows(1), totalCount: 12 });
  });

  // Same value, new object identity → no refetch
  rerender(
    <UniversalTable
      headers={headers}
      name="Users"
      fetchRows={fetchRows}
      filters={{ status: "open" }}
    />,
  );
  expect(fetchRows).toHaveBeenCalledTimes(1);

  // Changed value → reset to page 1 with new filters
  rerender(
    <UniversalTable
      headers={headers}
      name="Users"
      fetchRows={fetchRows}
      filters={{ status: "closed" }}
    />,
  );
  expect(fetchRows).toHaveBeenCalledTimes(2);
  const query = lastQuery(fetchRows).filters;
  expect(query.page).toBe(1);
  expect(query.status).toBe("closed");

  // Filters persist into subsequent page requests
  await act(async () => {
    requests[1].resolve({ rows: makeRows(1), totalCount: 12 });
  });
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /next page/i }));
  expect(lastQuery(fetchRows).filters).toMatchObject({ status: "closed" });
});

// ---------------------------------------------------------------------------
// reset prop
// ---------------------------------------------------------------------------

test("changing the reset signal discards loaded rows and refetches from page 1", async () => {
  const { fetchRows, requests } = mockFetchRows();
  const { rerender } = render(
    <UniversalTable headers={headers} name="Users" fetchRows={fetchRows} reset={0} />,
  );
  await act(async () => {
    requests[0].resolve({ rows: makeRows(1), totalCount: 12 });
  });

  // Load a second page so there is accumulated state to discard
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /next page/i }));
  await act(async () => {
    requests[1].resolve({ rows: makeRows(2), totalCount: 12 });
  });
  expect(fetchRows).toHaveBeenCalledTimes(2);
  expect(screen.getByText("User 6")).toBeInTheDocument();

  // Same value → no refetch
  rerender(<UniversalTable headers={headers} name="Users" fetchRows={fetchRows} reset={0} />);
  expect(fetchRows).toHaveBeenCalledTimes(2);

  // Mutation → bump the reset counter → fresh page 1
  rerender(<UniversalTable headers={headers} name="Users" fetchRows={fetchRows} reset={1} />);
  expect(fetchRows).toHaveBeenCalledTimes(3);
  expect(lastQuery(fetchRows).filters.page).toBe(1);

  await act(async () => {
    requests[2].resolve({ rows: [{ name: "Reloaded", email: "r@x.com" }], totalCount: 1 });
  });
  expect(screen.getByText("Reloaded")).toBeInTheDocument();
  expect(screen.queryByText("User 6")).not.toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// onStateChange / loadMoreSignal
// ---------------------------------------------------------------------------

test("onStateChange publishes the fetch state snapshot as it changes", async () => {
  const { fetchRows, requests } = mockFetchRows();
  const onStateChange = jest.fn();
  render(
    <UniversalTable
      headers={headers}
      name="Users"
      fetchRows={fetchRows}
      onStateChange={onStateChange}
    />,
  );

  expect(onStateChange).toHaveBeenLastCalledWith({
    loading: true,
    loadingMore: false,
    error: false,
    hasMore: false,
    totalCount: null,
    loadedCount: 0,
  });

  await act(async () => {
    requests[0].resolve({ rows: makeRows(1), totalCount: 12 });
  });

  expect(onStateChange).toHaveBeenLastCalledWith({
    loading: false,
    loadingMore: false,
    error: false,
    hasMore: true,
    totalCount: 12,
    loadedCount: 5,
  });
});

test("onStateChange reports loadingMore while appending a page", async () => {
  const user = userEvent.setup();
  const { fetchRows, requests } = mockFetchRows();
  const onStateChange = jest.fn();
  render(
    <UniversalTable
      headers={headers}
      name="Users"
      fetchRows={fetchRows}
      onStateChange={onStateChange}
    />,
  );

  await act(async () => {
    requests[0].resolve({ rows: makeRows(1), totalCount: 12 });
  });

  await user.click(screen.getByRole("button", { name: /next page/i }));
  expect(onStateChange).toHaveBeenLastCalledWith({
    loading: false,
    loadingMore: true,
    error: false,
    hasMore: true,
    totalCount: 12,
    loadedCount: 5,
  });

  await act(async () => {
    requests[1].resolve({ rows: makeRows(2), totalCount: 12 });
  });
  expect(onStateChange).toHaveBeenLastCalledWith({
    loading: false,
    loadingMore: false,
    error: false,
    hasMore: true,
    totalCount: 12,
    loadedCount: 10,
  });
});

test("onStateChange reports the error state on a failed full load", async () => {
  const { fetchRows, requests } = mockFetchRows();
  const onStateChange = jest.fn();
  render(
    <UniversalTable
      headers={headers}
      name="Users"
      fetchRows={fetchRows}
      onStateChange={onStateChange}
    />,
  );

  await act(async () => {
    requests[0].reject(new Error("boom"));
  });

  expect(onStateChange).toHaveBeenLastCalledWith({
    loading: false,
    loadingMore: false,
    error: true,
    hasMore: false,
    totalCount: null,
    loadedCount: 0,
  });
});

test("onStateChange is never called in sync mode", async () => {
  const onStateChange = jest.fn();
  render(
    <UniversalTable
      headers={headers}
      name="Sync"
      data={[{ name: "Local", email: "l@x.com" }]}
      loading={false}
      onStateChange={onStateChange}
    />,
  );

  await act(async () => {});
  expect(onStateChange).not.toHaveBeenCalled();
});

test("bumping loadMoreSignal appends the next page", async () => {
  const user = userEvent.setup();
  const { fetchRows, requests } = mockFetchRows();
  const { rerender } = render(
    <UniversalTable
      headers={headers}
      name="Users"
      fetchRows={fetchRows}
      loadMoreSignal={0}
    />,
  );

  await act(async () => {
    requests[0].resolve({ rows: makeRows(1), totalCount: 12 });
  });
  expect(fetchRows).toHaveBeenCalledTimes(1);

  // Same value → no fetch
  rerender(
    <UniversalTable
      headers={headers}
      name="Users"
      fetchRows={fetchRows}
      loadMoreSignal={0}
    />,
  );
  expect(fetchRows).toHaveBeenCalledTimes(1);

  // Bump → append the next server page
  rerender(
    <UniversalTable
      headers={headers}
      name="Users"
      fetchRows={fetchRows}
      loadMoreSignal={1}
    />,
  );
  expect(fetchRows).toHaveBeenCalledTimes(2);
  expect(lastQuery(fetchRows).filters.page).toBe(2);

  await act(async () => {
    requests[1].resolve({ rows: makeRows(2), totalCount: 12 });
  });
  // The appended page is now viewable without another request
  await user.click(screen.getByRole("button", { name: /next page/i }));
  expect(screen.getByText("User 6")).toBeInTheDocument();
  expect(fetchRows).toHaveBeenCalledTimes(2);
});

test("loadMoreSignal is ignored in sync mode", async () => {
  const setLoading = jest.fn();
  const props = {
    headers,
    name: "Sync",
    data: [{ name: "Local", email: "l@x.com" }],
    loading: false,
    setLoading,
  };
  const { rerender } = render(
    <UniversalTable {...props} loadMoreSignal={0} />,
  );
  await act(async () => {});
  rerender(<UniversalTable {...props} loadMoreSignal={1} />);
  await act(async () => {});

  expect(setLoading).not.toHaveBeenCalled();
  expect(screen.getByText(/1–1 of 1/i)).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// Mode isolation: sync mode unaffected
// ---------------------------------------------------------------------------

test("sync mode renders local data without triggering a data callback", () => {
  const setLoading = jest.fn();
  render(
    <UniversalTable
      headers={headers}
      name="Sync"
      data={[{ name: "Local", email: "l@x.com" }]}
      loading={false}
      setLoading={setLoading}
    />,
  );
  expect(setLoading).not.toHaveBeenCalled();
  expect(screen.getByText(/1–1 of 1/i)).toBeInTheDocument();
});
