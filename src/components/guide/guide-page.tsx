"use client";

import { CircleAlertIcon, LoaderCircleIcon, MessageSquarePlusIcon, MessagesSquareIcon, SendIcon, SparklesIcon, Trash2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CHAT_MAX_MESSAGE_LENGTH, SUGGESTED_QUESTIONS } from "@/config/constants";
import { useAsk, useChatMessages, useChatSessions, useDeleteChat, useFirebaseAccess } from "@/hooks/guide";
import { cn } from "@/lib/utils";
import type { ChatMessageItem, ChatSessionItem } from "@/schemas/chat";
import { ApiClientError } from "@/utils";
import { Message, TypingIndicator } from "./message";

type ChatFailure = { message: string; question: string };

const FRIENDLY: Record<string, string> = {
  RATE_LIMITED: "Slow down a little, then try again.",
  QUOTA_EXCEEDED: "The study guide is busy right now. Try again in a minute.",
  TIMEOUT: "The study guide took too long to answer. Try again.",
  LLM_UNAVAILABLE: "The study guide is unavailable right now. Your question wasn't lost.",
  KB_EMPTY: "The study guide isn't set up yet.",
};

function SessionRow({ session, active, onOpen, onDelete }: { session: ChatSessionItem; active: boolean; onOpen: () => void; onDelete: () => void }) {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-current={active ? "true" : undefined}
        onClick={onOpen}
        className={cn(
          "flex w-full cursor-pointer flex-col gap-0.5 rounded-xl border p-3 pr-10 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          active ? "border-primary bg-accent" : "border-transparent hover:bg-muted/70",
        )}
      >
        <span className="line-clamp-2 text-sm leading-snug font-medium">{session.title}</span>
        {session.updatedAt && <span className="text-xs text-muted-foreground">{session.updatedAt.toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>}
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete conversation: ${session.title}`}
        className="absolute top-2.5 right-2 flex size-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-destructive/10 hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Trash2Icon className="size-4" aria-hidden />
      </button>
    </div>
  );
}

export function GuidePage() {
  const access = useFirebaseAccess();
  const sessions = useChatSessions(access.data);
  const ask = useAsk();
  const deleteChat = useDeleteChat();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [failure, setFailure] = useState<ChatFailure | null>(null);
  // Used only when Firestore can't save history: keeps the conversation visible in this tab.
  const [local, setLocal] = useState<ChatMessageItem[]>([]);
  const [historyDown, setHistoryDown] = useState(false);
  // The latest question and answer, shown from the API response until the live Firestore list catches up
  // (the server saves the answer after responding). `base` is how many stored messages existed when it was asked.
  const [answered, setAnswered] = useState<{ base: number; items: ChatMessageItem[] } | null>(null);
  const [toDelete, setToDelete] = useState<ChatSessionItem | null>(null);
  const [draft, setDraft] = useState("");
  const [showList, setShowList] = useState(false);

  const live = useChatMessages(access.data, activeId);
  const bottom = useRef<HTMLDivElement>(null);

  const stored = live.data;
  const lastStored = stored.at(-1);
  // The server saves the question before answering, so the live list may already contain it.
  const pendingAlreadyShown = pending !== null && lastStored?.role === "user" && lastStored.text === pending;
  const notYetStored = answered ? answered.items.slice(Math.max(0, stored.length - answered.base)) : [];
  const messages = [...stored, ...notYetStored, ...local];
  const busy = ask.isPending;

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending, failure]);

  const send = (question: string) => {
    const text = question.trim();
    if (!text || busy) return;
    setDraft("");
    setFailure(null);
    setAnswered(null);
    setPending(text);
    const base = activeId ? stored.length : 0;
    ask.mutate(
      { sessionId: activeId ?? undefined, message: text },
      {
        onSuccess: (response) => {
          setPending(null);
          const items: ChatMessageItem[] = [
            { id: `u-${Date.now()}`, role: "user", text, citations: [], grounded: null, error: null },
            { id: `a-${Date.now()}`, role: "assistant", text: response.answer, citations: response.citations, grounded: response.grounded, error: null },
          ];
          if (response.historySaved) {
            setHistoryDown(false);
            setActiveId(response.sessionId);
            setAnswered({ base, items });
          } else {
            setHistoryDown(true);
            setLocal((current) => [...current, ...items]);
          }
        },
        onError: (error) => {
          setPending(null);
          const code = error instanceof ApiClientError ? error.code : undefined;
          setFailure({ question: text, message: (code && FRIENDLY[code]) || error.message });
        },
      },
    );
  };

  const newChat = () => {
    setActiveId(null);
    setLocal([]);
    setAnswered(null);
    setPending(null);
    setFailure(null);
    setShowList(false);
  };

  const empty = messages.length === 0 && pending === null && !failure;

  return (
    <div className="grid gap-4 lg:-m-5 lg:h-[calc(100svh-2.5rem)] lg:grid-cols-[19rem_minmax(0,1fr)]">
      {/* Conversations */}
      <aside
        aria-label="Conversations"
        className={cn("flex-col overflow-hidden rounded-3xl border bg-card shadow-sm lg:flex lg:h-full lg:min-h-0", showList ? "flex max-lg:max-h-80" : "hidden")}
      >
        <div className="flex items-center justify-between gap-3 border-b px-4 py-4">
          <h2 className="font-heading text-lg font-semibold">Conversations</h2>
          <Button size="sm" onClick={newChat}>
            <MessageSquarePlusIcon aria-hidden />
            New chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2.5">
          {access.isPending || (!access.isError && sessions.loading) ? (
            <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading conversations">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : access.isError || sessions.error ? (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              Your past conversations can&apos;t be loaded right now. You can still ask new questions.
            </p>
          ) : sessions.data.length === 0 ? (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">No conversations yet. Ask your first question.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {sessions.data.map((session) => (
                <li key={session.id}>
                  <SessionRow
                    session={session}
                    active={session.id === activeId}
                    onOpen={() => {
                      setActiveId(session.id);
                      setLocal([]);
                      setAnswered(null);
                      setFailure(null);
                      setShowList(false);
                    }}
                    onDelete={() => setToDelete(session)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Chat */}
      <section aria-label="Study guide chat" className="flex min-h-[70svh] min-w-0 flex-col overflow-hidden rounded-3xl border bg-card shadow-sm lg:h-full lg:min-h-0">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-sidebar text-sidebar-primary">
              <SparklesIcon className="size-4" aria-hidden />
            </span>
            <div className="flex flex-col">
              <h1 className="font-heading text-lg leading-tight font-semibold">Study guide</h1>
              <p className="text-xs text-muted-foreground">Answers come only from the SG Match guide, with sources.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setShowList((open) => !open)} aria-expanded={showList}>
            <MessagesSquareIcon aria-hidden />
            Chats
          </Button>
        </header>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto bg-muted/30 p-5 lg:min-h-0" aria-live="polite">
          {historyDown && (
            <p className="flex items-center gap-2 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-xs font-medium">
              <CircleAlertIcon className="size-4 shrink-0" aria-hidden />
              This conversation isn&apos;t being saved right now. It will disappear when you leave the page.
            </p>
          )}
          {live.error && <p className="text-sm text-muted-foreground">{live.error}</p>}

          {empty && !live.loading ? (
            <div className="m-auto flex max-w-xl flex-col items-center gap-5 py-6 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-sidebar text-sidebar-primary shadow-sm">
                <SparklesIcon className="size-7" aria-hidden />
              </span>
              <div className="flex flex-col gap-1.5">
                <h2 className="font-heading text-2xl font-semibold">Ask the study guide</h2>
                <p className="text-sm text-muted-foreground">
                  How SG Match works, study techniques, running good group sessions. If the guide doesn&apos;t cover it, it will say so.
                </p>
              </div>
              <ul className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_QUESTIONS.map((question) => (
                  <li key={question}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => send(question)}
                      className="cursor-pointer rounded-full border bg-card px-3.5 py-2 text-sm font-medium shadow-sm transition-colors outline-none hover:border-primary/50 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {question}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <>
              {live.loading && <Skeleton className="h-16 w-2/3 rounded-2xl" />}
              {messages.map((message) => (
                <Message key={message.id} message={message} onAsk={send} />
              ))}
              {pending !== null && !pendingAlreadyShown && (
                <Message message={{ id: "pending", role: "user", text: pending, citations: [], grounded: null, error: null }} onAsk={send} />
              )}
              {busy && <TypingIndicator />}
              {failure && !busy && (
                <div role="alert" className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
                  <CircleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
                  <div className="flex flex-1 flex-col gap-2">
                    <p>{failure.message}</p>
                    <Button variant="outline" size="sm" className="w-fit" onClick={() => send(failure.question)}>
                      Try again
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={bottom} />
        </div>

        <form
          className="shrink-0 border-t bg-card p-4"
          onSubmit={(event) => {
            event.preventDefault();
            send(draft);
          }}
        >
          <div className="flex items-end gap-3">
            <label className="flex-1">
              <span className="sr-only">Your question</span>
              <textarea
                value={draft}
                rows={1}
                maxLength={CHAT_MAX_MESSAGE_LENGTH}
                disabled={busy}
                placeholder="Ask a question…"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send(draft);
                  }
                }}
                className="max-h-36 min-h-11 w-full resize-none rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60 [field-sizing:content]"
              />
            </label>
            <Button type="submit" size="lg" disabled={busy || draft.trim().length === 0} aria-label="Send question">
              {busy ? <LoaderCircleIcon className="animate-spin" aria-hidden /> : <SendIcon aria-hidden />}
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
          <p className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>Enter to send, Shift+Enter for a new line.</span>
            <span className={cn("tabular-nums", draft.length > CHAT_MAX_MESSAGE_LENGTH - 50 && "text-warning-foreground")}>
              {draft.length}/{CHAT_MAX_MESSAGE_LENGTH}
            </span>
          </p>
        </form>
      </section>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete this conversation?"
        description={
          <>
            <strong className="font-medium text-foreground">{toDelete?.title}</strong> and all its messages will be removed. This can&apos;t be undone.
          </>
        }
        confirmLabel="Delete conversation"
        pendingLabel="Deleting…"
        pending={deleteChat.isPending}
        onConfirm={() => {
          if (!toDelete) return;
          const session = toDelete;
          deleteChat.mutate(session.id, {
            onSuccess: () => {
              toast.success("Conversation deleted");
              if (activeId === session.id) newChat();
              setToDelete(null);
            },
          });
        }}
      />
    </div>
  );
}
