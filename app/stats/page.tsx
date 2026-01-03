"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { FabButton } from "@/components/fab-button";
import { LogModal } from "@/components/log-modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TypeDistributionChart } from "@/components/charts/type-distribution-chart";
import { MoodDistributionChart } from "@/components/charts/mood-distribution-chart";
import { HourlyChart } from "@/components/charts/hourly-chart";
import { DayOfWeekChart } from "@/components/charts/day-of-week-chart";
import { motion } from "framer-motion";
import { TrendingUp, Calendar, Clock, Smile } from "lucide-react";

export default function StatsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchStats();
    }
  }, [status]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Statistics 📈</h1>
          <p className="text-gray-600">
            Detailed insights into your bathroom habits
          </p>
        </motion.div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Visits</p>
                    <p className="text-3xl font-bold">{stats?.totalLogs ?? 0}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-600" />
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
                    <p className="text-sm font-medium text-gray-600">7-Day Avg</p>
                    <p className="text-3xl font-bold">{stats?.averages?.daily7 ?? "0"}</p>
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">30-Day Avg</p>
                    <p className="text-3xl font-bold">{stats?.averages?.daily30 ?? "0"}</p>
                  </div>
                  <Clock className="h-8 w-8 text-pink-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Weekly Avg</p>
                    <p className="text-3xl font-bold">{stats?.averages?.weekly ?? "0"}</p>
                  </div>
                  <Smile className="h-8 w-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Visit Type Distribution</CardTitle>
                <CardDescription>Breakdown by visit type</CardDescription>
              </CardHeader>
              <CardContent>
                <TypeDistributionChart data={stats?.distributions?.type ?? {}} />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Mood Distribution</CardTitle>
                <CardDescription>How you felt during visits</CardDescription>
              </CardHeader>
              <CardContent>
                <MoodDistributionChart data={stats?.distributions?.mood ?? {}} />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Hourly Activity</CardTitle>
                <CardDescription>Most active hours of the day</CardDescription>
              </CardHeader>
              <CardContent>
                <HourlyChart data={stats?.distributions?.hourly ?? {}} />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Day of Week Activity</CardTitle>
                <CardDescription>Most active days</CardDescription>
              </CardHeader>
              <CardContent>
                <DayOfWeekChart data={stats?.distributions?.dayOfWeek ?? {}} />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <FabButton onClick={() => setModalOpen(true)} />
      <LogModal open={modalOpen} onOpenChange={setModalOpen} onSuccess={fetchStats} />
    </div>
  );
}
