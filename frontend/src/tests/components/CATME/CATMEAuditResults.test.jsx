import React from "react";
import { render, screen } from "@testing-library/react";
import CATMEAuditResults from "main/components/CATME/CATMEAuditResults";

describe("CATMEAuditResults", () => {
  test("shows success when no changes are needed", () => {
    render(
      <CATMEAuditResults
        result={{
          studentsToUpdate: [],
          studentsToDrop: [],
        }}
      />,
    );

    expect(
      screen.getByText("No student updates or removals were detected."),
    ).toBeInTheDocument();

    expect(screen.getByText("Students to Update (0)")).toBeInTheDocument();

    expect(screen.getByText("Students to Drop (0)")).toBeInTheDocument();
  });

  test("displays students that need updates", () => {
    const result = {
      studentsToUpdate: [
        {
          studentId: "1234567",
          name: "Alice Smith",
          field: "Section",
          oldValue: "A",
          newValue: "B",
        },
      ],
      studentsToDrop: [],
    };

    render(<CATMEAuditResults result={result} />);

    expect(screen.getByText("Students to Update (1)")).toBeInTheDocument();
    expect(screen.getByText("1234567")).toBeInTheDocument();
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Section")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  test("displays students that need removal", () => {
    const result = {
      studentsToUpdate: [],
      studentsToDrop: [
        {
          studentId: "7654321",
          name: "Bob Jones",
          email: "bob@example.com",
          section: "C",
        },
      ],
    };

    render(<CATMEAuditResults result={result} />);

    expect(screen.getByText("Students to Drop (1)")).toBeInTheDocument();
    expect(screen.getByText("7654321")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
  });
  it("handles missing student arrays", () => {
    render(<CATMEAuditResults result={{}} />);

    expect(
      screen.getByText("No student updates or removals were detected."),
    ).toBeTruthy();
  });
});
