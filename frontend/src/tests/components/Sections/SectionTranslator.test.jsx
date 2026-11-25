import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, test, vi } from "vitest";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { Form } from "react-bootstrap";

import SectionTranslator from "main/components/Sections/SectionTranslator";
import { sectionsFixtures } from "fixtures/sectionsFixtures";
import * as backend from "main/utils/useBackend";

vi.mock("react-bootstrap", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Form: {
      ...actual.Form,
      Select: vi.fn((props) => <actual.Form.Select {...props} />),
    },
  };
});

const axiosMock = new AxiosMockAdapter(axios);

describe("SectionTranslator tests", () => {
  const queryClient = new QueryClient();

  beforeEach(() => {
    vi.clearAllMocks();
    axiosMock.reset();
    axiosMock
      .onGet("/api/courses/7/sections")
      .reply(200, sectionsFixtures.threeSections);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  test.each([7, undefined])(
    "configures the sections query for course %s",
    (courseId) => {
      const useBackend = vi.spyOn(backend, "useBackend");
      render(
        <QueryClientProvider client={queryClient}>
          <SectionTranslator courseId={courseId} onChange={vi.fn()} />
        </QueryClientProvider>,
      );

      expect(useBackend).toHaveBeenCalledWith(
        [`/api/courses/${courseId}/sections`],
        { method: "GET", url: `/api/courses/${courseId}/sections` },
        [],
        true,
        { enabled: Boolean(courseId) },
      );
    },
  );

  test("renders an empty, labeled dropdown while sections are unavailable", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SectionTranslator onChange={vi.fn()} testIdPrefix="student-section" />
      </QueryClientProvider>,
    );

    expect(screen.getByLabelText("Section Translation")).toHaveValue("");
    expect(screen.getByLabelText("Section Translation")).toHaveAttribute(
      "id",
      "student-section-translation",
    );
    expect(screen.getByLabelText("Select Section")).toHaveAttribute(
      "id",
      "student-section-select",
    );
    expect(screen.getByLabelText("Select Section")).toHaveValue("");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(axiosMock.history.get).toHaveLength(0);
  });

  test("shows only the placeholder when section data is undefined", () => {
    vi.spyOn(backend, "useBackend").mockReturnValue({ data: undefined });

    render(<SectionTranslator courseId={7} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Section Translation")).toHaveValue("");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option")).toHaveTextContent(
      "-- Select a Section --",
    );
  });

  test.each([undefined, null])(
    "keeps the dropdown controlled with an empty value for section %s",
    (section) => {
      render(
        <QueryClientProvider client={queryClient}>
          <SectionTranslator section={section} onChange={vi.fn()} />
        </QueryClientProvider>,
      );

      expect(Form.Select.mock.calls.at(-1)[0].value).toBe("");
    },
  );

  test("renders the translation for the currently selected section", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SectionTranslator courseId={7} section="0200" onChange={vi.fn()} />
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("SectionTranslator-translation")).toHaveValue(
        "Tue 10:00am",
      ),
    );
    expect(screen.getByLabelText("Select Section")).toHaveValue("0200");
  });

  test("renders a blank translation when there is no matching section", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SectionTranslator
          courseId={7}
          section="does-not-exist"
          onChange={vi.fn()}
        />
      </QueryClientProvider>,
    );

    await screen.findByTestId("SectionTranslator-select");
    expect(screen.getByTestId("SectionTranslator-translation")).toHaveValue("");
  });

  test("defaults the select to an empty value when section is undefined", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SectionTranslator courseId={7} onChange={vi.fn()} />
      </QueryClientProvider>,
    );

    const select = await screen.findByTestId("SectionTranslator-select");
    expect(select).toHaveValue("");
  });

  test("calls onChange with the raw section value when a dropdown option is selected", async () => {
    const onChange = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <SectionTranslator courseId={7} section="" onChange={onChange} />
      </QueryClientProvider>,
    );

    const select = await screen.findByTestId("SectionTranslator-select");
    await screen.findByRole("option", { name: "0300 - Tue 11:00am" });

    fireEvent.change(select, { target: { value: "0300" } });

    expect(onChange).toHaveBeenCalledWith("0300");
  });

  test("lists all sections for the course as dropdown options", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SectionTranslator courseId={7} section="" onChange={vi.fn()} />
      </QueryClientProvider>,
    );

    const select = await screen.findByTestId("SectionTranslator-select");
    await screen.findByRole("option", { name: "0100 - Tue 9:00am" });
    sectionsFixtures.threeSections.forEach((s) => {
      expect(
        screen.getByRole("option", { name: `${s.section} - ${s.label}` }),
      ).toBeInTheDocument();
    });
    expect(select).toBeInTheDocument();
  });
});
