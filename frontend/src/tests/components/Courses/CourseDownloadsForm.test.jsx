import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import CourseDownloadsForm from "main/components/Courses/CourseDownloadsForm";

describe("CourseDownloadsForm tests", () => {
  test("downloads students and combined teams through their respective actions", () => {
    const downloadAction = vi.fn();
    const downloadCombinedTeamsAction = vi.fn();
    render(
      <CourseDownloadsForm
        downloadAction={downloadAction}
        downloadCombinedTeamsAction={downloadCombinedTeamsAction}
        testIdPrefix="course-downloads"
      />,
    );

    expect(
      screen.getByTestId("course-downloads-downloads-header"),
    ).toHaveTextContent("Course Downloads");
    const combinedTeamsButton = screen.getByTestId(
      "course-downloads-btn-download-combined-teams-csv",
    );
    expect(combinedTeamsButton).toHaveAccessibleName(
      "Download Combined Team CSV",
    );
    fireEvent.click(combinedTeamsButton);
    expect(downloadCombinedTeamsAction).toHaveBeenCalledTimes(1);
    expect(downloadAction).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByTestId("course-downloads-btn-download-students-csv"),
    );
    expect(downloadAction).toHaveBeenCalledTimes(1);
    expect(downloadCombinedTeamsAction).toHaveBeenCalledTimes(1);
  });
});
