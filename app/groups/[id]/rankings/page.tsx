"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trophy, TrendingUp, Calendar, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function GroupRankingsPage() {
  const params = useParams();
  const router = useRouter();
  const [rankings, setRankings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      const res = await fetch(`/api/groups/${params.id}/rankings`);
      if (res.ok) {
        const data = await res.json();
        setRankings(data);
      } else {
        console.error("Error fetching rankings");
      }
    } catch (error) {
      console.error("Error fetching rankings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (position: number) => {
    if (position === 0) return "🥇";
    if (position === 1) return "🥈";
    if (position === 2) return "🥉";
    return `${position + 1}.`;
  };

  const RankingCard = ({
    title,
    icon: Icon,
    data,
    valueKey,
    valueLabel,
  }: any) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.slice(0, 10).map((item: any, index: number) => (
            <motion.div
              key={item.user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg font-bold w-8">
                {getMedalEmoji(index)}
              </span>
              <Avatar className="h-10 w-10">
                <AvatarImage src={item.user.avatarUrl ?? ""} />
                <AvatarFallback>
                  {item.user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {item.user.name}
                </p>
                <p className="text-xs text-gray-500">
                  {item[valueKey]} {valueLabel}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{item[valueKey]}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!rankings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Error al cargar rankings</p>
          <Button onClick={() => router.back()} className="mt-4">
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al grupo
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Rankings del Grupo
          </h1>
          <p className="text-gray-600 mt-2">
            Compara tu progreso con otros miembros
          </p>
        </div>

        {/* Estadísticas del Grupo */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Estadísticas del Grupo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {rankings.groupStats.totalMembers}
                </p>
                <p className="text-sm text-gray-600">Miembros</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {rankings.groupStats.totalLogs}
                </p>
                <p className="text-sm text-gray-600">Total Registros</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {rankings.groupStats.avgDailyLogs7}
                </p>
                <p className="text-sm text-gray-600">Promedio/día (7d)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {rankings.groupStats.avgDailyLogs30}
                </p>
                <p className="text-sm text-gray-600">Promedio/día (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rankings por Categoría */}
        <Tabs defaultValue="total" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="total">Total</TabsTrigger>
            <TabsTrigger value="week">7 Días</TabsTrigger>
            <TabsTrigger value="month">30 Días</TabsTrigger>
            <TabsTrigger value="current">Racha</TabsTrigger>
            <TabsTrigger value="longest">Mejor Racha</TabsTrigger>
          </TabsList>

          <TabsContent value="total" className="mt-6">
            <RankingCard
              title="Total de Registros"
              icon={Trophy}
              data={rankings.rankings.totalLogs}
              valueKey="totalLogs"
              valueLabel="registros"
            />
          </TabsContent>

          <TabsContent value="week" className="mt-6">
            <RankingCard
              title="Últimos 7 Días"
              icon={Calendar}
              data={rankings.rankings.last7Days}
              valueKey="last7DaysLogs"
              valueLabel="registros"
            />
          </TabsContent>

          <TabsContent value="month" className="mt-6">
            <RankingCard
              title="Últimos 30 Días"
              icon={TrendingUp}
              data={rankings.rankings.last30Days}
              valueKey="last30DaysLogs"
              valueLabel="registros"
            />
          </TabsContent>

          <TabsContent value="current" className="mt-6">
            <RankingCard
              title="Racha Actual"
              icon={Flame}
              data={rankings.rankings.currentStreak}
              valueKey="currentStreak"
              valueLabel="días"
            />
          </TabsContent>

          <TabsContent value="longest" className="mt-6">
            <RankingCard
              title="Mejor Racha"
              icon={Trophy}
              data={rankings.rankings.longestStreak}
              valueKey="longestStreak"
              valueLabel="días"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
