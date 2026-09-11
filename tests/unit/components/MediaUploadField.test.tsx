import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MediaUploadField } from "@/components/admin/MediaUploadField";

jest.mock("@/lib/utils/uploadMedia", () => ({
  uploadMedia: jest.fn(),
  MediaUploadError: class MediaUploadError extends Error {},
}));
jest.mock("@/lib/utils/measureMedia", () => ({
  measureMediaDimensions: jest.fn(),
}));

import { uploadMedia } from "@/lib/utils/uploadMedia";
import { measureMediaDimensions } from "@/lib/utils/measureMedia";

const uploadMediaMock = uploadMedia as jest.Mock;
const measureMock = measureMediaDimensions as jest.Mock;

function pickFile(name = "hero.jpg", type = "image/jpeg") {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File([new Uint8Array(10)], name, { type });
  fireEvent.change(input, { target: { files: [file] } });
  return file;
}

describe("MediaUploadField", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    measureMock.mockResolvedValue({ width: 1920, height: 1080 });
    uploadMediaMock.mockResolvedValue({
      key: "hero/2026-08-25/uuid.jpg",
      url: "/api/media/public/hero/2026-08-25/uuid.jpg",
      mediaType: "image",
    });
  });

  describe("preview", () => {
    it("shows an empty state when no media is set", () => {
      render(<MediaUploadField onChange={jest.fn()} namespace="hero" allowVideo />);
      expect(screen.getByText(/chưa có ảnh\/video/i)).toBeInTheDocument();
    });

    it("renders an <img> for an image key", () => {
      render(
        <MediaUploadField
          mediaKey="hero/a.jpg"
          mediaType="image"
          onChange={jest.fn()}
          namespace="hero"
          allowVideo
        />
      );
      const img = screen.getByTestId("media-preview-image");
      expect(img).toHaveAttribute("src", "/api/media/public/hero/a.jpg");
      expect(screen.queryByTestId("media-preview-video")).not.toBeInTheDocument();
    });

    it("renders a <video> for a video key", () => {
      render(
        <MediaUploadField
          mediaKey="hero/a.mp4"
          mediaType="video"
          onChange={jest.fn()}
          namespace="hero"
          allowVideo
        />
      );
      const video = screen.getByTestId("media-preview-video");
      expect(video).toHaveAttribute("src", "/api/media/public/hero/a.mp4");
      expect(screen.queryByTestId("media-preview-image")).not.toBeInTheDocument();
    });

    it("previews on a 16:9 stage", () => {
      render(<MediaUploadField onChange={jest.fn()} namespace="hero" allowVideo />);
      expect(screen.getByTestId("media-preview").className).toContain("aspect-video");
    });
  });

  describe("accepted file types", () => {
    it("accepts video only when allowVideo is set", () => {
      const { unmount } = render(
        <MediaUploadField onChange={jest.fn()} namespace="hero" allowVideo />
      );
      let input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input.accept).toContain("video/mp4");
      expect(input.accept).toContain("video/webm");
      unmount();

      render(<MediaUploadField onChange={jest.fn()} namespace="beers" />);
      input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input.accept).not.toContain("video");
      expect(input.accept).toContain("image/jpeg");
    });
  });

  describe("uploading", () => {
    it("uploads into the given namespace and reports key + mediaType back", async () => {
      const onChange = jest.fn();
      render(<MediaUploadField onChange={onChange} namespace="hero" allowVideo />);

      pickFile();

      await waitFor(() => expect(onChange).toHaveBeenCalled());
      expect(uploadMediaMock).toHaveBeenCalledWith(expect.any(File), {
        namespace: "hero",
        allowVideo: true,
      });
      expect(onChange).toHaveBeenCalledWith({
        key: "hero/2026-08-25/uuid.jpg",
        mediaType: "image",
      });
    });

    it("passes a video's mediaType through to the caller", async () => {
      uploadMediaMock.mockResolvedValue({
        key: "hero/2026-08-25/uuid.mp4",
        url: "/api/media/public/hero/2026-08-25/uuid.mp4",
        mediaType: "video",
      });
      const onChange = jest.fn();
      render(<MediaUploadField onChange={onChange} namespace="hero" allowVideo />);

      pickFile("clip.mp4", "video/mp4");

      await waitFor(() =>
        expect(onChange).toHaveBeenCalledWith({
          key: "hero/2026-08-25/uuid.mp4",
          mediaType: "video",
        })
      );
    });

    it("surfaces an upload failure and does not report a key", async () => {
      uploadMediaMock.mockRejectedValue(new Error("Tải tệp lên thất bại."));
      const onChange = jest.fn();
      render(<MediaUploadField onChange={onChange} namespace="hero" allowVideo />);

      pickFile();

      await waitFor(() =>
        expect(screen.getByText("Tải tệp lên thất bại.")).toBeInTheDocument()
      );
      expect(onChange).not.toHaveBeenCalled();
    });

    it("clears the media when the remove button is used", () => {
      const onChange = jest.fn();
      render(
        <MediaUploadField
          mediaKey="hero/a.jpg"
          onChange={onChange}
          namespace="hero"
          allowVideo
        />
      );

      fireEvent.click(screen.getByRole("button", { name: /xóa tệp/i }));

      expect(onChange).toHaveBeenCalledWith(undefined);
    });
  });

  describe("16:9 warning", () => {
    it("warns but still uploads when the file is not 16:9", async () => {
      measureMock.mockResolvedValue({ width: 1000, height: 1000 });
      const onChange = jest.fn();
      render(
        <MediaUploadField onChange={onChange} namespace="hero" allowVideo warnOnNon16x9 />
      );

      pickFile();

      const warning = await screen.findByRole("status");
      expect(warning).toHaveTextContent(/1:1/);
      expect(warning).toHaveTextContent(/1000×1000/);
      expect(warning).toHaveTextContent(/không phải 16:9/i);
      // "Warn but allow" — the upload is not blocked.
      await waitFor(() => expect(onChange).toHaveBeenCalled());
      expect(uploadMediaMock).toHaveBeenCalled();
    });

    it("stays silent for a 16:9 file", async () => {
      const onChange = jest.fn();
      render(
        <MediaUploadField onChange={onChange} namespace="hero" allowVideo warnOnNon16x9 />
      );

      pickFile();

      await waitFor(() => expect(onChange).toHaveBeenCalled());
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("stays silent when the dimensions cannot be measured", async () => {
      measureMock.mockResolvedValue(null);
      const onChange = jest.fn();
      render(
        <MediaUploadField onChange={onChange} namespace="hero" allowVideo warnOnNon16x9 />
      );

      pickFile();

      await waitFor(() => expect(onChange).toHaveBeenCalled());
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("does not measure at all when the check is off", async () => {
      const onChange = jest.fn();
      render(<MediaUploadField onChange={onChange} namespace="beers" />);

      pickFile();

      await waitFor(() => expect(onChange).toHaveBeenCalled());
      expect(measureMock).not.toHaveBeenCalled();
    });

    it("clears a previous warning when a new file is picked", async () => {
      measureMock.mockResolvedValueOnce({ width: 1000, height: 1000 });
      render(
        <MediaUploadField onChange={jest.fn()} namespace="hero" allowVideo warnOnNon16x9 />
      );

      pickFile();
      await screen.findByRole("status");

      measureMock.mockResolvedValueOnce({ width: 1920, height: 1080 });
      pickFile();

      await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    });
  });
});
