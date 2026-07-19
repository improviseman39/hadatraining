"use client";

import { useState, useTransition } from "react";
import { addBlock, deleteBlock, moveBlock, updateBlock } from "@/app/admin/sessions/actions";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";
import VimeoUploadField from "@/components/admin/VimeoUploadField";

type Block = {
  id: string;
  type: "video" | "pdf" | "text";
  position: number;
  title: string | null;
  video_url: string | null;
  pdf_url: string | null;
  pdf_storage_path: string | null;
  body: string | null;
};

const typeLabels: Record<Block["type"], string> = {
  video: "Video",
  pdf: "PDF",
  text: "Text",
};

function BlockFields({
  type,
  defaultValues,
  onVideoUploadingChange,
}: {
  type: Block["type"];
  defaultValues?: Partial<Block>;
  onVideoUploadingChange?: (uploading: boolean) => void;
}) {
  return (
    <>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink">Block title (optional)</label>
        <input
          name="title"
          defaultValue={defaultValues?.title ?? ""}
          placeholder={typeLabels[type] === "Video" ? "Video lesson" : typeLabels[type] === "PDF" ? "Session material" : "Notes"}
          className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
        />
      </div>
      {type === "video" && (
        <VimeoUploadField
          defaultValue={defaultValues?.video_url}
          onUploadingChange={onVideoUploadingChange}
        />
      )}
      {type === "pdf" && (
        <>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink">Upload a PDF</label>
            <input
              type="file"
              name="pdf_file"
              accept="application/pdf"
              className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink file:mr-3 file:rounded-full file:border-0 file:bg-teal file:px-3 file:py-1 file:text-xs file:font-medium file:text-porcelain focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
            {defaultValues?.pdf_storage_path && (
              <p className="mt-1 text-xs text-muted">
                A file is already uploaded — choosing a new one replaces it.
              </p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink">
              …or paste an already-hosted link instead
            </label>
            <input
              name="pdf_url"
              defaultValue={defaultValues?.pdf_url ?? ""}
              placeholder="https://…"
              className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
          </div>
        </>
      )}
      {type === "text" && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink">Body (Markdown)</label>
          <textarea
            name="body"
            required
            rows={4}
            defaultValue={defaultValues?.body ?? ""}
            placeholder="**Bold**, _italic_, [links](https://…), - lists"
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>
      )}
    </>
  );
}

function EditableBlockRow({ block, sessionId }: { block: Block; sessionId: string }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await updateBlock(block.id, formData);
      if (result?.error) setError(result.error);
      else setEditing(false);
    });
  }

  if (editing) {
    return (
      <li className="rounded-xl border border-teal/30 bg-teal/5 p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Editing {typeLabels[block.type]} block
          </span>
          <BlockFields type={block.type} defaultValues={block} onVideoUploadingChange={setVideoUploading} />
          {error && <p className="text-sm font-medium text-terracotta">{error}</p>}
          {videoUploading && (
            <p className="text-xs font-medium text-muted">
              Wait for the upload to finish before saving — Save is disabled until then.
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending || videoUploading}
              className="rounded-full bg-teal px-4 py-1.5 text-xs font-medium text-porcelain hover:bg-teal-dark disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full border border-ink/15 px-4 py-1.5 text-xs font-medium text-ink hover:border-teal"
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-ink/10 p-4">
      <div className="min-w-0">
        <span className="mr-2 rounded-full border border-ink/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">
          {typeLabels[block.type]}
        </span>
        <span className="text-sm font-medium text-ink">
          {block.title ?? "(untitled)"}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <form action={moveBlock.bind(null, block.id, sessionId, "up")}>
          <button type="submit" aria-label="Move up" className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-ink hover:border-teal hover:text-teal">
            &uarr;
          </button>
        </form>
        <form action={moveBlock.bind(null, block.id, sessionId, "down")}>
          <button type="submit" aria-label="Move down" className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-ink hover:border-teal hover:text-teal">
            &darr;
          </button>
        </form>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-ink hover:border-teal hover:text-teal"
        >
          Edit
        </button>
        <form action={deleteBlock.bind(null, block.id)}>
          <ConfirmSubmitButton
            confirmMessage="Delete this block?"
            className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-terracotta hover:border-terracotta"
          >
            Delete
          </ConfirmSubmitButton>
        </form>
      </div>
    </li>
  );
}

function AddBlockForm({ sessionId }: { sessionId: string }) {
  const [type, setType] = useState<Block["type"]>("video");
  const [error, setError] = useState<string | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);
    startTransition(async () => {
      const result = await addBlock(sessionId, formData);
      if (result?.error) setError(result.error);
      else {
        form.reset();
        setType("video");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-dashed border-ink/20 p-4">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">Add block</span>
      <select
        name="type"
        value={type}
        onChange={(e) => setType(e.target.value as Block["type"])}
        className="w-fit rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
      >
        <option value="video">Video</option>
        <option value="pdf">PDF</option>
        <option value="text">Text</option>
      </select>
      <BlockFields type={type} onVideoUploadingChange={setVideoUploading} />
      {error && <p className="text-sm font-medium text-terracotta">{error}</p>}
      {videoUploading && (
        <p className="text-xs font-medium text-muted">
          Wait for the upload to finish before adding — this button is disabled until then.
        </p>
      )}
      <button
        type="submit"
        disabled={pending || videoUploading}
        className="w-fit rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-porcelain hover:bg-teal disabled:opacity-60"
      >
        {pending ? "Adding…" : "+ Add block"}
      </button>
    </form>
  );
}

export default function BlockEditor({
  sessionId,
  blocks,
}: {
  sessionId: string;
  blocks: Block[];
}) {
  return (
    <div className="flex flex-col gap-3">
      {blocks.length > 0 && (
        <ul className="flex flex-col gap-2">
          {blocks.map((block) => (
            <EditableBlockRow key={block.id} block={block} sessionId={sessionId} />
          ))}
        </ul>
      )}
      <AddBlockForm sessionId={sessionId} />
    </div>
  );
}
