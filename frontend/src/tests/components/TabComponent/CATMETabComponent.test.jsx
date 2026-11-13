import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import CATMETabComponent from "main/components/TabComponent/CATMETabComponent";

describe("CATMETabComponent tests", () => {
  const testId = "TestPrefix";
  let originalOpen;

  beforeEach(() => {
    originalOpen = window.open;
  });

  afterEach(() => {
    window.open = originalOpen;
  });

  test("renders the CATME roster card and download button", () => {
    render(<CATMETabComponent courseId={7} testIdPrefix={testId} />);

    expect(
      screen.getByTestId(`${testId}-catme-tab-component`),
    ).toBeInTheDocument();
    expect(screen.getByText("CATME Roster")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Download the course roster as a CSV file in the format CATME expects for importing students.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`${testId}-catme-download-csv-button`),
    ).toHaveTextContent("Download CSV Roster in CATME format");
  });

  test("clicking the download button opens the CATME CSV endpoint for the course", async () => {
    const openMock = vi.fn();
    window.open = openMock;
    const user = userEvent.setup();

    render(<CATMETabComponent courseId={7} testIdPrefix={testId} />);

    await user.click(
      screen.getByTestId(`${testId}-catme-download-csv-button`),
    );

    expect(openMock).toHaveBeenCalledTimes(1);
    expect(openMock).toHaveBeenCalledWith(
      "/api/csv/catme?courseId=7",
      "_blank",
    );
  });
});
