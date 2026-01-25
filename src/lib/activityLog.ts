import { supabase } from "@/integrations/supabase/client";

export type ActivityLogInput = {
  action: string;
  entity?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
};

export async function logActivity(input: ActivityLogInput) {
  const { data: userRes } = await supabase.auth.getUser();
  const actorUserId = userRes.user?.id;
  if (!actorUserId) return;

  await supabase.from("activity_logs").insert([
    {
      actor_user_id: actorUserId,
      action: input.action,
      entity: input.entity ?? null,
      entity_id: input.entity_id ?? null,
      metadata: (input.metadata ?? {}) as any,
    },
  ]);
}
