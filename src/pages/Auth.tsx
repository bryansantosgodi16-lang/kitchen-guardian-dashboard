import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Shield, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate("/", { replace: true });
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast({
          title: "Cadastro realizado",
          description: "Verifique seu email para confirmar a conta.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message ?? "Falha na autenticação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background" style={{ animation: "fade-up 0.9s ease-out" }}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 rounded-full"
            style={{
              left: `${(i * 53) % 100}%`,
              background: "#00ff88",
              boxShadow: "0 0 6px #00ff88",
              animation: `particle ${10 + (i % 5) * 3}s linear infinite`,
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at top left, rgba(0,255,136,0.08), transparent 50%), radial-gradient(ellipse at bottom right, rgba(0,255,136,0.05), transparent 50%)",
          }}
        />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-8 sm:max-w-lg sm:px-6 sm:py-10">
        <form onSubmit={handleSubmit} className="w-full">
          <section className="glass rounded-2xl p-5 sm:rounded-3xl sm:p-8" style={{ animation: "fade-up 1s ease-out 0.25s both" }}>
            <div className="mb-6 flex items-start gap-3">
              <div className="rounded-xl p-2 neon-border">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 neon-text" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-foreground">
                  {mode === "login" ? "ACESSO AO SISTEMA" : "CRIAR CONTA"}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Sistema de Segurança para Cozinha Industrial
                </p>
              </div>
            </div>

            <h2 className="mb-3 text-sm font-bold tracking-widest neon-text">CREDENCIAIS</h2>
            <div className="mb-2 h-px w-full" style={{ background: "linear-gradient(90deg, rgba(0,255,136,0.6), transparent)" }} />

            <div className="grid gap-4 pt-4">
              <div>
                <Label className="mb-1.5 block text-sm">Email</Label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@empresa.com"
                  className="border-border bg-input/40 focus-visible:ring-primary"
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">Senha</Label>
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="border-border bg-input/40 focus-visible:ring-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="neon-btn mt-6 sm:mt-8 flex w-full items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl py-3 sm:py-4 text-base sm:text-lg font-bold tracking-wide"
            >
              {mode === "login" ? <Lock className="h-4 w-4 sm:h-5 sm:w-5" /> : <Mail className="h-4 w-4 sm:h-5 sm:w-5" />}
              {loading ? "AGUARDE..." : mode === "login" ? "ACESSAR SISTEMA" : "CRIAR CONTA"}
            </button>

            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="mt-4 w-full text-center text-xs text-muted-foreground hover:neon-text transition-colors"
            >
              {mode === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
            </button>
          </section>

          <footer className="mt-8 w-full text-center text-xs text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-4 w-4 neon-text" /> Sistema de Segurança para Cozinha Industrial
            </div>
            <div className="mt-1">© 2025 - Todos os direitos reservados.</div>
          </footer>
        </form>
      </main>
    </div>
  );
}
