import React from "react";
import { render } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import CATMEAuditResults from "main/components/CATME/CATMEAuditResults";

test("multiple audit rows have unique React keys", () => {
  const consoleSpy = vi
    .spyOn(console, "error")
    .mockImplementation(() => {});

  const result = {
    studentsToUpdate: [
      {
        studentId: "1001",
        name: "Alice Smith",
        field: "Name",
        oldValue: "Alice S",
        newValue: "Alice Smith",
      },
      {
        studentId: "1002",
        name: "Bob Jones",
        field: "Section",
        oldValue: "A",
        newValue: "B",
      },
    ],
    studentsToDrop: [
      {
        studentId: "1003",
        name: "Carol Lee",
        email: "carol@example.com",
        section: "A",
      },
      {
        studentId: "1004",
        name: "David Kim",
        email: "david@example.com",
        section: "B",
      },
    ],
  };

  try {
    render(<CATMEAuditResults result={result} />);

    const hasDuplicateKeyWarning = consoleSpy.mock.calls.some((args) =>
      args.some((arg) => String(arg).includes("same key")),
    );

    expect(hasDuplicateKeyWarning).toBe(false);
  } finally {
    consoleSpy.mockRestore();
  }
});
