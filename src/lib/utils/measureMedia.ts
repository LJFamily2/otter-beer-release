export interface MediaDimensions {
  width: number;
  height: number;
}

/**
 * Reads the intrinsic pixel dimensions of a picked file, before it is
 * uploaded anywhere, so the admin can be told the aspect ratio is off.
 *
 * Returns null whenever the browser can't decode the file (a corrupt image,
 * a codec it doesn't support, a jsdom-like environment with no real media
 * pipeline). Callers treat null as "unknown" and skip the ratio warning
 * rather than blocking the upload — the check is advisory.
 *
 * Kept out of the component so it can be unit-tested and stubbed
 * independently of React: the DOM decode paths below never run under jsdom.
 */
export async function measureMediaDimensions(
  file: File
): Promise<MediaDimensions | null> {
  const isVideo = file.type.startsWith("video/");
  const objectUrl = URL.createObjectURL(file);

  try {
    return await new Promise<MediaDimensions | null>((resolve) => {
      // A decode that never settles (a truncated file can do this) would
      // otherwise leave the upload button spinning forever.
      const timeout = setTimeout(() => resolve(null), 10_000);
      const settle = (dimensions: MediaDimensions | null) => {
        clearTimeout(timeout);
        resolve(dimensions);
      };

      if (isVideo) {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () =>
          settle({ width: video.videoWidth, height: video.videoHeight });
        video.onerror = () => settle(null);
        video.src = objectUrl;
        return;
      }

      const image = new window.Image();
      image.onload = () =>
        settle({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => settle(null);
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
