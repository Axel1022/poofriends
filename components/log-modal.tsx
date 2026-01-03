"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MessageSquare, Send } from "lucide-react";

interface GroupWithWhatsApp {
  id: string;
  name: string;
  whatsappLink: string;
}

interface LogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userGroups?: GroupWithWhatsApp[];
}

const visitTypes = [
  { value: "NORMAL", label: "Normal", emoji: "💩" },
  { value: "QUICK", label: "Quick", emoji: "⚡" },
  { value: "LONG", label: "Long", emoji: "⏰" },
  { value: "EMERGENCY", label: "Emergency", emoji: "🚨" },
];

const moods = [
  { value: "HAPPY", emoji: "😊" },
  { value: "NEUTRAL", emoji: "😐" },
  { value: "STRESSED", emoji: "😰" },
  { value: "RELIEVED", emoji: "😌" },
  { value: "UNCOMFORTABLE", emoji: "😣" },
];

const predefinedMessages = [
  "💩 La primera de hoy",
  "🔥 Hoy llevo tanga",
  "⚡ Rápida y furiosa",
  "😌 Momento de paz",
  "🚀 Houston, tenemos despegue",
  "👑 El trono me llama",
  "💪 Mission accomplished",
  "🎯 Todo un éxito",
];

export function LogModal({ open, onOpenChange, onSuccess, userGroups = [] }: LogModalProps) {
  const [type, setType] = useState<string>("NORMAL");
  const [mood, setMood] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, mood, comment: comment || null }),
      });

      if (!res.ok) {
        throw new Error("Failed to create log");
      }

      toast.success("🎉 Visit logged successfully!");
      onSuccess();
      
      // Si hay grupos con WhatsApp, mostrar opciones para compartir
      const groupsWithWhatsApp = userGroups.filter(g => g.whatsappLink);
      if (groupsWithWhatsApp.length > 0) {
        setShowShareOptions(true);
      } else {
        // Si no hay grupos, cerrar el modal
        resetAndClose();
      }
    } catch (error) {
      toast.error("Failed to log visit");
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setType("NORMAL");
    setMood(null);
    setComment("");
    setShowShareOptions(false);
    setSelectedMessage(null);
    onOpenChange(false);
  };

  const handleShareToWhatsApp = (groupLink: string, message: string) => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `${groupLink}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    toast.success("¡Mensaje abierto en WhatsApp!");
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetAndClose();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md">
        {!showShareOptions ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <span>🚩</span> Register Bathroom Visit
              </DialogTitle>
              <DialogDescription>
                Track your visit and share it with your friends!
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
          {/* Visit Type */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Visit Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {visitTypes.map((vt) => (
                <motion.button
                  key={vt.value}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setType(vt.value)}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all text-center",
                    type === vt.value
                      ? "border-purple-600 bg-purple-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="text-3xl mb-1">{vt.emoji}</div>
                  <div className="text-sm font-medium">{vt.label}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Mood (Optional)</Label>
            <div className="flex justify-between gap-2">
              {moods.map((m) => (
                <motion.button
                  key={m.value}
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMood(mood === m.value ? null : m.value)}
                  className={cn(
                    "text-3xl p-2 rounded-lg transition-all",
                    mood === m.value
                      ? "bg-purple-100 scale-110"
                      : "hover:bg-gray-100"
                  )}
                >
                  {m.emoji}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-base font-semibold">
              Comment (Optional)
            </Label>
            <Textarea
              id="comment"
              placeholder="How was your experience? (max 500 characters)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                disabled={loading}
              >
                {loading ? "Logging..." : "Log Visit 🚀"}
              </Button>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <MessageSquare className="text-green-600" />
                Compartir en WhatsApp
              </DialogTitle>
              <DialogDescription>
                ¡Comparte tu logro con tu grupo!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Predefined Messages */}
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Selecciona un mensaje
                </Label>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {predefinedMessages.map((msg, index) => (
                    <motion.button
                      key={index}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedMessage(msg)}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all text-sm text-left",
                        selectedMessage === msg
                          ? "border-green-600 bg-green-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      {msg}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Groups with WhatsApp */}
              {selectedMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <Label className="text-base font-semibold">
                    Enviar a:
                  </Label>
                  {userGroups
                    .filter((g) => g.whatsappLink)
                    .map((group) => (
                      <Button
                        key={group.id}
                        type="button"
                        variant="outline"
                        className="w-full justify-between bg-green-50 border-green-200 hover:bg-green-100"
                        onClick={() => {
                          handleShareToWhatsApp(group.whatsappLink, selectedMessage);
                          resetAndClose();
                        }}
                      >
                        <span>{group.name}</span>
                        <Send className="h-4 w-4 text-green-600" />
                      </Button>
                    ))}
                </motion.div>
              )}

              <Button
                variant="ghost"
                className="w-full"
                onClick={resetAndClose}
              >
                Saltar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
