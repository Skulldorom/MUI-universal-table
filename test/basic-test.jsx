import React from "react";
import { render, screen } from "@testing-library/react";
import { UniversalTable } from "../src/index.js";

const headers = [
  { id: "name", label: "Name", searchable: true },
  { id: "email", label: "Email", searchable: true },
  { id: "age", label: "Age", numeric: true },
];

const data = [
  { name: "John Doe", email: "john@example.com", age: 30 },
  { name: "Jane Smith", email: "jane@example.com", age: 25 },
];

test("renders UniversalTable without crashing", () => {
  render(
    <UniversalTable
      data={data}
      headers={headers}
      name="Test Users"
      loading={false}
    />,
  );
  expect(screen.getByText("Test Users")).toBeInTheDocument();
});

test("renders table rows", () => {
  render(
    <UniversalTable
      data={data}
      headers={headers}
      name="Test Users"
      loading={false}
    />,
  );
  expect(screen.getByText("John Doe")).toBeInTheDocument();
  expect(screen.getByText("Jane Smith")).toBeInTheDocument();
});

test("does not render reload button when setLoading is not provided", () => {
  render(
    <UniversalTable
      data={data}
      headers={headers}
      name="Test Users"
      loading={false}
    />,
  );

  expect(
    screen.queryByRole("button", { name: /reload/i }),
  ).not.toBeInTheDocument();
});
