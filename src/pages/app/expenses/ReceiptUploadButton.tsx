import * as React from "react";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export function ReceiptUploadButton({
  expenseId,
  onUploaded,
}: {
  expenseId: string;
  onUploaded: (receiptPath: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = React.useState(false);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*,application/pdf"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          if (file.size > 20 * 1024 * 1024) {
            toast("File too large", { description: "Max 20MB" });
            return;
          }
          try {
            setBusy(true);
            const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
            const path = `${expenseId}/${Date.now()}-${safeName(file.name)}.${ext}`;
            const { error } = await supabase.storage.from("receipts").upload(path, file, {
              upsert: true,
              contentType: file.type || undefined,
            });
            if (error) throw error;
            onUploaded(path);
            toast("Receipt uploaded");
          } catch (err: any) {
            toast("Upload failed", { description: err.message });
          } finally {
            setBusy(false);
          }
        }}
      />
      <Button variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
        <Upload />
        {busy ? "Uploading…" : "Receipt"}
      </Button>
    </>
  );
}
