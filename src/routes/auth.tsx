import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, Lock, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SITE_CONFIG } from "@/lib/site-config";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — لوحة التحكم" },
      { name: "description", content: `لوحة تحكم ${SITE_CONFIG.brand.en}` },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const claim = async () => {
      try {
        await supabase.rpc("claim_super_admin" as any);
      } catch {
        /* ignore */
      }
    };
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        claim().then(() => navigate({ to: "/admin" }));
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        claim().then(() => navigate({ to: "/admin" }));
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const handleEmailAuth = async (mode: "signin" | "signup") => {
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
        toast.success("تم إنشاء الحساب! افحص إيميلك للتفعيل.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      toast.error(e.message ?? "حصل خطأ");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/admin",
    });
    if (result.error) {
      toast.error("فشل تسجيل الدخول بجوجل");
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/10 p-4" style={{ fontFamily: "'Cairo', 'Inter', sans-serif" }}>
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-lg">
            <Zap className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="text-lg font-black tracking-tight">لوحة التحكم</div>
        </Link>

        <div className="rounded-3xl border bg-card p-6 shadow-2xl sm:p-8">
          <h1 className="mb-1 text-2xl font-black">أهلاً بيك</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            سجل دخولك للتحكم الكامل في الموقع
          </p>

          <Button
            onClick={handleGoogle}
            disabled={loading}
            variant="outline"
            className="mb-4 w-full gap-2 rounded-xl"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            تسجيل الدخول بجوجل
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">أو</span>
            </div>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="signin">تسجيل دخول</TabsTrigger>
              <TabsTrigger value="signup">حساب جديد</TabsTrigger>
            </TabsList>

            {(["signin", "signup"] as const).map((mode) => (
              <TabsContent key={mode} value={mode} className="space-y-4">
                <div className="space-y-2">
                  <Label>الإيميل</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      dir="ltr"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-9"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      dir="ltr"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-9"
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>
                </div>
                <Button
                  onClick={() => handleEmailAuth(mode)}
                  disabled={loading || !email || !password}
                  className="w-full rounded-xl"
                >
                  {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  {mode === "signin" ? "تسجيل الدخول" : "إنشاء الحساب"}
                </Button>
              </TabsContent>
            ))}
          </Tabs>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            أول حساب يسجل بيتحول أدمن تلقائياً
          </p>
        </div>

        <Link to="/" className="mt-6 block text-center text-sm text-muted-foreground hover:text-foreground">
          ← العودة للموقع
        </Link>
      </div>
    </div>
  );
}
