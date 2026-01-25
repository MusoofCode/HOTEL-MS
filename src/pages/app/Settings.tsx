import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { PageHeader } from "@/pages/app/_ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/auth/useAuth";
import { supabase } from "@/integrations/supabase/client";

const profileSchema = z.object({
  display_name: z.string().trim().min(1, "Name is required"),
});

type ProfileValues = z.infer<typeof profileSchema>;

export default function Settings() {
  const { session, loading } = useAuth();
  const qc = useQueryClient();

  const profile = useQuery({
    enabled: Boolean(session?.user?.id),
    queryKey: ["my_profile", session?.user?.id],
    queryFn: async () => {
      const userId = session!.user.id;

      const { data, error } = await supabase.from("profiles").select("user_id,display_name").eq("user_id", userId).maybeSingle();
      if (error) throw error;

      if (!data) {
        // Create a default profile row (allowed by RLS: auth.uid() = user_id)
        const { error: insErr } = await supabase.from("profiles").insert([{ user_id: userId, display_name: "" }]);
        if (insErr) throw insErr;
        return { user_id: userId, display_name: "" };
      }

      return data;
    },
  });

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { display_name: "" },
  });

  React.useEffect(() => {
    if (profile.data) form.reset({ display_name: profile.data.display_name || "" });
  }, [profile.data, form]);

  const save = useMutation({
    mutationFn: async (values: ProfileValues) => {
      const userId = session!.user.id;
      const { error } = await supabase.from("profiles").update({ display_name: values.display_name }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["my_profile"] });
      toast("Profile updated");
    },
    onError: (e: any) => toast("Failed", { description: e.message }),
  });

  return (
    <div className="space-y-4">
      <PageHeader title="My Account" subtitle="Update your admin profile information." />

      <Card className="shadow-soft animate-fade-in">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : !session ? (
            <div className="text-sm text-muted-foreground">You are not signed in.</div>
          ) : (
            <div className="grid gap-6">
              <div className="grid gap-1">
                <div className="text-xs text-muted-foreground">Signed in as</div>
                <div className="text-sm font-medium">{session.user.email}</div>
              </div>

              <Form {...form}>
                <form className="grid gap-4" onSubmit={form.handleSubmit((v) => save.mutate(v))}>
                  <FormField
                    control={form.control}
                    name="display_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" variant="hero" disabled={save.isPending || profile.isLoading}>
                      Save changes
                    </Button>
                  </div>
                </form>
              </Form>

              {profile.isLoading ? <div className="text-sm text-muted-foreground">Loading profile…</div> : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
