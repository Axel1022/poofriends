'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Users,
  Globe,
  ArrowLeft,
  UserPlus,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface GroupData {
  id: string;
  name: string;
  creator: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  memberCount: number;
  isMember: boolean;
  hasPendingRequest: boolean;
  createdAt: string;
}

export default function ExploreGroupsPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [canceling, setCanceling] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPublicGroups();
    }
  }, [status]);

  const fetchPublicGroups = async () => {
    try {
      const res = await fetch('/api/groups/explore');
      if (!res.ok) throw new Error('Error al cargar grupos');
      const data = await res.json();
      setGroups(data.groups);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar grupos públicos');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRequest = async (groupId: string) => {
    setRequesting(groupId);
    try {
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al solicitar ingreso');
      }

      toast.success('¡Solicitud enviada! Espera la aprobación del líder');
      fetchPublicGroups(); // Refrescar lista
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message);
    } finally {
      setRequesting(null);
    }
  };

  const handleCancelRequest = async (groupId: string) => {
    setCanceling(groupId);
    try {
      const res = await fetch('/api/groups/join/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al cancelar solicitud');
      }

      toast.success('Solicitud cancelada');
      fetchPublicGroups(); // Refrescar lista
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message);
    } finally {
      setCanceling(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.push('/groups')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Explorar Grupos Públicos
            </h1>
          </div>
          <p className="text-gray-600 ml-16">
            Descubre y únete a grupos de la comunidad
          </p>
        </motion.div>

        {/* Groups Grid */}
        {groups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay grupos públicos disponibles</p>
            <p className="text-gray-400 mt-2">Crea el primer grupo público</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-200">
                  <CardContent className="p-6">
                    {/* Group Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800 mb-2">
                          {group.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={group.creator.avatarUrl || undefined} />
                            <AvatarFallback>
                              {group.creator.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>Creado por {group.creator.name}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <Globe className="w-3 h-3 mr-1" />
                        Público
                      </Badge>
                    </div>

                    {/* Member Count */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <Users className="w-4 h-4" />
                      <span>
                        {group.memberCount}{' '}
                        {group.memberCount === 1 ? 'miembro' : 'miembros'}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    {group.isMember ? (
                      <Button
                        onClick={() => router.push(`/groups/${group.id}`)}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Ya eres miembro
                      </Button>
                    ) : group.hasPendingRequest ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">Esperando confirmación</span>
                        </div>
                        <Button
                          onClick={() => handleCancelRequest(group.id)}
                          disabled={canceling === group.id}
                          variant="outline"
                          className="w-full border-red-200 text-red-600 hover:bg-red-50"
                        >
                          {canceling === group.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2" />
                              Cancelando...
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4 mr-2" />
                              Cancelar Solicitud
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleJoinRequest(group.id)}
                        disabled={requesting === group.id}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        {requesting === group.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Solicitar Ingreso
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
