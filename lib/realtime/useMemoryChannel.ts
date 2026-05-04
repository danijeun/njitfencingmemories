"use client";

import { useEffect, useRef } from "react";
import type {
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
  RealtimePostgresDeletePayload,
} from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type CommentRow = {
  id: string;
  memory_id: string;
  author_id: string;
  body: string;
  hidden_at: string | null;
  hidden_by: string | null;
  created_at: string;
  updated_at: string;
};

type ReactionRow = {
  id: string;
  memory_id: string;
  author_id: string;
  emoji: string;
  created_at: string;
};

export type MemoryChannelHandlers = {
  onCommentInsert?: (row: CommentRow) => void;
  onCommentUpdate?: (row: CommentRow) => void;
  onCommentDelete?: (row: { id: string }) => void;
  onReactionInsert?: (row: ReactionRow) => void;
  onReactionDelete?: (row: { id: string; author_id: string; emoji: string }) => void;
  onResubscribe?: () => void;
};

export function useMemoryChannel(memoryId: string, handlers: MemoryChannelHandlers) {
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  });

  useEffect(() => {
    const supabase = createClient();
    const filter = `memory_id=eq.${memoryId}`;

    const channel = supabase
      .channel(`memory:${memoryId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "memory_comments", filter },
        (payload: RealtimePostgresInsertPayload<CommentRow>) =>
          ref.current.onCommentInsert?.(payload.new),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "memory_comments", filter },
        (payload: RealtimePostgresUpdatePayload<CommentRow>) =>
          ref.current.onCommentUpdate?.(payload.new),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "memory_comments", filter },
        (payload: RealtimePostgresDeletePayload<CommentRow>) => {
          const id = (payload.old as { id?: string } | null)?.id;
          if (id) ref.current.onCommentDelete?.({ id });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "memory_reactions", filter },
        (payload: RealtimePostgresInsertPayload<ReactionRow>) =>
          ref.current.onReactionInsert?.(payload.new),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "memory_reactions", filter },
        (payload: RealtimePostgresDeletePayload<ReactionRow>) => {
          const old = payload.old as Partial<ReactionRow> | null;
          if (old?.id && old.author_id && old.emoji) {
            ref.current.onReactionDelete?.({
              id: old.id,
              author_id: old.author_id,
              emoji: old.emoji,
            });
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") ref.current.onResubscribe?.();
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [memoryId]);
}
