import { z } from "zod";
import { ALLOWED_MEDIA_CONTENT_TYPES } from "@/lib/storage/constants";
import { MEDIA_NAMESPACES } from "@/lib/storage/namespaces";

export const RequestUploadSchema = z.object({
  contentType: z.enum(
    ALLOWED_MEDIA_CONTENT_TYPES as unknown as [string, ...string[]]
  ),
  /**
   * Which module the upload belongs to. Decides both the storage folder and
   * which permission grant is checked — see src/lib/storage/namespaces.ts.
   * Defaults to news-blog so the Tiptap editor's existing calls, which
   * predate this field, keep working unchanged.
   */
  namespace: z.enum(MEDIA_NAMESPACES).default("news-blog"),
});

export const RequestViewUrlSchema = z.object({
  key: z.string().trim().min(1),
});

export const RequestDeleteSchema = z.object({
  key: z.string().trim().min(1),
});

export type RequestUploadInput = z.infer<typeof RequestUploadSchema>;
export type RequestViewUrlInput = z.infer<typeof RequestViewUrlSchema>;
export type RequestDeleteInput = z.infer<typeof RequestDeleteSchema>;
