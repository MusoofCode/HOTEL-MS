import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Building2, Mail, Lock } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/sonner";
import { isCurrentUserAdmin } from "@/auth/admin";
import hotelHero from "@/assets/hotel-hero.jpg";

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
    <div className="min-h-svh bg-background">
      <div className="grid min-h-svh lg:grid-cols-2">
        {/* Hero Section */}
        <div 
          className="relative hidden flex-col justify-center bg-[hsl(var(--brand-warm))] p-12 lg:flex animate-fade-in"
          style={{
            backgroundImage: `linear-gradient(rgba(202, 103, 2, 0.85), rgba(202, 103, 2, 0.85)), url(${hotelHero})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="relative z-10 text-white animate-in slide-in-from-left-10 duration-700">
            <h1 className="text-5xl font-bold leading-tight">
              Simplify management with our dashboard.
            </h1>
            <p className="mt-6 text-lg opacity-90 animate-in slide-in-from-left-10 duration-700 delay-150">
              Streamline your hotel operations with our professional admin dashboard.
            </p>
          </div>
        </div>

        {/* Login Form Section */}
        <div className="flex items-center justify-center p-6 lg:p-12 animate-fade-in">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 animate-in slide-in-from-top-5 duration-500">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--brand-warm))] shadow-soft hover-scale">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold">Hotel Manager</div>
            </div>

            <div className="mb-6 animate-in slide-in-from-top-5 duration-500 delay-100">
              <h2 className="text-3xl font-bold">Welcome Back</h2>
              <p className="mt-2 text-sm text-muted-foreground">Please login to your account</p>
            </div>

            <div className="animate-in slide-in-from-bottom-5 duration-500 delay-200">
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
                        <FormLabel>Email address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <Input 
                              placeholder="Enter Your Email" 
                              autoComplete="email" 
                              className="h-12 rounded-2xl pl-12 transition-all duration-200 focus:shadow-md"
                              {...field} 
                            />
                          </div>
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
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <Input 
                              type="password" 
                              autoComplete="current-password" 
                              placeholder="••••••••••••" 
                              className="h-12 rounded-2xl pl-12 transition-all duration-200 focus:shadow-md"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="mt-2 h-12 w-full rounded-2xl bg-[hsl(var(--brand-warm))] hover:bg-[hsl(var(--brand-warm))]/90 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
                  >
                    Login
                  </Button>
                </form>
              </Form>
            </div>

            <div className="mt-6 text-center text-sm text-muted-foreground animate-in fade-in duration-500 delay-300">
              Don't have an account?{" "}
              <button 
                onClick={() => navigate("/setup")}
                className="font-medium text-[hsl(var(--brand-warm))] transition-all duration-200 hover:underline hover:brightness-110"
              >
                Setup Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
