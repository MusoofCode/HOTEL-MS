import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/sonner";
import { isCurrentUserAdmin } from "@/auth/admin";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1, "Password is required"),
});

type Values = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname ?? "/app/dashboard";

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  React.useEffect(() => {
    // If already signed in and admin, go to app.
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const ok = await isCurrentUserAdmin();
      if (ok) navigate("/app/dashboard", { replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-svh bg-background bg-brand-glow">
      <div className="mx-auto flex min-h-svh max-w-2xl items-center justify-center p-6">
        <div className="w-full rounded-xl border bg-card p-6 text-left shadow-elev">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-background shadow-soft">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Admin Login</h1>
              <p className="mt-1 text-sm text-muted-foreground">Secure access for the hotel owner/admin only.</p>
            </div>
          </div>

          <div className="mt-6">
            <Form {...form}>
              <form
                className="grid gap-4"
                onSubmit={form.handleSubmit(async (values) => {
                  const { error } = await supabase.auth.signInWithPassword({
                    email: values.email,
                    password: values.password,
                  });
                  if (error) {
                    toast("Login failed", { description: error.message });
                    return;
                  }

                  const ok = await isCurrentUserAdmin();
                  if (!ok) {
                    await supabase.auth.signOut();
                    toast("Access denied", { description: "This system is admin-only." });
                    return;
                  }

                  navigate(from, { replace: true });
                })}
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="current-password" placeholder="••••••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between gap-3">
                  <Button type="button" variant="outline" onClick={() => navigate("/setup")}>Setup Admin</Button>
                  <Button type="submit" variant="hero">Sign in</Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
