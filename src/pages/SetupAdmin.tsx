import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/sonner";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(12, "Use at least 12 characters"),
});

type Values = z.infer<typeof schema>;

export default function SetupAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [hasAdmin, setHasAdmin] = React.useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.functions.invoke("setup-admin", { method: "GET" });
      if (cancelled) return;
      setHasAdmin(Boolean((data as any)?.hasAdmin) && !error);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-svh bg-background bg-brand-glow">
        <div className="mx-auto flex min-h-svh max-w-2xl items-center justify-center p-6">
          <div className="w-full rounded-xl border bg-card p-6 shadow-elev">
            <div className="h-6 w-48 rounded-md bg-muted" />
            <div className="mt-3 h-4 w-72 rounded-md bg-muted" />
            <div className="mt-6 h-10 rounded-md bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (hasAdmin) {
    return (
      <div className="min-h-svh bg-background bg-brand-glow">
        <div className="mx-auto flex min-h-svh max-w-2xl items-center justify-center p-6">
          <div className="w-full rounded-xl border bg-card p-6 text-left shadow-elev">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-background shadow-soft">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-semibold">Admin is already configured</div>
                <div className="text-sm text-muted-foreground">You can proceed to login.</div>
              </div>
            </div>
            <div className="mt-6">
              <Button variant="hero" onClick={() => navigate("/login", { replace: true })}>
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background bg-brand-glow">
      <div className="mx-auto flex min-h-svh max-w-2xl items-center justify-center p-6">
        <div className="w-full rounded-xl border bg-card p-6 text-left shadow-elev">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-background shadow-soft">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Secure Admin Setup</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                One-time bootstrap. This creates the only admin account for this system.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <Form {...form}>
              <form
                className="grid gap-4"
                onSubmit={form.handleSubmit(async (values) => {
                  const res = await supabase.functions.invoke("setup-admin", {
                    method: "POST",
                    body: values,
                  });

                  if (res.error) {
                    toast("Setup failed", { description: res.error.message });
                    return;
                  }

                  toast("Admin created", { description: "Please sign in to continue." });
                  navigate("/login", { replace: true });
                })}
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin email</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@yourhotel.com" autoComplete="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" placeholder="At least 12 characters" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between gap-3">
                  <Button type="button" variant="outline" onClick={() => navigate("/login")}>Login instead</Button>
                  <Button type="submit" variant="hero">Create Admin</Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
