"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        toast.success("¡Email enviado! Revisa tu bandeja de entrada");
      } else {
        setError(data.error || "Error al enviar el email");
        toast.error(data.error);
      }
    } catch (error) {
      setError("Error al conectar con el servidor");
      toast.error("Error del servidor");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400 p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="space-y-2 text-center">
            <div className="text-6xl mb-2">📧</div>
            <CardTitle className="text-2xl font-bold text-green-600">
              ¡Email Enviado!
            </CardTitle>
            <CardDescription>
              Revisa tu bandeja de entrada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-gray-600">
                  Hemos enviado un enlace para restablecer tu contraseña a:
                </p>
                <p className="font-semibold text-purple-600">{email}</p>
                <p className="text-sm text-gray-500">
                  El enlace expira en 1 hora.
                </p>
              </div>
              <div className="w-full space-y-2">
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  Volver al Inicio de Sesión
                </Button>
                <Button
                  onClick={() => setSuccess(false)}
                  variant="outline"
                  className="w-full"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Reenviar Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="text-6xl mb-2">🔑</div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            ¿Olvidaste tu Contraseña?
          </CardTitle>
          <CardDescription>
            Ingresa tu email y te enviaremos un enlace para restablecerla
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">
                Te enviaremos un enlace para restablecer tu contraseña
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Mail className="h-4 w-4 mr-2 animate-pulse" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Enlace de Restablecimiento
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm text-purple-600 hover:underline"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver al Inicio de Sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
