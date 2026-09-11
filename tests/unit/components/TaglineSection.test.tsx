import { render, screen } from "@testing-library/react";
import { TaglineSection } from "@/components/sections/TaglineSection";

describe("TaglineSection Component", () => {
  it("renders the headline 'Every Sip Tells a Story'", () => {
    render(<TaglineSection locale="en" />);

    expect(
      screen.getByRole("heading", { name: /every sip tells a story/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/every flavor carries a story of the land/i)
    ).toBeInTheDocument();
  });

  it("renders Vietnamese description when locale is 'vi'", () => {
    render(<TaglineSection locale="vi" />);

    expect(
      screen.getByRole("heading", { name: /mỗi ngụm bia, một câu chuyện/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/mỗi hương vị đều mang theo câu chuyện/i)
    ).toBeInTheDocument();
  });
});
