import React from "react";
import axios from "axios";
import { afterEach, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import CATMEAuditCard from "main/components/CATME/CATMEAuditCard";
import CATMEAuditResults from "main/components/CATME/CATMEAuditResults";

const update = {
  studentId: "1001",
  name: "Alice Smith",
  field: "Name",
  oldValue: "Alice S",
  newValue: "Alice Smith",
};

const drop = {
  studentId: "1002",
  name: "Bob Jones",
  email: "bob@example.com",
  section: "A",
};

const changes = {
  studentsToUpdate: [update],
  studentsToDrop: [drop],
};

const empty = {
  studentsToUpdate: [],
  studentsToDrop: [],
};

function selectFile(name = "students.csv") {
  const file = new File(["test"], name, { type: "text/csv" });

  fireEvent.change(screen.getByTestId("catme-audit-file"), {
    target: { files: [file] },
  });
}

function submitAudit() {
  fireEvent.click(screen.getByRole("button", { name: "Audit CSV" }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

// Initial state and submit default behavior
test("starts without errors and prevents normal form submission", () => {
  render(<CATMEAuditCard courseId={7} />);

  expect(screen.queryByTestId("catme-audit-error")).toBeNull();

  const button = screen.getByRole("button", { name: "Audit CSV" });
  expect(button.disabled).toBe(true);

  const form = button.closest("form");
  const event = new Event("submit", {
    bubbles: true,
    cancelable: true,
  });

  fireEvent(form, event);

  expect(event.defaultPrevented).toBe(true);
});

// Successful request must reset loading
test("successful audit restores the enabled submit button", async () => {
  const post = vi.spyOn(axios, "post").mockResolvedValue({
    data: changes,
  });

  render(<CATMEAuditCard courseId={7} />);

  selectFile();
  submitAudit();

  await screen.findByText("Found 1 updates and 1 removals.");

  expect(post).toHaveBeenCalledWith("/api/catme/audit", expect.any(FormData), {
    params: { courseId: 7 },
  });

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Audit CSV" }).disabled).toBe(
      false,
    );
  });
});

// Changing file must clear old results
test("selecting a new file removes previous audit results", async () => {
  vi.spyOn(axios, "post").mockResolvedValue({
    data: changes,
  });

  render(<CATMEAuditCard courseId={7} />);

  selectFile();
  submitAudit();

  await screen.findByTestId("catme-audit-results");

  selectFile("another.csv");

  expect(screen.queryByTestId("catme-audit-results")).toBeNull();
});

// Changing file must clear old errors
test("selecting a new file clears the previous error", async () => {
  vi.spyOn(axios, "post").mockRejectedValue({
    response: { data: { message: "Invalid CSV" } },
  });

  render(<CATMEAuditCard courseId={7} />);

  selectFile();
  submitAudit();

  await screen.findByText("Invalid CSV");

  selectFile("another.csv");

  expect(screen.queryByTestId("catme-audit-error")).toBeNull();
});

// Retry must clear errors immediately, not after response
test("retry clears the previous error while loading", async () => {
  const post = vi.spyOn(axios, "post");

  post.mockRejectedValueOnce({
    response: { data: { message: "First request failed" } },
  });

  post.mockImplementationOnce(() => new Promise(() => {}));

  render(<CATMEAuditCard courseId={7} />);

  selectFile();
  submitAudit();

  await screen.findByText("First request failed");

  submitAudit();

  expect(screen.queryByTestId("catme-audit-error")).toBeNull();
});

// Retry must clear previous results immediately
test("new audit clears previous results before response arrives", async () => {
  const post = vi.spyOn(axios, "post");

  post.mockResolvedValueOnce({ data: changes });
  post.mockImplementationOnce(() => new Promise(() => {}));

  render(<CATMEAuditCard courseId={7} />);

  selectFile();
  submitAudit();

  await screen.findByTestId("catme-audit-results");

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Audit CSV" }).disabled).toBe(
      false,
    );
  });

  submitAudit();

  expect(screen.queryByTestId("catme-audit-results")).toBeNull();
});

// Missing response.data must use fallback safely
test("handles an API error without response data", async () => {
  vi.spyOn(axios, "post").mockRejectedValue({
    response: { data: undefined },
  });

  render(<CATMEAuditCard courseId={7} />);

  selectFile();
  submitAudit();

  await screen.findByText(
    "Unable to audit the CSV file. Please check the file format and try again.",
  );

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Audit CSV" }).disabled).toBe(
      false,
    );
  });
});

// Both changes, update-only and drop-only all require warning
test.each([
  ["both changes", changes, "Found 1 updates and 1 removals."],
  [
    "updates only",
    { studentsToUpdate: [update], studentsToDrop: [] },
    "Found 1 updates and 0 removals.",
  ],
  [
    "drops only",
    { studentsToUpdate: [], studentsToDrop: [drop] },
    "Found 0 updates and 1 removals.",
  ],
])("%s displays a warning", (_name, result, expected) => {
  render(<CATMEAuditResults result={result} />);

  expect(screen.getByText(expected)).toBeTruthy();
  expect(
    screen.queryByText("No student updates or removals were detected."),
  ).toBeNull();
});

// Empty updates must show empty-state text, not an empty table
test("empty updates show the empty-state message", () => {
  render(<CATMEAuditResults result={empty} />);

  expect(screen.getByText("No students need updating.")).toBeTruthy();
  expect(screen.queryByRole("table")).toBeNull();
});

// Multiple rows must not generate duplicate React key warnings
test("multiple update and drop rows have unique keys", () => {
  const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  const result = {
    studentsToUpdate: [
      update,
      { ...update, studentId: "1003", field: "Section" },
    ],
    studentsToDrop: [drop, { ...drop, studentId: "1004" }],
  };

  try {
    render(<CATMEAuditResults result={result} />);

    expect(screen.getAllByRole("row")).toHaveLength(6);

    const warnings = consoleSpy.mock.calls.flat().map(String).join(" ");

    expect(warnings).not.toMatch(/same key|duplicate key/i);
  } finally {
    consoleSpy.mockRestore();
  }
});
