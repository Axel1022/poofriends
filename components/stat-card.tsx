"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: "purple" | "blue" | "pink" | "indigo";
  delay?: number;
  subtitle?: string;
}

const colorClasses = {
  purple: "from-purple-500 to-purple-600",
  blue: "from-blue-500 to-blue-600",
  pink: "from-pink-500 to-pink-600",
  indigo: "from-indigo-500 to-indigo-600",
};

export function StatCard({
  title,
  value,
  icon: Icon,
  color,
  delay = 0,
  subtitle,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
              <p className="text-3xl font-bold">{value}</p>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1 truncate">{subtitle}</p>
              )}
            </div>
            <div
              className={cn(
                "p-3 rounded-full bg-gradient-to-br",
                colorClasses[color]
              )}
            >
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
