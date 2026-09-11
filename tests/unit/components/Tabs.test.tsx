import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs } from "@/components/ui/Tabs";

const ITEMS = [
  { value: "a", label: "LON" },
  { value: "b", label: "6 LON" },
  { value: "c", label: "24 LON" },
];

describe("Tabs — segmented variant", () => {
  it("marks only the selected tab as pressed", () => {
    render(<Tabs variant="segmented" items={ITEMS} defaultValue="b" />);

    const tabs = screen.getAllByRole("button");
    expect(tabs.map((t) => t.getAttribute("aria-pressed"))).toEqual([
      "false",
      "true",
      "false",
    ]);
  });

  it("moves the selection when another tab is clicked (uncontrolled)", async () => {
    const user = userEvent.setup();
    render(<Tabs variant="segmented" items={ITEMS} />);

    expect(screen.getByRole("button", { name: "LON" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    await user.click(screen.getByRole("button", { name: "24 LON" }));

    expect(screen.getByRole("button", { name: "24 LON" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "LON" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("stays controlled: reports the change without moving on its own", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <Tabs variant="segmented" items={ITEMS} value="a" onChange={onChange} />
    );

    await user.click(screen.getByRole("button", { name: "6 LON" }));

    expect(onChange).toHaveBeenCalledWith("b");
    // The parent owns the value, so nothing moves until it passes a new one.
    expect(screen.getByRole("button", { name: "LON" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("renders the sliding fill only under the selected tab", () => {
    const { container } = render(
      <Tabs variant="segmented" items={ITEMS} defaultValue="b" />
    );

    // One fill element, and it lives inside the selected tab.
    const fills = container.querySelectorAll('span[aria-hidden="true"]');
    expect(fills).toHaveLength(1);
    expect(
      within(screen.getByRole("button", { name: "6 LON" })).getByText(
        (_, el) => el?.getAttribute("aria-hidden") === "true"
      )
    ).toBeInTheDocument();
  });

  it("keeps aria-pressed on the pill variant too", () => {
    render(<Tabs variant="pill" items={ITEMS} defaultValue="c" />);

    expect(screen.getByRole("button", { name: "24 LON" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
});
