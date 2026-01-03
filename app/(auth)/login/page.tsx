"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { toast } from "sonner";
import { Chrome, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Mostrar mensaje si viene de registro
  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      toast.success("¡Cuenta creada! Verifica tu email antes de iniciar sesión");
    }
    if (searchParams.get("verified") === "true") {
      toast.success("✅ Email verificado! Ahora puedes iniciar sesión");
    }
    if (searchParams.get("reset") === "true") {
      toast.success("✅ Contraseña restablecida! Inicia sesión con tu nueva contraseña");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Manejo de errores específicos
        const errorLower = result.error.toLowerCase();
        
        if (errorLower.includes("account_suspended") || errorLower.includes("suspended")) {
          setErrorMessage("🚫 Tu cuenta ha sido suspendida. Por favor contacta al administrador para más información.");
          toast.error("Cuenta suspendida");
        } else if (errorLower.includes("account_not_verified") || errorLower.includes("not_verified") || errorLower.includes("inactive")) {
          setErrorMessage("📧 Tu cuenta está inactiva. Por favor verifica tu email para activar tu cuenta.");
          toast.error("Cuenta inactiva - Verifica tu email");
        } else if (errorLower.includes("invalid credentials") || result.error === "CredentialsSignin") {
          setErrorMessage("❌ Email o contraseña incorrectos. Por favor verifica tus credenciales.");
          toast.error("Credenciales incorrectas");
        } else {
          setErrorMessage("⚠️ Error al iniciar sesión. Por favor intenta nuevamente.");
          toast.error("Error al iniciar sesión");
        }
      } else {
        toast.success("¡Bienvenido de vuelta! 🎉");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      setErrorMessage("Ocurrió un error inesperado");
      toast.error("Error del servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="text-6xl mb-2">💩</div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Welcome to PooFriends
          </CardTitle>
          <CardDescription>Track your bathroom visits with friends!</CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link 
                  href="/forgot-password" 
                  className="text-xs text-purple-600 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Iniciar Sesión 🚀"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            type="button"
          >
            <Chrome className="mr-2 h-4 w-4" />
            Sign in with Google
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-purple-600 hover:underline font-semibold">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
