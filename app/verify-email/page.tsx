"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Token de verificación no encontrado");
        return;
      }

      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email verificado exitosamente");
          
          // Redirigir al login después de 3 segundos
          setTimeout(() => {
            router.push("/login?verified=true");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.error || "Error al verificar el email");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Error al conectar con el servidor");
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="text-6xl mb-2">💩</div>
          <CardTitle className="text-2xl font-bold">
            Verificación de Email
          </CardTitle>
          <CardDescription>
            Estamos verificando tu dirección de correo electrónico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "loading" && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-16 w-16 text-purple-600 animate-spin" />
              <p className="text-center text-gray-600">
                Verificando tu email...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-green-600">
                  ¡Email Verificado!
                </h3>
                <p className="text-gray-600">{message}</p>
                <p className="text-sm text-gray-500">
                  Redirigiendo al inicio de sesión...
                </p>
              </div>
              <Button
                onClick={() => router.push("/login?verified=true")}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
              >
                Ir a Iniciar Sesión
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-red-100 p-4">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-red-600">
                  Error de Verificación
                </h3>
                <p className="text-gray-600">{message}</p>
              </div>
              <div className="w-full space-y-2">
                <Button
                  onClick={() => router.push("/login")}
                  variant="outline"
                  className="w-full"
                >
                  Volver al Inicio de Sesión
                </Button>
                <Link href="/api/auth/resend-verification" className="block">
                  <Button variant="ghost" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Reenviar Email de Verificación
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
