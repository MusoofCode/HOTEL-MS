import { supabase } from "@/integrations/supabase/client";

export function subscribeTables(
  name: string,
  tables: string[],
  onChange: () => void,
  schema = "public",
) {
  const channel = supabase
    .channel(name)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema,
        table: tables.length === 1 ? tables[0] : undefined,
      } as any,
      () => onChange(),
    );

  // If multiple tables, register multiple listeners.
  if (tables.length > 1) {
    tables.forEach((table) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema, table },
        () => onChange(),
      );
    });
  }

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
