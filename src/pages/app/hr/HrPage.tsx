import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/pages/app/_ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

import { HrDialog } from "@/pages/app/hr/HrDialog";
import { HrTableCard, type HrRow } from "@/pages/app/hr/HrTableCard";
import type { HrValues } from "@/pages/app/hr/schemas";

export default function HrPage() {
  const qc = useQueryClient();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<HrRow | null>(null);
  const [viewing, setViewing] = React.useState<HrRow | null>(null);

  const rows = useQuery({
    queryKey: ["hr_records", q],
    queryFn: async () => {
      let query = supabase
        .from("hr_records")
        .select("id,full_name,role_title,email,phone,salary_monthly,start_date,end_date,created_at")
        .order("created_at", { ascending: false });
      const trimmed = q.trim();
      if (trimmed) query = query.ilike("full_name", `%${trimmed}%`);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as HrRow[];
    },
  });

  const createRow = useMutation({
    mutationFn: async (values: HrValues) => {
      const payload = {
        full_name: values.full_name,
        role_title: values.role_title ? values.role_title : null,
        email: values.email ? values.email : null,
        phone: values.phone ? values.phone : null,
        salary_monthly: Number.isFinite(Number(values.salary_monthly)) ? Number(values.salary_monthly) : null,
        start_date: values.start_date ? values.start_date : null,
        end_date: values.end_date ? values.end_date : null,
        notes: values.notes ? values.notes : null,
      };
      const { error } = await supabase.from("hr_records").insert([payload]);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["hr_records"] });
      toast("HR record created");
      setOpen(false);
    },
    onError: (e: any) => toast("Failed", { description: e.message }),
  });

  const updateRow = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: HrValues }) => {
      const payload = {
        full_name: values.full_name,
        role_title: values.role_title ? values.role_title : null,
        email: values.email ? values.email : null,
        phone: values.phone ? values.phone : null,
        salary_monthly: Number.isFinite(Number(values.salary_monthly)) ? Number(values.salary_monthly) : null,
        start_date: values.start_date ? values.start_date : null,
        end_date: values.end_date ? values.end_date : null,
        notes: values.notes ? values.notes : null,
      };
      const { error } = await supabase.from("hr_records").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["hr_records"] });
      toast("HR record updated");
      setEditing(null);
    },
    onError: (e: any) => toast("Failed", { description: e.message }),
  });

  const deleteRow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hr_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["hr_records"] });
      toast("HR record deleted");
    },
    onError: (e: any) => toast("Failed", { description: e.message }),
  });

  const editingFull = useQuery({
    enabled: Boolean(editing?.id),
    queryKey: ["hr_record", editing?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hr_records")
        .select("id,full_name,role_title,email,phone,salary_monthly,start_date,end_date,notes")
        .eq("id", editing!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="HR Records"
        subtitle="Admin-only staff records (no staff logins)."
        actions={
          <Button
            variant="hero"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            New record
          </Button>
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="max-w-md">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search staff name…" />
        </div>
        <div className="text-sm text-muted-foreground">{rows.isLoading ? "Loading…" : `${(rows.data ?? []).length} records`}</div>
      </div>

      <HrTableCard 
        rows={rows.data ?? []} 
        isLoading={rows.isLoading} 
        onEdit={setEditing} 
        onDelete={(r) => deleteRow.mutate(r.id)}
      />

      <HrDialog mode="create" open={open} onOpenChange={setOpen} onSubmit={(v) => createRow.mutate(v)} isSaving={createRow.isPending} />

      <HrDialog
        mode="edit"
        open={Boolean(editing)}
        onOpenChange={(v) => {
          if (!v) setEditing(null);
        }}
        initialValues={
          editingFull.data
            ? {
                full_name: editingFull.data.full_name,
                role_title: editingFull.data.role_title ?? "",
                email: editingFull.data.email ?? "",
                phone: editingFull.data.phone ?? "",
                salary_monthly: (editingFull.data.salary_monthly ?? 0) as any,
                start_date: editingFull.data.start_date ?? "",
                end_date: editingFull.data.end_date ?? "",
                notes: editingFull.data.notes ?? "",
              }
            : undefined
        }
        onSubmit={(v) => {
          if (!editing) return;
          updateRow.mutate({ id: editing.id, values: v });
        }}
        isSaving={updateRow.isPending}
      />
    </div>
  );
}
