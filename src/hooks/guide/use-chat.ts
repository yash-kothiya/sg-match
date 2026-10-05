"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import {
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  type Firestore,
  type Timestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import type { ChatMessageItem, ChatSessionItem, Citation } from "@/schemas/chat";
import { chatApi } from "@/utils";
import { queryKeys } from "@/utils";

const APP_NAME = "study-guide";

/**
 * Signs the browser in to Firebase with a custom token from our server, so it can read its own chat
 * history from Firestore (firestore.rules allow reads only under the signed-in user's own uid).
 */
export function useFirebaseAccess() {
  return useQuery({
    queryKey: queryKeys.firebaseClient,
    staleTime: Infinity,
    retry: false,
    meta: { silent: true },
    queryFn: async (): Promise<{ db: Firestore; uid: string }> => {
      const { uid, token, config } = await chatApi.firebaseAccess();
      const app = getApps().some((a) => a.name === APP_NAME) ? getApp(APP_NAME) : initializeApp(config, APP_NAME);
      await signInWithCustomToken(getAuth(app), token);
      return { db: getFirestore(app), uid };
    },
  });
}

type Live<T> = { data: T; loading: boolean; error: string | null };

const toDate = (value: unknown) => (value && typeof (value as Timestamp).toDate === "function" ? (value as Timestamp).toDate() : null);

/** The user's conversations, newest first, updating live. */
export function useChatSessions(access: { db: Firestore; uid: string } | undefined): Live<ChatSessionItem[]> {
  const [state, setState] = useState<Live<ChatSessionItem[]>>({ data: [], loading: true, error: null });

  useEffect(() => {
    if (!access) return;
    const q = query(collection(access.db, "users", access.uid, "chatSessions"), orderBy("updatedAt", "desc"));
    return onSnapshot(
      q,
      (snapshot) =>
        setState({
          loading: false,
          error: null,
          data: snapshot.docs.map((doc) => ({
            id: doc.id,
            title: String(doc.data().title ?? "Conversation"),
            updatedAt: toDate(doc.data().updatedAt),
          })),
        }),
      () => setState({ data: [], loading: false, error: "We couldn't load your conversations." }),
    );
  }, [access]);

  return state;
}

/** The messages of one conversation, oldest first, updating live. */
export function useChatMessages(access: { db: Firestore; uid: string } | undefined, sessionId: string | null): Live<ChatMessageItem[]> {
  const [state, setState] = useState<Live<ChatMessageItem[]> & { for: string | null }>({ data: [], loading: false, error: null, for: null });

  useEffect(() => {
    if (!access || !sessionId) return;
    const q = query(collection(access.db, "users", access.uid, "chatSessions", sessionId, "messages"), orderBy("at", "asc"));
    return onSnapshot(
      q,
      (snapshot) =>
        setState({
          for: sessionId,
          loading: false,
          error: null,
          data: snapshot.docs.map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              role: d.role === "assistant" ? "assistant" : "user",
              text: String(d.text ?? ""),
              citations: (d.citations ?? []) as Citation[],
              grounded: typeof d.grounded === "boolean" ? d.grounded : null,
              error: typeof d.error === "string" ? d.error : null,
            } satisfies ChatMessageItem;
          }),
        }),
      () => setState({ for: sessionId, data: [], loading: false, error: "We couldn't load this conversation." }),
    );
  }, [access, sessionId]);

  // Ignore results that belong to a conversation we've since left.
  if (!sessionId || state.for !== sessionId) return { data: [], loading: Boolean(sessionId && access), error: null };
  return state;
}

export function useAsk() {
  return useMutation({ mutationFn: chatApi.ask, meta: { silent: true } }); // errors are shown inline in the chat
}

export function useDeleteChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.deleteSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.firebaseClient, refetchType: "none" }),
  });
}
