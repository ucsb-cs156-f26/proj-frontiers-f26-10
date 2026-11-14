import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import CATMETabComponent from "main/components/TabComponent/CATMETabComponent";

describe("CATMETabComponent tests", () => {
  test("renders the placeholder text", () => {
    render(<CATMETabComponent testIdPrefix="TestPrefix" />);

    const tab = screen.getByTestId("TestPrefix-catme-tab-component");
    expect(tab).toHaveTextContent("CATME features coming soon");
  });
});
