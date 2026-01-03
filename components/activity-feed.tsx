"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send } from "lucide-react";

interface ActivityFeedProps {
  logs: any[];
  showUser?: boolean;
  enableInteractions?: boolean;
}

const typeEmojis: Record<string, string> = {
  NORMAL: "💩",
  QUICK: "⚡",
  LONG: "⏰",
  EMERGENCY: "🚨",
};

const moodEmojis: Record<string, string> = {
  HAPPY: "😊",
  NEUTRAL: "😐",
  STRESSED: "😰",
  RELIEVED: "😌",
  UNCOMFORTABLE: "😣",
};

const reactionEmojis = ["👍", "😂", "❤️", "🔥", "💪", "🎉"];

export function ActivityFeed({
  logs,
  showUser = true,
  enableInteractions = false,
}: ActivityFeedProps) {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [reactions, setReactions] = useState<Record<string, any>>({});
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});

  useEffect(() => {
    if (enableInteractions) {
      logs.forEach((log) => {
        fetchReactions(log.id);
        fetchComments(log.id);
      });
    }
  }, [logs, enableInteractions]);

  const fetchReactions = async (logId: string) => {
    try {
      const res = await fetch(`/api/logs/${logId}/reactions`);
      if (res.ok) {
        const data = await res.json();
        setReactions((prev) => ({ ...prev, [logId]: data }));
      }
    } catch (error) {
      console.error("Error fetching reactions:", error);
    }
  };

  const fetchComments = async (logId: string) => {
    try {
      const res = await fetch(`/api/logs/${logId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => ({ ...prev, [logId]: data.comments }));
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleReaction = async (logId: string, emoji: string) => {
    try {
      const res = await fetch(`/api/logs/${logId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });

      if (res.ok) {
        await fetchReactions(logId);
      }
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  const handleComment = async (logId: string) => {
    const text = commentText[logId]?.trim();
    if (!text) return;

    try {
      const res = await fetch(`/api/logs/${logId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (res.ok) {
        setCommentText((prev) => ({ ...prev, [logId]: "" }));
        await fetchComments(logId);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const toggleExpanded = (logId: string) => {
    setExpandedLogs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-4xl mb-2">🚩</p>
        <p>No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log: any, index: number) => {
        const timeAgo = log?.timestamp
          ? formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })
          : "Unknown";
        const isExpanded = expandedLogs.has(log.id);
        const logReactions = reactions[log.id]?.reactions || [];
        const userReactions = reactions[log.id]?.userReactions || [];
        const logComments = comments[log.id] || [];

        return (
          <motion.div
            key={log?.id || index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm"
          >
            <div className="flex items-start gap-3">
              {showUser && (
                <Avatar className="h-10 w-10">
                  <AvatarImage src={log?.user?.avatarUrl ?? ""} />
                  <AvatarFallback>
                    {log?.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {showUser && (
                    <span className="font-semibold text-sm">
                      {log?.user?.name ?? "Unknown"}
                    </span>
                  )}
                  <span className="text-lg">
                    {typeEmojis[log?.type ?? "NORMAL"] ?? "💩"}
                  </span>
                  {log?.mood && (
                    <span className="text-lg">
                      {moodEmojis[log?.mood ?? "NEUTRAL"] ?? ""}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">{timeAgo}</span>
                </div>
                {log?.comment && (
                  <p className="text-sm text-gray-600 mt-1">{log.comment}</p>
                )}

                {enableInteractions && (
                  <>
                    {/* Reacciones */}
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      {reactionEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(log.id, emoji)}
                          className={`px-2 py-1 text-sm rounded-full transition-all hover:bg-gray-100 ${
                            userReactions.includes(emoji)
                              ? "bg-blue-100 ring-1 ring-blue-300"
                              : "bg-gray-50"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    {/* Resumen de reacciones y comentarios */}
                    {(logReactions.length > 0 || logComments.length > 0) && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        {logReactions.length > 0 && (
                          <div className="flex items-center gap-1">
                            {logReactions.map((r: any, i: number) => (
                              <span key={i}>
                                {r.emoji}
                                {r.count > 1 && (
                                  <span className="ml-0.5">{r.count}</span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                        {logComments.length > 0 && (
                          <button
                            onClick={() => toggleExpanded(log.id)}
                            className="flex items-center gap-1 hover:text-gray-700"
                          >
                            <MessageCircle className="h-3 w-3" />
                            <span>{logComments.length}</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Comentarios expandidos */}
                    <AnimatePresence>
                      {isExpanded && logComments.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-3 space-y-2 border-t pt-2"
                        >
                          {logComments.map((comment: any) => (
                            <div
                              key={comment.id}
                              className="flex items-start gap-2"
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarImage
                                  src={comment.user.avatarUrl ?? ""}
                                />
                                <AvatarFallback className="text-xs">
                                  {comment.user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold">
                                    {comment.user.name}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {formatDistanceToNow(
                                      new Date(comment.createdAt),
                                      { addSuffix: true }
                                    )}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 mt-0.5">
                                  {comment.text}
                                </p>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Input para nuevo comentario */}
                    <div className="flex items-center gap-2 mt-3">
                      <Input
                        placeholder="Agregar un comentario..."
                        value={commentText[log.id] || ""}
                        onChange={(e) =>
                          setCommentText((prev) => ({
                            ...prev,
                            [log.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleComment(log.id);
                          }
                        }}
                        className="text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleComment(log.id)}
                        disabled={!commentText[log.id]?.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
