import { measureMediaDimensions } from "@/lib/utils/measureMedia";

/**
 * jsdom has no real decode pipeline: an <img>/<video> src assignment never
 * fires load or error on its own. Each test therefore installs a stub that
 * fires the event it wants on the next tick, which is exactly the seam the
 * helper was extracted for.
 */
function stubImage(behavior: (image: HTMLImageElement) => void) {
  class StubImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    naturalWidth = 0;
    naturalHeight = 0;
    set src(_value: string) {
      setTimeout(() => behavior(this as unknown as HTMLImageElement), 0);
    }
  }
  (window as unknown as { Image: unknown }).Image = StubImage;
}

function stubVideoElement(behavior: (video: HTMLVideoElement) => void) {
  const original = document.createElement.bind(document);
  jest
    .spyOn(document, "createElement")
    .mockImplementation((tagName: string, options?: ElementCreationOptions) => {
      if (tagName !== "video") return original(tagName, options);
      const video = {
        preload: "",
        videoWidth: 0,
        videoHeight: 0,
        onloadedmetadata: null as (() => void) | null,
        onerror: null as (() => void) | null,
        set src(_value: string) {
          setTimeout(() => behavior(video as unknown as HTMLVideoElement), 0);
        },
      };
      return video as unknown as HTMLElement;
    });
}

describe("measureMediaDimensions", () => {
  const originalImage = window.Image;
  let createObjectURL: jest.Mock;
  let revokeObjectURL: jest.Mock;

  beforeEach(() => {
    createObjectURL = jest.fn().mockReturnValue("blob:stub");
    revokeObjectURL = jest.fn();
    URL.createObjectURL = createObjectURL as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = revokeObjectURL as unknown as typeof URL.revokeObjectURL;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    (window as unknown as { Image: unknown }).Image = originalImage;
  });

  it("reads an image's intrinsic dimensions", async () => {
    stubImage((image) => {
      Object.assign(image, { naturalWidth: 1920, naturalHeight: 1080 });
      image.onload?.(new Event("load") as never);
    });

    const file = new File([new Uint8Array(10)], "hero.jpg", { type: "image/jpeg" });
    await expect(measureMediaDimensions(file)).resolves.toEqual({
      width: 1920,
      height: 1080,
    });
  });

  it("reads a video's intrinsic dimensions from its metadata", async () => {
    stubVideoElement((video) => {
      Object.assign(video, { videoWidth: 1280, videoHeight: 720 });
      video.onloadedmetadata?.(new Event("loadedmetadata") as never);
    });

    const file = new File([new Uint8Array(10)], "hero.mp4", { type: "video/mp4" });
    await expect(measureMediaDimensions(file)).resolves.toEqual({
      width: 1280,
      height: 720,
    });
  });

  it("resolves null when the browser cannot decode the file", async () => {
    stubImage((image) => image.onerror?.(new Event("error") as never));

    const file = new File([new Uint8Array(10)], "broken.png", { type: "image/png" });
    await expect(measureMediaDimensions(file)).resolves.toBeNull();
  });

  it("resolves null when a video's metadata fails to load", async () => {
    stubVideoElement((video) => video.onerror?.(new Event("error") as never));

    const file = new File([new Uint8Array(10)], "broken.mp4", { type: "video/mp4" });
    await expect(measureMediaDimensions(file)).resolves.toBeNull();
  });

  it("revokes the object URL it created, even on failure", async () => {
    stubImage((image) => image.onerror?.(new Event("error") as never));

    await measureMediaDimensions(
      new File([new Uint8Array(10)], "broken.png", { type: "image/png" })
    );

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:stub");
  });
});
