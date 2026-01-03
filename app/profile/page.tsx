"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { FabButton } from "@/components/fab-button";
import { LogModal } from "@/components/log-modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, Calendar, Users, Shield, UserX, UserCheck, Trash2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ProfilePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Admin panel states
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfile();
      fetchStats();
    }
  }, [status]);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchAllUsers();
    }
  }, [user?.role]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/users/profile");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setName(data.user?.name ?? "");
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return null;

    try {
      const presignedRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: avatarFile.name,
          contentType: avatarFile.type,
          isPublic: true,
        }),
      });

      if (!presignedRes.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl, cloud_storage_path } = await presignedRes.json();

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": avatarFile.type },
        body: avatarFile,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file");
      }

      const region = process.env.NEXT_PUBLIC_AWS_REGION ?? "us-east-1";
      const bucketName = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
      return `https://${bucketName}.s3.${region}.amazonaws.com/${cloud_storage_path}`;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let avatarUrl = user?.avatarUrl;

      if (avatarFile) {
        setUploading(true);
        avatarUrl = await uploadAvatar();
        setUploading(false);
      }

      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatarUrl }),
      });

      if (!res.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await res.json();
      setUser(data.user);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.success("✅ Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  // Admin functions
  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Suspendido por el administrador" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to suspend user");
      }

      toast.success("✅ Usuario suspendido exitosamente");
      await fetchAllUsers();
    } catch (error: any) {
      toast.error(`❌ ${error.message || "Error al suspender usuario"}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to activate user");
      }

      toast.success("✅ Usuario activado exitosamente");
      await fetchAllUsers();
    } catch (error: any) {
      toast.error(`❌ ${error.message || "Error al activar usuario"}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete user");

      toast.success("✅ Usuario eliminado exitosamente");
      await fetchAllUsers();
    } catch (error) {
      toast.error("❌ Error al eliminar usuario");
    } finally {
      setActionLoading(null);
    }
  };

  if (status === "loading" || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">💩</div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const memberSince = user?.createdAt
    ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })
    : "Unknown";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">My Profile 👤</h1>
          <p className="text-gray-600">Manage your account settings and view stats</p>
        </motion.div>

        <div className="grid gap-6">
          {/* Profile Info Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarPreview ?? user?.avatarUrl ?? ""} />
                    <AvatarFallback className="text-2xl">
                      {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                        <Upload className="h-4 w-4" />
                        Change Avatar
                      </div>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </Label>
                    <p className="text-xs text-gray-500 mt-2">
                      PNG, JPG or GIF (max. 5MB)
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email ?? ""} disabled />
                </div>

                <Button
                  onClick={handleSave}
                  disabled={saving || uploading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {uploading ? "Uploading..." : saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle>Your Statistics</CardTitle>
                <CardDescription>Quick overview of your activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-purple-50">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-2xl font-bold">{stats?.totalLogs ?? 0}</p>
                    <p className="text-sm text-gray-600">Total Visits</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-blue-50">
                    <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold">{stats?.groupCount ?? 0}</p>
                    <p className="text-sm text-gray-600">Groups Joined</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-pink-50">
                    <div className="text-2xl mb-2">🔥</div>
                    <p className="text-2xl font-bold">{stats?.averages?.daily30 ?? "0"}</p>
                    <p className="text-sm text-gray-600">Daily Average</p>
                  </div>
                </div>
                <div className="mt-4 text-center text-sm text-gray-500">
                  Member {memberSince}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Admin Panel - Only visible to ADMIN users */}
          {user?.role === "ADMIN" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-2 border-red-200 bg-red-50/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="h-6 w-6 text-red-600" />
                    <CardTitle className="text-red-900">Panel de Administración</CardTitle>
                  </div>
                  <CardDescription className="text-red-700">
                    Gestión de usuarios del sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingUsers ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Cargando usuarios...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {allUsers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                          <p>No hay usuarios registrados aún</p>
                        </div>
                      ) : (
                        allUsers.map((u) => (
                          <div
                            key={u.id}
                            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={u.avatarUrl ?? ""} />
                                <AvatarFallback>
                                  {u.name?.charAt(0)?.toUpperCase() ?? "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">{u.name ?? "Sin nombre"}</p>
                                  {u.role === "ADMIN" && (
                                    <Badge variant="destructive" className="text-xs">
                                      <Shield className="h-3 w-3 mr-1" />
                                      ADMIN
                                    </Badge>
                                  )}
                                  {u.isSuspended ? (
                                    <Badge variant="outline" className="text-xs border-red-500 text-red-700 bg-red-50">
                                      Suspendido
                                    </Badge>
                                  ) : !u.isActive ? (
                                    <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                                      Inactivo
                                    </Badge>
                                  ) : null}
                                </div>
                                <p className="text-sm text-gray-500">{u.email}</p>
                                <p className="text-xs text-gray-400">
                                  Registrado {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                            </div>

                            {/* Admin Actions - Cannot modify yourself */}
                            {u.id !== user.id && (
                              <div className="flex gap-2">
                                {u.isActive && !u.isSuspended ? (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                                        disabled={actionLoading === u.id}
                                      >
                                        <UserX className="h-4 w-4 mr-1" />
                                        Suspender
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>¿Suspender este usuario?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          <strong>{u.email}</strong> será suspendido y no podrá iniciar sesión hasta que sea reactivado por un administrador.
                                          <br /><br />
                                          Esta acción es <strong>reversible</strong> - puedes activarlo nuevamente en cualquier momento.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleSuspendUser(u.id)}
                                          className="bg-orange-600 hover:bg-orange-700"
                                        >
                                          Sí, suspender
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-green-300 text-green-700 hover:bg-green-50"
                                    disabled={actionLoading === u.id}
                                    onClick={() => handleActivateUser(u.id)}
                                  >
                                    <UserCheck className="h-4 w-4 mr-1" />
                                    Activar
                                  </Button>
                                )}

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-red-300 text-red-700 hover:bg-red-50"
                                      disabled={actionLoading === u.id}
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Eliminar
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-red-700">
                                        ⚠️ ¿Eliminar usuario permanentemente?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta acción eliminará permanentemente a <strong>{u.email}</strong> y todos sus datos
                                        (registros, grupos, comentarios, etc.). <strong>Esta acción NO se puede deshacer.</strong>
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteUser(u.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Sí, eliminar permanentemente
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>

      <FabButton onClick={() => setModalOpen(true)} />
      <LogModal open={modalOpen} onOpenChange={setModalOpen} onSuccess={fetchStats} />
    </div>
  );
}
