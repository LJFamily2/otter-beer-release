import { createElement, type ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "@/components/layout/Header";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: mockPush }),
}));

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: ComponentProps<"img">) => {
    return createElement("img", props);
  },
}));

describe("Header", () => {
  it("renders navigation links", () => {
    const links = [
      { label: "Sản phẩm", href: "#products" },
      { label: "Blogs", href: "/blog" },
      { label: "Tin tức", href: "#news" },
    ];

    render(<Header links={links} />);

    expect(
      screen.getByRole("navigation", { name: "Primary navigation" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Sản phẩm")).toBeInTheDocument();
    expect(screen.getByText("Blogs")).toBeInTheDocument();
    expect(screen.getByText("Tin tức")).toBeInTheDocument();
  });

  it("renders the contact button with default text", () => {
    render(<Header />);

    expect(screen.getByText("Liên hệ")).toBeInTheDocument();
  });

  it("renders the contact button in English when locale is ENG", () => {
    render(<Header locale="ENG" locales={["VIE", "ENG"]} />);

    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.queryByText("Liên hệ")).not.toBeInTheDocument();
  });

  it("switches to a white surface when the page is scrolled", () => {
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 120,
    });

    render(<Header />);

    const header = screen.getByRole("banner");
    const logo = screen.getByAltText("Otter Beer Logo").parentElement;

    expect(header).toHaveClass("bg-white/95");
    expect(screen.getByText("Liên hệ")).toHaveClass("bg-primary");
    expect(logo).toHaveClass(
      "h-[60px]",
      "w-[100px]",
      "sm:h-[72px]",
      "sm:w-[120px]",
    );

    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    fireEvent.scroll(window);

    expect(logo).toBeInTheDocument();
  });

  it("renders the language selector with default locale", () => {
    render(<Header locale="VIE" />);

    expect(screen.getByText("VIE")).toBeInTheDocument();
  });

  it("displays language dropdown on button click", async () => {
    const user = userEvent.setup();
    const locales = ["VIE", "ENG"];

    render(<Header locale="VIE" locales={locales} />);

    const languageButton = screen.getByLabelText("Select language");
    await user.click(languageButton);

    expect(screen.getByText(/ENG/)).toBeInTheDocument();
  });

  it("calls onLanguageChange callback when language is selected", async () => {
    const user = userEvent.setup();
    const mockOnLanguageChange = jest.fn();
    const locales = ["VIE", "ENG"];

    render(
      <Header
        locale="VIE"
        locales={locales}
        onLanguageChange={mockOnLanguageChange}
      />,
    );

    const languageButton = screen.getByLabelText("Select language");
    await user.click(languageButton);

    const engButton = screen.getByText(/ENG/);
    await user.click(engButton);

    expect(mockOnLanguageChange).toHaveBeenCalledWith("ENG");
  });

  it("navigates to the English version of the current page", async () => {
    const user = userEvent.setup();

    render(<Header locale="VIE" locales={["VIE", "ENG"]} />);

    await user.click(screen.getByLabelText("Select language"));
    await user.click(screen.getByText(/ENG/));

    expect(mockPush).toHaveBeenCalledWith("/en", { scroll: false });
  });

  it("does not scroll to top when switching language", async () => {
    const user = userEvent.setup();

    render(<Header locale="VIE" locales={["VIE", "ENG"]} />);

    await user.click(screen.getByLabelText("Select language"));
    await user.click(screen.getByText(/ENG/));

    const [, options] = mockPush.mock.calls[0];
    expect(options).toEqual({ scroll: false });
  });

  it("renders social media links", () => {
    render(<Header />);

    const instagramLink = screen.getByLabelText("Instagram");
    const facebookLink = screen.getByLabelText("Facebook");

    expect(instagramLink).toBeInTheDocument();
    expect(facebookLink).toBeInTheDocument();
    expect(instagramLink).toHaveAttribute("target", "_blank");
    expect(facebookLink).toHaveAttribute("target", "_blank");
  });

  it("renders logo link", () => {
    render(<Header />);

    const logo = screen.getByAltText("Otter Beer Logo");
    expect(logo).toBeInTheDocument();

    const logoLink = logo.closest("a");
    expect(logoLink).toHaveAttribute("aria-label", "Otter Beer");
    expect(logoLink).toHaveAttribute("href", "/");
  });

  it("uses custom links when provided", () => {
    const customLinks = [
      { label: "Custom1", href: "/custom1" },
      { label: "Custom2", href: "/custom2" },
      { label: "Custom3", href: "/custom3" },
    ];

    render(<Header links={customLinks} />);

    expect(screen.getByText("Custom1")).toBeInTheDocument();
    expect(screen.getByText("Custom2")).toBeInTheDocument();
    expect(screen.getByText("Custom3")).toBeInTheDocument();
  });

  it("uses custom contact href when provided", () => {
    const customContactHref = "/contact-page";

    render(<Header contactHref={customContactHref} />);

    const contactButton = screen.getByText("Liên hệ");
    expect(contactButton.closest("a")).toHaveAttribute(
      "href",
      customContactHref,
    );
  });

  it("renders mobile text OTTER BEER title for mobile view", () => {
    render(<Header />);

    const mobileText = screen.getByText("OTTER BEER");
    expect(mobileText).toBeInTheDocument();

    const mobileLink = mobileText.closest("a");
    expect(mobileLink).toHaveAttribute("href", "/");
  });

  /**
   * "OTTER BEER" sits in a flex row with the language selector and the menu
   * button. At ~360px the wide 0.18em tracking leaves ~15px of slack, so on a
   * narrower phone "BEER" wrapped onto a second line under "OTTER".
   */
  it("keeps the mobile OTTER BEER title on a single line", () => {
    render(<Header />);

    expect(screen.getByText("OTTER BEER")).toHaveClass("whitespace-nowrap");
  });

  it("tightens the mobile title on the narrowest screens so it cannot overflow", () => {
    render(<Header />);

    const title = screen.getByText("OTTER BEER");
    expect(title).toHaveClass("max-[380px]:tracking-[0.1em]");
    expect(title).toHaveClass("max-[340px]:text-xl");
  });

  it("toggles mobile menu drawer on circular menu button click", async () => {
    const user = userEvent.setup();
    render(<Header />);

    const menuButton = screen.getByLabelText("Open menu");
    expect(menuButton).toBeInTheDocument();

    await user.click(menuButton);

    const closeButtons = screen.getAllByLabelText("Close menu");
    expect(closeButtons.length).toBeGreaterThan(0);
  });
});
