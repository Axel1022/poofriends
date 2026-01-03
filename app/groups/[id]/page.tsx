"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { FabButton } from "@/components/fab-button";
import { LogModal } from "@/components/log-modal";
import { ActivityFeed } from "@/components/activity-feed";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Copy, Users, TrendingUp, UserX, LogOut, Crown, Check, X, Trophy, Settings, Globe, Lock, MessageSquare, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

export default function GroupDetailPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const params = useParams();
  const groupId = params?.id as string;
  const [modalOpen, setModalOpen] = useState(false);
  const [group, setGroup] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [myRole, setMyRole] = useState<string>("");
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [kickDialogOpen, setKickDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && groupId) {
      fetchGroupDetails();
    }
  }, [status, groupId]);

  const fetchGroupDetails = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setGroup(data.group);
        setRecentLogs(data.recentLogs || []);
        setTotalLogs(data.totalLogs || 0);
        setMyRole(data.myRole || "");
        setIsPublic(data.group?.isPublic || false);
        setWhatsappLink(data.group?.whatsappLink || "");
        
        // Fetch pending requests if user is leader
        if (data.myRole === "LEADER") {
          fetchPendingRequests();
        }
      } else if (res.status === 403) {
        toast.error("You are not a member of this group");
        router.push("/groups");
      }
    } catch (error) {
      console.error("Failed to fetch group details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/requests`);
      if (res.ok) {
        const data = await res.json();
        setPendingRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Failed to fetch pending requests:", error);
    }
  };

  const handleApproveRequest = async (userId: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/requests/${userId}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Usuario aprobado exitosamente");
        fetchGroupDetails();
        fetchPendingRequests();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to approve request");
      }
    } catch (error) {
      toast.error("Failed to approve request");
    }
  };

  const handleRejectRequest = async (userId: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/requests/${userId}/reject`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Solicitud rechazada");
        fetchPendingRequests();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to reject request");
      }
    } catch (error) {
      toast.error("Failed to reject request");
    }
  };

  const handleLeaveGroup = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/leave`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Has salido del grupo exitosamente");
        router.push("/groups");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to leave group");
      }
    } catch (error) {
      toast.error("Failed to leave group");
    }
  };

  const handleKickMember = async () => {
    if (!selectedMember) return;
    
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${selectedMember.userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Usuario expulsado del grupo exitosamente");
        setKickDialogOpen(false);
        setSelectedMember(null);
        fetchGroupDetails();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to remove member");
      }
    } catch (error) {
      toast.error("Failed to remove member");
    }
  };

  const copyInviteCode = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      toast.success("Invite code copied to clipboard!");
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic, whatsappLink }),
      });

      if (!res.ok) throw new Error("Error al guardar configuración");

      toast.success("✅ Configuración guardada exitosamente");
      setSettingsDialogOpen(false);
      fetchGroupDetails();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al guardar configuración");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error al eliminar grupo");

      toast.success("✅ Grupo eliminado exitosamente");
      router.push("/groups");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar grupo");
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">💩</div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <p className="text-lg text-gray-600">Group not found</p>
        </div>
      </div>
    );
  }

  const mostActiveUser = group?.members?.reduce((max: any, member: any) => {
    const count = member?.user?._count?.bathroomLogs ?? 0;
    return count > (max?.user?._count?.bathroomLogs ?? 0) ? member : max;
  }, group?.members?.[0]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.push("/groups")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Groups
        </Button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {group.name} 👥
                {myRole === "LEADER" && (
                  <Badge variant="secondary" className="ml-3 text-base">
                    <Crown className="h-4 w-4 mr-1" />
                    Líder
                  </Badge>
                )}
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Invite Code:</span>
                <code className="px-3 py-1 bg-gray-100 rounded font-mono">
                  {group.inviteCode}
                </code>
                <Button size="sm" variant="ghost" onClick={copyInviteCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/groups/${groupId}/rankings`)}
              >
                <Trophy className="h-4 w-4 mr-2" />
                Rankings
              </Button>
              {myRole === "LEADER" && (
                <Button
                  variant="outline"
                  onClick={() => setSettingsDialogOpen(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configuración
                </Button>
              )}
              {myRole !== "LEADER" && (
                <Button
                  variant="destructive"
                  onClick={() => setLeaveDialogOpen(true)}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Salir del Grupo
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Members</p>
                    <p className="text-3xl font-bold">{group?.members?.length ?? 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Visits</p>
                    <p className="text-3xl font-bold">{totalLogs}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={mostActiveUser?.user?.avatarUrl ?? ""} />
                    <AvatarFallback>
                      {mostActiveUser?.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-600">Most Active</p>
                    <p className="text-lg font-bold truncate">
                      {mostActiveUser?.user?.name ?? "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* WhatsApp Group Link */}
        {group?.whatsappLink && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500 rounded-full">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-green-900">
                        Grupo de WhatsApp
                      </h3>
                      <p className="text-sm text-green-700">
                        Únete al chat del grupo
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => window.open(group.whatsappLink, '_blank')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Abrir WhatsApp
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Pending Requests Section (Only for Leaders) */}
        {myRole === "LEADER" && pendingRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Solicitudes Pendientes
                  <Badge variant="default" className="ml-2">
                    {pendingRequests.length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Usuarios esperando aprobación para unirse al grupo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingRequests.map((request: any) => (
                    <div
                      key={request.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200"
                    >
                      <Avatar>
                        <AvatarImage src={request.user.avatarUrl ?? ""} />
                        <AvatarFallback>
                          {request.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{request.user.name}</p>
                        <p className="text-sm text-gray-500 truncate">{request.user.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApproveRequest(request.userId)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectRequest(request.userId)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Members List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-1"
          >
            <Card>
              <CardHeader>
                <CardTitle>Miembros</CardTitle>
                <CardDescription>
                  {group?.members?.length ?? 0} miembro{group?.members?.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {group?.members?.map((member: any) => (
                    <div
                      key={member?.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                    >
                      <Avatar>
                        <AvatarImage src={member?.user?.avatarUrl ?? ""} />
                        <AvatarFallback>
                          {member?.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate flex items-center gap-2">
                          {member?.user?.name}
                          {member?.role === "LEADER" && (
                            <Crown className="h-3 w-3 text-amber-500" />
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          {member?.user?._count?.bathroomLogs ?? 0} visitas
                        </p>
                      </div>
                      {myRole === "LEADER" && member?.userId !== (session?.user as any)?.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setSelectedMember(member);
                            setKickDialogOpen(true);
                          }}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Feed */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle>Group Activity</CardTitle>
                <CardDescription>Recent bathroom visits from members</CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityFeed logs={recentLogs} showUser={true} enableInteractions={true} />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <FabButton onClick={() => setModalOpen(true)} />
      <LogModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={fetchGroupDetails}
      />

      {/* Group Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configuración del Grupo</DialogTitle>
            <DialogDescription>
              Administra la privacidad y configuración de tu grupo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Public/Private Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <Globe className="h-5 w-5 text-green-600" />
                ) : (
                  <Lock className="h-5 w-5 text-gray-600" />
                )}
                <div>
                  <Label className="font-semibold">
                    {isPublic ? "Grupo Público" : "Grupo Privado"}
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {isPublic
                      ? "Cualquier usuario puede solicitar unirse"
                      : "Solo con código de invitación"}
                  </p>
                </div>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>

            {/* WhatsApp Link */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-600" />
                Link del Grupo de WhatsApp (opcional)
              </Label>
              <Input
                placeholder="https://chat.whatsapp.com/..."
                value={whatsappLink}
                onChange={(e) => setWhatsappLink(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Los miembros podrán ver y acceder a este link para unirse al chat del grupo
              </p>
            </div>

            {/* Danger Zone */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Zona de Peligro
              </h3>
              <Button
                variant="destructive"
                onClick={() => {
                  setSettingsDialogOpen(false);
                  setDeleteDialogOpen(true);
                }}
                className="w-full"
              >
                Eliminar Grupo Permanentemente
              </Button>
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setSettingsDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              {savingSettings ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              ⚠️ ¿Eliminar grupo permanentemente?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción <strong>no se puede deshacer</strong>. Se eliminarán
              permanentemente:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Todos los miembros del grupo</li>
                <li>Solicitudes pendientes</li>
                <li>Configuración del grupo</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-red-600 hover:bg-red-700"
            >
              Sí, Eliminar Grupo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Group Confirmation Dialog */}
      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Salir del grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que quieres salir de este grupo? Ya no podrás ver la actividad del grupo ni interactuar con sus miembros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveGroup}
              className="bg-red-600 hover:bg-red-700"
            >
              Salir del Grupo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Kick Member Confirmation Dialog */}
      <AlertDialog open={kickDialogOpen} onOpenChange={setKickDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Expulsar a {selectedMember?.user?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que quieres expulsar a este usuario del grupo? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedMember(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleKickMember}
              className="bg-red-600 hover:bg-red-700"
            >
              Expulsar Usuario
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
