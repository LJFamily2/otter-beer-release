import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import {
  HeroSlidesForm,
  type HeroSlideFormState,
} from "@/app/(admin)/admin/(protected)/hero/HeroSlidesForm";
import { MAX_HERO_SLIDES } from "@/config/heroSlide";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

// The media field's own behavior is covered in MediaUploadField.test.tsx;
// here it is stubbed down to a button that reports a fixed upload result, so
// these tests exercise the form's slide list rather than the upload flow.
jest.mock("@/components/admin/MediaUploadField", () => ({
  MediaUploadField: ({
    mediaKey,
    onChange,
  }: {
    mediaKey?: string;
    onChange: (v: { key: string; mediaType: "image" | "video" } | undefined) => void;
  }) => (
    <div>
      <span data-testid="stub-media-key">{mediaKey ?? "none"}</span>
      <button
        type="button"
        onClick={() => onChange({ key: "hero/uploaded.jpg", mediaType: "image" })}
      >
        stub-upload-image
      </button>
      <button
        type="button"
        onClick={() => onChange({ key: "hero/uploaded.mp4", mediaType: "video" })}
      >
        stub-upload-video
      </button>
    </div>
  ),
}));

function existingSlide(overrides: Partial<HeroSlideFormState> = {}): HeroSlideFormState {
  return {
    key: "existing-0",
    mediaKey: "hero/a.jpg",
    mediaType: "image",
    status: "published",
    translations: { vi: { alt: "Alt tiếng Việt" }, en: { alt: "English alt" } },
    ...overrides,
  };
}

function mockFetchOk() {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ slides: [] }),
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: /lưu thay đổi/i }));
}

/**
 * `Select` is a custom listbox, not a native <select> — open the trigger by
 * its id, then click the option. See src/components/ui/Select.tsx.
 */
function chooseStatus(slideKey: string, optionLabel: string) {
  fireEvent.click(document.querySelector(`#status-${slideKey}`) as HTMLElement);
  fireEvent.click(screen.getByRole("option", { name: optionLabel }));
}

/** `Tabs` renders plain buttons rather than role="tab". */
function switchLocale(label: RegExp) {
  fireEvent.click(screen.getByRole("button", { name: label }));
}

describe("HeroSlidesForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("empty state", () => {
    it("prompts to add the first slide", () => {
      render(<HeroSlidesForm initialSlides={[]} canEdit />);
      expect(screen.getByText(/chưa có slide nào/i)).toBeInTheDocument();
    });

    it("saves an empty slide list, which clears the carousel", async () => {
      const fetchMock = mockFetchOk();
      render(<HeroSlidesForm initialSlides={[]} canEdit />);

      submit();

      await waitFor(() => expect(fetchMock).toHaveBeenCalled());
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("/api/hero-section");
      expect(init.method).toBe("PUT");
      expect(JSON.parse(init.body)).toEqual({ slides: [] });
    });
  });

  describe("slide list editing", () => {
    it("adds a slide", () => {
      render(<HeroSlidesForm initialSlides={[]} canEdit />);
      fireEvent.click(screen.getByRole("button", { name: /thêm slide/i }));
      expect(screen.getByText("Slide 1")).toBeInTheDocument();
    });

    it("removes a slide", () => {
      render(<HeroSlidesForm initialSlides={[existingSlide()]} canEdit />);
      fireEvent.click(screen.getByRole("button", { name: /xóa slide 1/i }));
      expect(screen.getByText(/chưa có slide nào/i)).toBeInTheDocument();
    });

    it("stops adding slides at the cap", () => {
      const slides = Array.from({ length: MAX_HERO_SLIDES }, (_, i) =>
        existingSlide({ key: `existing-${i}` })
      );
      render(<HeroSlidesForm initialSlides={slides} canEdit />);
      expect(screen.getByRole("button", { name: /thêm slide/i })).toBeDisabled();
    });

    it("reorders slides and persists the new order", async () => {
      const fetchMock = mockFetchOk();
      render(
        <HeroSlidesForm
          initialSlides={[
            existingSlide({ key: "a", mediaKey: "hero/first.jpg" }),
            existingSlide({ key: "b", mediaKey: "hero/second.jpg" }),
          ]}
          canEdit
        />
      );

      fireEvent.click(screen.getByRole("button", { name: /di chuyển slide 2 lên/i }));
      submit();

      await waitFor(() => expect(fetchMock).toHaveBeenCalled());
      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.slides.map((s: { mediaKey: string }) => s.mediaKey)).toEqual([
        "hero/second.jpg",
        "hero/first.jpg",
      ]);
    });

    it("disables the move controls at each end of the list", () => {
      render(
        <HeroSlidesForm
          initialSlides={[existingSlide({ key: "a" }), existingSlide({ key: "b" })]}
          canEdit
        />
      );
      expect(screen.getByRole("button", { name: /di chuyển slide 1 lên/i })).toBeDisabled();
      expect(
        screen.getByRole("button", { name: /di chuyển slide 2 xuống/i })
      ).toBeDisabled();
    });
  });

  describe("media", () => {
    it("records the uploaded key and its media type", async () => {
      const fetchMock = mockFetchOk();
      render(<HeroSlidesForm initialSlides={[]} canEdit />);
      fireEvent.click(screen.getByRole("button", { name: /thêm slide/i }));
      fireEvent.click(screen.getAllByRole("button", { name: "stub-upload-video" })[0]);
      fireEvent.change(screen.getByLabelText(/mô tả ảnh/i), {
        target: { value: "Alt" },
      });

      submit();

      await waitFor(() => expect(fetchMock).toHaveBeenCalled());
      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.slides[0]).toMatchObject({
        mediaKey: "hero/uploaded.mp4",
        mediaType: "video",
      });
    });

    it("labels a slide by its media type", () => {
      render(<HeroSlidesForm initialSlides={[existingSlide({ mediaType: "video" })]} canEdit />);
      expect(screen.getByText("Video")).toBeInTheDocument();
    });
  });

  describe("per-slide status", () => {
    it("defaults a new slide to draft", () => {
      render(<HeroSlidesForm initialSlides={[]} canEdit />);
      fireEvent.click(screen.getByRole("button", { name: /thêm slide/i }));

      // Shown twice: once as the slide's status badge, once as the select's
      // current value.
      expect(screen.getAllByText("Bản nháp").length).toBeGreaterThan(0);
      expect(screen.queryByText("Đã xuất bản")).not.toBeInTheDocument();
    });

    it("publishes a single slide without touching the others", async () => {
      const fetchMock = mockFetchOk();
      render(
        <HeroSlidesForm
          initialSlides={[
            existingSlide({ key: "a", status: "draft", mediaKey: "hero/a.jpg" }),
            existingSlide({ key: "b", status: "draft", mediaKey: "hero/b.jpg" }),
          ]}
          canEdit
        />
      );

      chooseStatus("a", "Xuất bản");
      submit();

      await waitFor(() => expect(fetchMock).toHaveBeenCalled());
      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.slides.map((s: { status: string }) => s.status)).toEqual([
        "published",
        "draft",
      ]);
    });
  });

  describe("validation", () => {
    it("blocks a save when a slide has no media", async () => {
      const fetchMock = mockFetchOk();
      render(<HeroSlidesForm initialSlides={[]} canEdit />);
      fireEvent.click(screen.getByRole("button", { name: /thêm slide/i }));
      fireEvent.change(screen.getByLabelText(/mô tả ảnh/i), { target: { value: "Alt" } });

      submit();

      expect(await screen.findByText(/cần tải ảnh hoặc video/i)).toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("blocks a save when the required vi alt text is empty", () => {
      const fetchMock = mockFetchOk();
      render(
        <HeroSlidesForm
          initialSlides={[existingSlide({ translations: { vi: { alt: "" }, en: { alt: "" } } })]}
          canEdit
        />
      );

      submit();

      // The alt input is marked `required`, so the browser's own constraint
      // validation stops this one before the submit handler runs — same as
      // BrandStoryForm's required title field.
      expect((screen.getByLabelText(/mô tả ảnh/i) as HTMLInputElement).validity.valueMissing).toBe(
        true
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("blocks a save when the required vi alt text is only whitespace", async () => {
      const fetchMock = mockFetchOk();
      render(
        <HeroSlidesForm
          initialSlides={[existingSlide({ translations: { vi: { alt: "   " }, en: { alt: "" } } })]}
          canEdit
        />
      );

      submit();

      // Whitespace satisfies the browser's `required` check, so this is the
      // case the form's own validation has to catch.
      expect(await screen.findByText(/cần nhập mô tả ảnh/i)).toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("names the slide the problem is in", async () => {
      render(
        <HeroSlidesForm
          initialSlides={[
            existingSlide({ key: "a" }),
            existingSlide({ key: "b", mediaKey: undefined }),
          ]}
          canEdit
        />
      );

      submit();

      expect(await screen.findByText(/slide 2: cần tải ảnh hoặc video/i)).toBeInTheDocument();
    });
  });

  describe("payload", () => {
    it("submits only locales that have alt text filled in", async () => {
      const fetchMock = mockFetchOk();
      render(
        <HeroSlidesForm
          initialSlides={[existingSlide({ translations: { vi: { alt: "Chỉ tiếng Việt" }, en: { alt: "" } } })]}
          canEdit
        />
      );

      submit();

      await waitFor(() => expect(fetchMock).toHaveBeenCalled());
      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.slides[0].translations).toEqual([
        { locale: "vi", alt: "Chỉ tiếng Việt" },
      ]);
    });

    it("submits both locales when both are filled in", async () => {
      const fetchMock = mockFetchOk();
      render(<HeroSlidesForm initialSlides={[existingSlide()]} canEdit />);

      submit();

      await waitFor(() => expect(fetchMock).toHaveBeenCalled());
      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.slides[0].translations).toEqual([
        { locale: "vi", alt: "Alt tiếng Việt" },
        { locale: "en", alt: "English alt" },
      ]);
    });

    it("trims whitespace from alt text", async () => {
      const fetchMock = mockFetchOk();
      render(
        <HeroSlidesForm
          initialSlides={[existingSlide({ translations: { vi: { alt: "  Otter  " }, en: { alt: "" } } })]}
          canEdit
        />
      );

      submit();

      await waitFor(() => expect(fetchMock).toHaveBeenCalled());
      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.slides[0].translations[0].alt).toBe("Otter");
    });

    it("edits alt text per locale independently", async () => {
      const fetchMock = mockFetchOk();
      render(<HeroSlidesForm initialSlides={[existingSlide()]} canEdit />);

      switchLocale(/tiếng anh/i);
      fireEvent.change(screen.getByLabelText(/mô tả ảnh/i), {
        target: { value: "Updated English" },
      });
      submit();

      await waitFor(() => expect(fetchMock).toHaveBeenCalled());
      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.slides[0].translations).toEqual([
        { locale: "vi", alt: "Alt tiếng Việt" },
        { locale: "en", alt: "Updated English" },
      ]);
    });
  });

  describe("server errors", () => {
    it("surfaces field errors returned by the API", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: "Dữ liệu không hợp lệ.",
          details: { formErrors: ["Không được vượt quá 12 slide"], fieldErrors: {} },
        }),
      }) as unknown as typeof fetch;
      render(<HeroSlidesForm initialSlides={[existingSlide()]} canEdit />);

      submit();

      expect(
        await screen.findByText(/không được vượt quá 12 slide/i)
      ).toBeInTheDocument();
    });

    it("shows a confirmation after a successful save", async () => {
      mockFetchOk();
      render(<HeroSlidesForm initialSlides={[existingSlide()]} canEdit />);

      submit();

      expect(await screen.findByText(/^đã lưu\.$/i)).toBeInTheDocument();
    });
  });

  describe("read-only access", () => {
    it("hides the add and save controls without edit rights", () => {
      render(<HeroSlidesForm initialSlides={[existingSlide()]} canEdit={false} />);
      expect(screen.queryByRole("button", { name: /thêm slide/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /lưu thay đổi/i })).not.toBeInTheDocument();
    });

    it("still renders the existing slides for viewing", () => {
      render(<HeroSlidesForm initialSlides={[existingSlide()]} canEdit={false} />);
      const card = screen.getByText("Slide 1").closest("div") as HTMLElement;
      expect(within(card).getByText("Slide 1")).toBeInTheDocument();
    });
  });
});
