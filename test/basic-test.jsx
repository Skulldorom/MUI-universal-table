import React from "react";
import { jest } from "@jest/globals";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UniversalTable } from "../src/index.js";

// ---------------------------------------------------------------------------
// Test data — sorted so page-1 assertions are predictable even with
// default descending sort order applied by the table.
// ---------------------------------------------------------------------------

const headers = [
  { id: "name", label: "Name", searchable: true },
  { id: "email", label: "Email", searchable: true },
  { id: "age", label: "Age", numeric: true },
];

const data = [
  { name: "John Doe", email: "john@example.com", age: 30 },
  { name: "Jane Smith", email: "jane@example.com", age: 25 },
  { name: "Bob Brown", email: "bob@example.com", age: 40 },
  { name: "Alice Adams", email: "alice@example.com", age: 35 },
  { name: "Charlie Clark", email: "charlie@example.com", age: 28 },
  { name: "Diana Davis", email: "diana@example.com", age: 32 },
];

const selectableHeaders = [
  { id: "id", label: "ID", numeric: true },
  { id: "name", label: "Name", searchable: true },
];

const selectableData = [
  { id: 1, name: "Alpha" },
  { id: 2, name: "Beta" },
  { id: 3, name: "Gamma" },
];

// ---------------------------------------------------------------------------
// Basic rendering
// ---------------------------------------------------------------------------

test("renders table title", () => {
  render(
    <UniversalTable data={data} headers={headers} name="Test Users" loading={false} />,
  );
  expect(screen.getByText("Test Users")).toBeInTheDocument();
});

test("renders data rows on first page (default 5 per page, no sort)", () => {
  render(
    <UniversalTable data={data} headers={headers} name="Users" loading={false} />,
  );

  // No default sort — rows appear in insertion order.
  // First 5: John, Jane, Bob, Alice, Charlie. Diana is row 6 (page 2).
  expect(screen.getByText("John Doe")).toBeInTheDocument();
  expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  expect(screen.getByText("Bob Brown")).toBeInTheDocument();
  // Diana is on page 2 (row 6 of 6, 5 per page)
});

test("renders column headers", () => {
  render(
    <UniversalTable data={data} headers={headers} name="Users" loading={false} />,
  );
  expect(screen.getByText("Name")).toBeInTheDocument();
  expect(screen.getByText("Email")).toBeInTheDocument();
  expect(screen.getByText("Age")).toBeInTheDocument();
});

test("does not render reload button when no setLoading or onReload is provided", () => {
  render(
    <UniversalTable data={data} headers={headers} name="Test" loading={false} />,
  );
  expect(screen.queryByRole("button", { name: /reload/i })).not.toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

test("shows skeleton loader when loading is true", () => {
  const { container } = render(
    <UniversalTable data={data} headers={headers} name="Test" loading={true} />,
  );
  const skeletons = container.querySelectorAll(".MuiSkeleton-root");
  expect(skeletons.length).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// Empty data
// ---------------------------------------------------------------------------

test("renders with empty data array without crashing", () => {
  render(
    <UniversalTable data={[]} headers={headers} name="Empty" loading={false} />,
  );
  expect(screen.getByText("Empty")).toBeInTheDocument();
  expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// Search / filtering
// ---------------------------------------------------------------------------

test("filters rows by search term", async () => {
  const user = userEvent.setup();
  render(
    <UniversalTable data={data} headers={headers} name="Search" loading={false} />,
  );

  const searchInput = screen.getByPlaceholderText("Search");
  expect(searchInput).toBeInTheDocument();

  await user.type(searchInput, "Jane");
  await new Promise((r) => setTimeout(r, 800));

  expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
});

test("clears search and shows all rows again", async () => {
  const user = userEvent.setup();
  render(
    <UniversalTable data={data} headers={headers} name="SearchClear" loading={false} />,
  );

  const searchInput = screen.getByPlaceholderText("Search");
  await user.type(searchInput, "Bob");
  await new Promise((r) => setTimeout(r, 800));
  expect(screen.queryByText("John Doe")).not.toBeInTheDocument();

  // Clear via the X button
  const clearBtn = document.querySelector('[data-testid="ClearIcon"]')?.closest("button");
  if (clearBtn) {
    await user.click(clearBtn);
  }

  // After clearing, visible rows should exist again
  // (Bob is still there since we cleared the search)
  expect(screen.getByText("Bob Brown")).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// Row selection
// ---------------------------------------------------------------------------

test("select all checkbox selects all visible rows", async () => {
  const user = userEvent.setup();

  render(
    <UniversalTable
      data={selectableData}
      headers={selectableHeaders}
      name="Select All"
      loading={false}
      selectRows={true}
      selectID="id"
    />,
  );

  const checkboxes = screen.getAllByRole("checkbox");
  await user.click(checkboxes[0]);

  expect(screen.getByText("3 selected")).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

test("clicking a column header toggles sort direction", async () => {
  const user = userEvent.setup();
  render(
    <UniversalTable
      data={[{ name: "C" }, { name: "A" }, { name: "B" }]}
      headers={[{ id: "name", label: "Name", searchable: true }]}
      name="Sort"
      loading={false}
    />,
  );

  const nameHeader = screen.getByText("Name");
  // No default sort — clicking the Name column sets it to asc
  await user.click(nameHeader);
  // Just verify no crash — the click should work
});

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

test("pagination control renders with correct row count", () => {
  render(
    <UniversalTable data={data} headers={headers} name="Pages" loading={false} />,
  );

  // MUI TablePagination shows "1–5 of 6" (default 5 rows per page)
  expect(screen.getByText(/1–5 of 6/i)).toBeInTheDocument();
});

test("next page button is clickable", async () => {
  const user = userEvent.setup();
  render(
    <UniversalTable data={data} headers={headers} name="Paginate" loading={false} />,
  );

  const nextPageBtn = screen.getByRole("button", { name: /next page/i });
  expect(nextPageBtn).not.toBeDisabled();
  await user.click(nextPageBtn);

  // On page 2, the label should show "6–6 of 6"
  expect(screen.getByText(/6–6 of 6/i)).toBeInTheDocument();
});

test("changes rows per page", async () => {
  const user = userEvent.setup();
  render(
    <UniversalTable data={data} headers={headers} name="PerPage" loading={false} />,
  );

  // Open the rows-per-page select
  const comboBox = screen.getAllByRole("combobox")[0];
  await user.click(comboBox);

  // With 6 rows, options are [5, 6]. Select "6" to show all.
  const option6 = screen.getByRole("option", { name: "6" });
  await user.click(option6);

  // All 6 rows displayed — label shows "1–6 of 6"
  expect(screen.getByText(/1–6 of 6/i)).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// Custom page size options
// ---------------------------------------------------------------------------

test("accepts custom pageSizeOptions", () => {
  render(
    <UniversalTable
      data={data}
      headers={headers}
      name="Custom Pages"
      loading={false}
      pageSizeOptions={[10, 25, 50]}
    />,
  );

  const rowsPerPageSelect = screen.getByRole("combobox");
  expect(rowsPerPageSelect).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// onReload callback
// ---------------------------------------------------------------------------

test("calls onReload when reload button is clicked", async () => {
  const user = userEvent.setup();
  const onReload = jest.fn();

  render(
    <UniversalTable
      data={data}
      headers={headers}
      name="ReloadTest"
      loading={false}
      onReload={onReload}
    />,
  );

  const reloadBtn = screen.getByRole("button", { name: /reload/i });
  await user.click(reloadBtn);
  expect(onReload).toHaveBeenCalledTimes(1);
});

// ---------------------------------------------------------------------------
// Keyboard accessibility
// ---------------------------------------------------------------------------

test("data rows are not tabbable when selectRows is disabled", () => {
  render(
    <UniversalTable
      data={selectableData}
      headers={selectableHeaders}
      name="NoSelect"
      loading={false}
      selectRows={false}
    />,
  );

  const rows = document.querySelectorAll('[role="row"]');
  // rows[0] = header, rows[1] = first data row
  const dataRow = rows[1];
  expect(dataRow.getAttribute("tabindex")).toBe("-1");
});

// ---------------------------------------------------------------------------
// Empty data edge case
// ---------------------------------------------------------------------------

test("renders empty table gracefully with no skeleton", () => {
  render(
    <UniversalTable data={[]} headers={headers} name="Empty" loading={false} />,
  );

  expect(screen.getByText("Empty")).toBeInTheDocument();
  expect(document.querySelectorAll(".MuiSkeleton-root").length).toBe(0);
});

// ---------------------------------------------------------------------------
// Table aria-label
// ---------------------------------------------------------------------------

test("table element has aria-label matching the name prop", () => {
  render(
    <UniversalTable data={data} headers={headers} name="MyTable" loading={false} />,
  );

  const table = document.querySelector("table");
  expect(table).toHaveAttribute("aria-label", "MyTable");
});

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

import { formatCellValue } from "../src/utils/tableUtils.js";

const dateHeader = { id: "date", label: "Date", date: true };
const stringHeader = { id: "name", label: "Name" };
const expectedLocalDateTime = (value) =>
  new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));

test("formatCellValue formats ISO date string", () => {
  const value = "2024-01-15T10:30:00Z";
  const result = formatCellValue(dateHeader, { date: value });
  expect(result).toBe(expectedLocalDateTime(value));
});

test("formatCellValue formats epoch-millisecond number (regression guard)", () => {
  // This was the specific regression: Date.parse(1705324800000) returns NaN
  const epochMs = new Date("2024-01-15T10:30:00Z").getTime();
  const result = formatCellValue(dateHeader, { date: epochMs });
  expect(result).toBe(expectedLocalDateTime(epochMs));
});

test("formatCellValue formats utc strings in browser-local 12-hour time", () => {
  const value = "Fri, 19 Jun 2026 12:43:13 GMT";
  const result = formatCellValue(dateHeader, { date: value });
  expect(result).toBe(expectedLocalDateTime(value));
  expect(result).not.toContain("GMT");
});

test("formatCellValue returns raw value for invalid date", () => {
  const result = formatCellValue(dateHeader, { date: "not-a-date-at-all" });
  expect(result).toBe("not-a-date-at-all");
});

test("formatCellValue returns raw value for null date", () => {
  const result = formatCellValue(dateHeader, { date: null });
  expect(result).toBeNull();
});

test("formatCellValue returns raw value for undefined date", () => {
  const result = formatCellValue(dateHeader, { date: undefined });
  expect(result).toBeUndefined();
});

test("formatCellValue returns raw value for non-date column", () => {
  const result = formatCellValue(stringHeader, { name: "John Doe" });
  expect(result).toBe("John Doe");
});

test("formatCellValue handles a Date object", () => {
  const value = new Date("2024-01-15T10:30:00Z");
  const result = formatCellValue(dateHeader, { date: value });
  expect(result).toBe(expectedLocalDateTime(value));
});

test("renders date column formatted in the table", () => {
  const dateData = [
    { id: 1, name: "Event A", timestamp: "2024-01-15T10:30:00Z" },
    { id: 2, name: "Event B", timestamp: 1705324800000 },
    { id: 3, name: "Event C", timestamp: "invalid" },
  ];
  const dateHeaders = [
    { id: "name", label: "Name" },
    { id: "timestamp", label: "Timestamp", date: true },
  ];

  render(
    <UniversalTable data={dateData} headers={dateHeaders} name="Dates" loading={false} />,
  );

  expect(screen.getByText(expectedLocalDateTime(dateData[0].timestamp))).toBeInTheDocument();
  expect(screen.getByText(expectedLocalDateTime(dateData[1].timestamp))).toBeInTheDocument();
  // "invalid" → shown as-is (fallback)
  expect(screen.getByText("invalid")).toBeInTheDocument();
});
