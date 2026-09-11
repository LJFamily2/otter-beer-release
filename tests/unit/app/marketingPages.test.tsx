import { render } from "@testing-library/react";
import AboutPage from "@/app/[locale]/(marketing)/about/page";
import MenuPage from "@/app/[locale]/(marketing)/menu/page";
import ContactPage from "@/app/[locale]/(marketing)/contact/page";

jest.mock("next/image", () => ({
  __esModule: true,
  default: () => <img alt="Mocked Image" />,
}));

describe("Marketing Pages Smoke Test", () => {
  it("renders About page without crashing", () => {
    const { container } = render(<AboutPage params={Promise.resolve({ locale: "en" })} />);
    expect(container).toBeTruthy();
  });

  it("renders Menu page without crashing", () => {
    const { container } = render(<MenuPage params={Promise.resolve({ locale: "en" })} />);
    expect(container).toBeTruthy();
  });

  it("renders Contact page without crashing", () => {
    const { container } = render(<ContactPage params={Promise.resolve({ locale: "en" })} />);
    expect(container).toBeTruthy();
  });
});
