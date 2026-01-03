"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    } else if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400">
      <div className="text-center">
        <div className="text-8xl mb-4 animate-bounce">💩</div>
        <h1 className="text-4xl font-bold text-white mb-2">PooFriends</h1>
        <p className="text-white text-lg">Loading...</p>
      </div>
    </div>
  );
}
