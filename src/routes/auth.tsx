import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { SHOP } from "@/lib/shop";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Seller Sign In — Upcurv Crackers" },
      { name: "description", content: "Shop admin sign in for the Upcurv Crackers enquiry desk." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Seller Sign In — Upcurv Crackers" },
      { property: "og:description", content: "Shop admin access only." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4">
      <form
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          setLoading(false);
          if (error) {
            toast.error(error.message);
            return;
          }
          navigate({ to: "/dashboard" });
        }}
      >
        <h1 className="text-2xl font-semibold">Seller sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">{SHOP.name} enquiry desk</p>

        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </div>
      </form>
    </div>
  );
}
