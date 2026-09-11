import { render, screen, fireEvent } from "@testing-library/react";
import { AgeVerificationGate } from "@/components/ui/AgeVerificationGate";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe("AgeVerificationGate Component", () => {
  beforeEach(() => {
    localStorage.clear();
    // Clear cookies
    document.cookie = "otter_age_verified=; max-age=0";
  });

  describe("Vietnamese (default locale)", () => {
    it("renders Vietnamese content by default when no locale is passed", () => {
      render(<AgeVerificationGate isStandalone={true} />);

      expect(
        screen.getByRole("heading", { name: /bạn đã đủ 18 tuổi chưa\?/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /xác nhận đủ 18 tuổi/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /chưa đủ/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/sử dụng rượu bia có trách nhiệm/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/badenbeer co\., ltd\./i)
      ).toBeInTheDocument();
    });

    it("sets verification and shows Vietnamese restriction screen on clicking NO", () => {
      render(<AgeVerificationGate isStandalone={true} />);

      fireEvent.click(
        screen.getByRole("button", { name: /chưa đủ/i })
      );

      expect(
        screen.getByRole("heading", { name: /truy cập bị hạn chế/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/bạn phải đủ 18 tuổi trở lên/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /tìm hiểu thêm/i })
      ).toHaveAttribute("href", "https://www.responsibility.org");
    });
  });

  describe("English locale", () => {
    it("renders English content when locale='en'", () => {
      render(<AgeVerificationGate isStandalone={true} locale="en" />);

      expect(
        screen.getByRole("heading", { name: /are you 18\+\?/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /yes, i'm over 18/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /no, i'm underage/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/please drink responsibly/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/badenbeer co\., ltd\./i)
      ).toBeInTheDocument();
    });

    it("sets verification in localStorage and cookie on clicking YES", () => {
      const onVerified = jest.fn();
      render(
        <AgeVerificationGate
          isStandalone={false}
          locale="en"
          onVerified={onVerified}
        />
      );

      const yesBtn = screen.getByRole("button", {
        name: /yes, i'm over 18/i,
      });
      fireEvent.click(yesBtn);

      expect(localStorage.getItem("otter_age_verified")).toBe("true");
      expect(document.cookie).toContain("otter_age_verified=true");
      expect(onVerified).toHaveBeenCalledTimes(1);
    });

    it("shows responsible drinking restriction screen on clicking NO", () => {
      render(<AgeVerificationGate isStandalone={true} locale="en" />);

      const noBtn = screen.getByRole("button", { name: /no, i'm underage/i });
      fireEvent.click(noBtn);

      expect(
        screen.getByRole("heading", { name: /access restricted/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/you must be 18 years of age or older/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /learn more/i })
      ).toHaveAttribute("href", "https://www.responsibility.org");
      expect(
        screen.queryByRole("link", { name: /leave site/i })
      ).not.toBeInTheDocument();
    });

    it("allows retrying when clicking 'I made a mistake' in restriction screen", () => {
      render(<AgeVerificationGate isStandalone={true} locale="en" />);

      // Deny first
      fireEvent.click(
        screen.getByRole("button", { name: /no, i'm underage/i })
      );
      expect(
        screen.getByRole("heading", { name: /access restricted/i })
      ).toBeInTheDocument();

      // Click retry
      fireEvent.click(
        screen.getByRole("button", { name: /i made a mistake/i })
      );
      expect(
        screen.getByRole("heading", { name: /are you 18\+\?/i })
      ).toBeInTheDocument();
    });
  });
});