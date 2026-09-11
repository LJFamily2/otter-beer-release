import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/layout/Footer";

describe("Footer Component", () => {
  it("renders main navigation links in Vietnamese for the default locale", () => {
    render(<Footer locale="vi" />);

    expect(screen.getByRole("link", { name: /câu chuyện/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sản phẩm/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /tin tức/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /liên hệ/i })).toBeInTheDocument();
  });

  it("renders Vietnamese copyright notice and secondary links", () => {
    render(<Footer locale="vi" />);

    expect(
      screen.getByText(/© 2024 - 2026 CÔNG TY TNHH BADENBEER. NẤU BẰNG NIỀM ĐAM MÊ./i)
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /chính sách bảo mật/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /điều khoản dịch vụ/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /phân phối sỉ/i })).toBeInTheDocument();
  });

  it("renders main navigation links in English for the en locale", () => {
    render(<Footer locale="en" />);

    expect(screen.getByRole("link", { name: /our story/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /shop/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /news/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /contact/i })).toBeInTheDocument();
  });

  it("renders English copyright notice and secondary links", () => {
    render(<Footer locale="en" />);

    expect(
      screen.getByText(/© 2024 - 2026 BADENBEER Co., Ltd.. BREWED WITH PASSION./i)
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /privacy policy/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /terms of service/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /wholesale/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /contact/i })).toBeInTheDocument();
  });

  it("renders social and action icons with accessible labels", () => {
    render(<Footer locale="vi" />);

    expect(screen.getByLabelText("Facebook")).toBeInTheDocument();
    expect(screen.getByLabelText("Instagram")).toBeInTheDocument();
  });

  it("uses the theme background with primary-blue text, not a hardcoded dark fill", () => {
    render(<Footer locale="vi" />);

    const footer = screen.getByRole("contentinfo");
    expect(footer.className).toContain("bg-background");
    expect(footer.className).toContain("text-primary");
    expect(footer.className).not.toContain("bg-[#002f82]");

    const storyLink = screen.getByRole("link", { name: /câu chuyện/i });
    expect(storyLink.className).toContain("text-primary");
    expect(storyLink.className).not.toContain("text-white");
  });

  it("prepends locale for non-default locale", () => {
    render(<Footer locale="en" />);

    const storyLink = screen.getByRole("link", { name: /our story/i });
    expect(storyLink).toHaveAttribute("href", "/en#story");

    const privacyLink = screen.getByRole("link", { name: /privacy policy/i });
    expect(privacyLink).toHaveAttribute("href", "/en/privacy");
  });
});
