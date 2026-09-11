"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useRef, useState } from "react";
import { uploadImage } from "@/lib/utils/uploadImage";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  error?: string;
}

const toolButtonClass = (active?: boolean) =>
  `inline-flex h-[30px] min-w-[30px] cursor-pointer items-center justify-center rounded-sm px-2 text-[13px] font-semibold ${
    active
      ? "bg-secondary-container text-on-secondary-container"
      : "text-on-surface-variant hover:bg-surface-container"
  }`;

const proseMirrorStyles =
  "[&_.ProseMirror]:min-h-[240px] [&_.ProseMirror]:outline-none " +
  "[&_.ProseMirror_p]:mb-[0.9em] " +
  "[&_.ProseMirror_h2]:mt-4 [&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h2]:font-display [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:text-primary " +
  "[&_.ProseMirror_h3]:mt-4 [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:font-display [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:text-primary " +
  "[&_.ProseMirror_ul]:mb-[0.9em] [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ol]:mb-[0.9em] [&_.ProseMirror_ol]:pl-6 " +
  "[&_.ProseMirror_blockquote]:my-0 [&_.ProseMirror_blockquote]:mb-[0.9em] [&_.ProseMirror_blockquote]:border-l-[3px] [&_.ProseMirror_blockquote]:border-secondary-fixed-dim [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:text-on-surface-variant " +
  "[&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded " +
  "[&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline " +
  "[&_.is-editor-empty::before]:pointer-events-none [&_.is-editor-empty::before]:float-left [&_.is-editor-empty::before]:h-0 [&_.is-editor-empty::before]:text-outline [&_.is-editor-empty::before]:content-[attr(data-placeholder)]";

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  error,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Link Modal state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkInputUrl, setLinkInputUrl] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: false,
      }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image,
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  async function handleImagePick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !editor) return;

    setUploadError(null);
    setIsUploadingImage(true);
    try {
      const uploaded = await uploadImage(file);
      editor.chain().focus().setImage({ src: uploaded.url }).run();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Tải ảnh thất bại.");
    } finally {
      setIsUploadingImage(false);
    }
  }

  function handleOpenLinkModal() {
    const previousUrl = (editor?.getAttributes("link").href as string | undefined) ?? "";
    setLinkInputUrl(previousUrl);
    setIsLinkModalOpen(true);
  }

  function handleSaveLink() {
    if (!editor) return;
    const url = linkInputUrl.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    setIsLinkModalOpen(false);
  }

  function handleRemoveLink() {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setIsLinkModalOpen(false);
  }

  const effectiveError = uploadError ?? error;

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={`overflow-hidden rounded border transition-colors ${
          effectiveError
            ? "border-error bg-error-container/10"
            : "border-[rgba(196,198,210,0.5)] bg-surface-container-lowest"
        }`}
      >
        <div className="flex flex-wrap gap-0.5 border-b border-[rgba(196,198,210,0.5)] bg-surface p-1.5">
          <ToolButton
            label="B"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          />
          <ToolButton
            label="I"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          />
          <div className="mx-1 my-1 w-px bg-[rgba(196,198,210,0.5)]" />
          <ToolButton
            label="H2"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          />
          <ToolButton
            label="H3"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          />
          <div className="mx-1 my-1 w-px bg-[rgba(196,198,210,0.5)]" />
          <ToolButton
            label="• Danh sách"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
          <ToolButton
            label="1. Danh sách"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          />
          <ToolButton
            label="Trích dẫn"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          />
          <div className="mx-1 my-1 w-px bg-[rgba(196,198,210,0.5)]" />
          <ToolButton
            label="Liên kết"
            active={editor.isActive("link")}
            onClick={handleOpenLinkModal}
          />
          <ToolButton
            label={isUploadingImage ? "Đang tải..." : "Ảnh"}
            onClick={() => fileInputRef.current?.click()}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            onChange={handleImagePick}
          />
        </div>
        <div className={`p-4 text-base leading-relaxed ${proseMirrorStyles}`}>
          <EditorContent editor={editor} />
        </div>
      </div>
      {effectiveError ? (
        <p className="flex items-center gap-1 text-xs font-medium text-error">
          {effectiveError}
        </p>
      ) : null}

      <Modal
        open={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        title="Chèn liên kết"
        description="Nhập URL liên kết cho văn bản đã chọn."
        cancelLabel="Hủy"
        confirmLabel="Lưu liên kết"
        onConfirm={handleSaveLink}
      >
        <div className="mt-4 flex flex-col gap-3 text-left">
          <Input
            label="Đường dẫn URL"
            placeholder="https://example.com"
            value={linkInputUrl}
            onChange={(e) => setLinkInputUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSaveLink();
              }
            }}
          />
          {editor.isActive("link") ? (
            <button
              type="button"
              className="self-start text-xs font-semibold text-error hover:underline"
              onClick={handleRemoveLink}
            >
              Gỡ liên kết
            </button>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}

function ToolButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={toolButtonClass(active)} onClick={onClick}>
      {label}
    </button>
  );
}
