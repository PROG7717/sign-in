"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  onUploaded: (urls: string[]) => void;
  multiple?: boolean;
  label: string;
  uploadingLabel: string;
};

/** Uploads images to the public `portfolio` storage bucket (admin-only via RLS). */
export default function ImageUploader({
  onUploaded,
  multiple = false,
  label,
  uploadingLabel,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    const supabase = createClient();
    const urls: string[] = [];

    for (const file of files) {
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
      const path = `projects/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("portfolio")
        .upload(path, file, { cacheControl: "31536000", upsert: false });

      if (uploadError) {
        setError(uploadError.message);
        continue;
      }
      const { data } = supabase.storage.from("portfolio").getPublicUrl(path);
      urls.push(data.publicUrl);
    }

    if (urls.length > 0) onUploaded(urls);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={onChange}
        className="hidden"
        id={`uploader-${label}`}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="glass rounded-xl border-dashed px-5 py-3 text-sm font-medium transition-colors hover:border-primary/60 hover:text-primary disabled:opacity-60"
      >
        {uploading ? uploadingLabel : `📷 ${label}`}
      </button>
      {error && <p className="mt-2 text-xs text-accent">{error}</p>}
    </div>
  );
}
