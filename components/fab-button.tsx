"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface FabButtonProps {
  onClick: () => void;
}

export function FabButton({ onClick }: FabButtonProps) {
  return (
    <Button
      size="lg"
      className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 z-50 transition-transform hover:scale-110"
      onClick={onClick}
    >
      <Plus className="h-8 w-8" />
    </Button>
  );
}
