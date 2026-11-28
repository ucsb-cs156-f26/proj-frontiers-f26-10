import axios from "axios";
import { fireEvent, render, waitFor, screen } from "@testing-library/react";
import DownloadsTabComponent from "main/components/TabComponent/DownloadsTabComponent";
import AxiosMockAdapter from "axios-mock-adapter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, vi } from "vitest";
import coursesFixtures from "fixtures/coursesFixtures";
import * as useBackendModule from "main/utils/useBackend";

const axiosMock = new AxiosMockAdapter(axios);
const mockToast = vi.fn();

const useBackendMutationSpy = vi.spyOn(useBackendModule, "useBackendMutation");

vi.mock("react-toastify", async (importOriginal) => {
  return {
    ...(await importOriginal()),
    toast: (x) => mockToast(x),
  };
});

describe("DownloadsTabComponent tests", () => {
  beforeEach(() => {
    axiosMock.resetHistory();
    mockToast.mockClear();
  });

  afterEach(() => {
    useBackendMutationSpy.mockClear();
  });

  test("Downloads tab component and form elements render correctly", async () => {
    axiosMock.onGet("/api/courses/downloadStudentsCSV").reply(200);
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <DownloadsTabComponent
          courseId={coursesFixtures.severalCourses[0].id}
          testIdPrefix="InstructorCourseShowPage"
        />
      </QueryClientProvider>,
    );

    await screen.findByTestId("InstructorCourseShowPage-downloadsTab");

    expect(screen.getByText("Course Downloads")).toBeInTheDocument();
    expect(
      screen.getByTestId("InstructorCourseShowPage-downloads-header"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("InstructorCourseShowPage-btn-download-students-csv"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Download Combined Team CSV",
      }),
    ).toBeInTheDocument();
  });

  test("Prevents default form submission and runs download handler", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    axiosMock.onGet("/api/courses/downloadStudentsCSV").reply(200);
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <DownloadsTabComponent
          courseId={coursesFixtures.severalCourses[0].id}
          testIdPrefix="InstructorCourseShowPage"
        />
      </QueryClientProvider>,
    );

    await screen.findByTestId(
      "InstructorCourseShowPage-btn-download-students-csv",
    );

    const submitButton = screen.getByTestId(
      "InstructorCourseShowPage-btn-download-students-csv",
    );
    const form = submitButton.closest("form");
    const result = fireEvent.submit(form);

    expect(result).toBe(false);

    await waitFor(() => expect(mockToast).toHaveBeenCalled());
    expect(mockToast).toBeCalledWith("Download successfully initiated.");

    expect(consoleSpy).toHaveBeenCalledWith(
      "Frontend form submit action captured for course: 1",
    );
    consoleSpy.mockRestore();
  });
  test("Combined team CSV button downloads the selected course", async () => {
    const downloadSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    const client = new QueryClient();

    render(
      <QueryClientProvider client={client}>
        <DownloadsTabComponent
          courseId={7}
          testIdPrefix="InstructorCourseShowPage"
        />
      </QueryClientProvider>,
    );

    const downloadButton = await screen.findByRole("button", {
      name: "Download Combined Team CSV",
    });

    fireEvent.click(downloadButton);

    expect(downloadSpy).toHaveBeenCalledWith(
      "/api/csv/combinedteams?courseId=7",
      "_blank",
    );

    expect(downloadSpy).toHaveBeenCalledTimes(1);
    expect(mockToast).not.toHaveBeenCalled();

    downloadSpy.mockRestore();
  });
});
