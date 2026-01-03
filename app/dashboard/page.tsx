"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { FabButton } from "@/components/fab-button";
import { LogModal } from "@/components/log-modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityFeed } from "@/components/activity-feed";
import { StatCard } from "@/components/stat-card";
import { HourlyChart } from "@/components/charts/hourly-chart";
import { motion } from "framer-motion";
import { Calendar, TrendingUp, Users, Clock, Flame } from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [streak, setStreak] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const [statsRes, logsRes, groupsRes, streakRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/logs"),
        fetch("/api/groups"),
        fetch("/api/streaks"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }

      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGroups(groupsData.groups || []);
      }

      if (streakRes.ok) {
        const streakData = await streakRes.json();
        setStreak(streakData.streak);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
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

  if (!session) {
    return null;
  }

  const lastLogTime = stats?.lastLog?.timestamp
    ? new Date(stats.lastLog.timestamp).toLocaleString()
    : "No visits yet";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {session?.user?.name} 👋
          </h1>
          <p className="text-gray-600">
            Track your bathroom habits and stay connected with friends
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            title="Total Visits"
            value={stats?.totalLogs ?? 0}
            icon={Calendar}
            color="purple"
            delay={0.1}
          />
          <StatCard
            title="Daily Average"
            value={stats?.averages?.daily30 ?? "0"}
            icon={TrendingUp}
            color="blue"
            delay={0.2}
          />
          <StatCard
            title="Current Streak"
            value={`${streak?.currentDays ?? 0} 🔥`}
            icon={Flame}
            color="pink"
            delay={0.3}
            subtitle={`Best: ${streak?.longestDays ?? 0} days`}
          />
          <StatCard
            title="Groups Joined"
            value={stats?.groupCount ?? 0}
            icon={Users}
            color="indigo"
            delay={0.4}
          />
          <StatCard
            title="Last Visit"
            value={stats?.lastLog ? "Recent" : "Never"}
            icon={Clock}
            color="purple"
            delay={0.5}
            subtitle={lastLogTime}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ⏰ Peak Hours
                </CardTitle>
                <CardDescription>
                  Your most active hours of the day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HourlyChart data={stats?.distributions?.hourly ?? {}} />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📅 Recent Activity
                </CardTitle>
                <CardDescription>Your latest bathroom visits</CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityFeed logs={logs.slice(0, 5)} showUser={false} />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* My Groups Preview */}
        {groups.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  👥 My Groups
                </CardTitle>
                <CardDescription>
                  You're a member of {groups.length} group{groups.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groups.slice(0, 3).map((group: any) => (
                    <Card
                      key={group?.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/groups/${group?.id}`)}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">{group?.name}</CardTitle>
                        <CardDescription>
                          {group?.memberCount ?? 0} members
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>

      <FabButton onClick={() => setModalOpen(true)} />
      <LogModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={fetchData}
        userGroups={groups
          .filter((g: any) => g.whatsappLink)
          .map((g: any) => ({
            id: g.id,
            name: g.name,
            whatsappLink: g.whatsappLink,
          }))}
      />
    </div>
  );
}
