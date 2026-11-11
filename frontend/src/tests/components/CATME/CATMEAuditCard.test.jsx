import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CATMEAuditCard from "main/components/CATME/CATMEAuditCard";

vi.mock("axios", () => ({
  default: { post: vi.fn() },
}));

describe("CATMEAuditCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const uploadFile = () => {
    const file = new File(["example"], "catme.csv", {
      type: "text/csv",
    });

    fireEvent.change(screen.getByTestId("catme-audit-file"), {
      target: { files: [file] },
    });

    return file;
  };

  it("disables the submit button when no file is selected", () => {
    render(<CATMEAuditCard courseId={1} />);

    expect(screen.getByTestId("catme-audit-submit").disabled).toBe(true);
  });

  it("uploads the CSV and displays results", async () => {
    axios.post.mockResolvedValue({
      data: {
        studentsToUpdate: [],
        studentsToDrop: [],
      },
    });

    render(<CATMEAuditCard courseId={42} />);

    const file = uploadFile();

    fireEvent.click(screen.getByTestId("catme-audit-submit"));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    const [url, formData, config] = axios.post.mock.calls[0];

    expect(url).toBe("/api/catme/audit");
    expect(formData.get("file")).toBe(file);
    expect(config).toEqual({ params: { courseId: 42 } });

    expect(await screen.findByTestId("catme-audit-results")).toBeTruthy();
  });

  it("shows an error when the API fails", async () => {
    axios.post.mockRejectedValue({
      response: {
        data: { message: "Invalid CSV file" },
      },
    });

    render(<CATMEAuditCard courseId={42} />);

    uploadFile();

    fireEvent.click(screen.getByTestId("catme-audit-submit"));

    const error = await screen.findByTestId("catme-audit-error");

    expect(error.textContent).toContain("Invalid CSV file");
  });

  it("shows a fallback error for network failures", async () => {
    axios.post.mockRejectedValue(new Error("Network Error"));

    render(<CATMEAuditCard courseId={42} />);

    uploadFile();

    fireEvent.click(screen.getByTestId("catme-audit-submit"));

    const error = await screen.findByTestId("catme-audit-error");

    expect(error.textContent).toContain("Unable to audit");
  });
});
