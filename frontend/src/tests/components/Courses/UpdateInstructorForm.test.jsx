import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import UpdateInstructorForm from "main/components/Courses/UpdateInstructorForm";

describe("UpdateInstructorForm tests", () => {
  test("starts with empty fields without initial contents and requires an instructor email", async () => {
    const handleUpdateInstructor = vi.fn();
    render(
      <UpdateInstructorForm handleUpdateInstructor={handleUpdateInstructor} />,
    );

    expect(screen.getByLabelText("Course Name")).toHaveValue("");
    expect(screen.getByLabelText("Course Name")).toBeDisabled();
    expect(screen.getByLabelText("New Instructor Email")).toHaveValue("");

    fireEvent.click(screen.getByRole("button", { name: "Update Instructor" }));

    expect(
      await screen.findByText("Instructor email is required."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("New Instructor Email")).toHaveClass(
      "is-invalid",
    );
    expect(handleUpdateInstructor).not.toHaveBeenCalled();
  });
});
