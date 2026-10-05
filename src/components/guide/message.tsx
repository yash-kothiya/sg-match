"use client";

import { BookOpenIcon, ChevronDownIcon, CircleAlertIcon, SparklesIcon } from "lucide-react";
import { useState } from "react";
import { SUGGESTED_QUESTIONS } from "@/config/constants";
import { cn } from "@/lib/utils";
import type { ChatMessageItem } from "@/schemas/chat";

function Citations({ citations }: { citations: ChatMessageItem["citations"] }) {
  const [open, setOpen] = useState<number | null>(null);
  if (citations.length === 0) return null;

  return (
    <div className="mt-3 flex flex-col gap-2">
      <ul className="flex flex-wrap gap-1.5" aria-label="Sources">
        {citations.map((citation, index) => (
          <li key={`${citation.documentTitle}-${citation.heading}`}>
            <button
              type="button"
              aria-expanded={open === index}
              onClick={() => setOpen(open === index ? null : index)}
              className={cn(
                "inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                open === index ? "border-primary bg-accent text-accent-foreground" : "bg-background hover:border-primary/50",
              )}
            >
              <BookOpenIcon className="size-3 shrink-0" aria-hidden />
              <span className="truncate">
                {citation.documentTitle} › {citation.heading}
              </span>
              <ChevronDownIcon className={cn("size-3 shrink-0 transition-transform", open === index && "rotate-180")} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      {open !== null && (
        <blockquote className="rounded-xl border-l-4 border-primary/40 bg-muted/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          {citations[open].snippet}
        </blockquote>
      )}
    </div>
  );
}

/** One chat bubble. Assistant answers show citation chips; refusals and errors look different on purpose. */
export function Message({ message, onAsk }: { message: ChatMessageItem; onAsk: (question: string) => void }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm whitespace-pre-line text-primary-foreground">
          {message.text}
        </p>
      </div>
    );
  }

  if (message.error) {
    return (
      <div className="flex gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <CircleAlertIcon className="size-4" aria-hidden />
        </span>
        <p className="max-w-[85%] rounded-2xl rounded-tl-md border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm">{message.text}</p>
      </div>
    );
  }

  const refused = message.grounded === false;
  return (
    <div className="flex gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar text-sidebar-primary">
        <SparklesIcon className="size-4" aria-hidden />
      </span>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl rounded-tl-md px-4 py-3 text-sm",
          refused ? "border border-dashed bg-muted/50" : "border bg-card shadow-sm",
        )}
      >
        <p className={cn("whitespace-pre-line", refused && "font-medium")}>{message.text}</p>
        {refused ? (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">I can answer questions about SG Match, study techniques and group etiquette. Try one of these:</p>
            <ul className="flex flex-wrap gap-1.5">
              {SUGGESTED_QUESTIONS.slice(0, 3).map((question) => (
                <li key={question}>
                  <button
                    type="button"
                    onClick={() => onAsk(question)}
                    className="cursor-pointer rounded-full border bg-background px-2.5 py-1 text-xs font-medium outline-none hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {question}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <Citations citations={message.citations} />
        )}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3" role="status" aria-label="The study guide is answering">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar text-sidebar-primary">
        <SparklesIcon className="size-4" aria-hidden />
      </span>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border bg-card px-4 py-3.5 shadow-sm">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-1.5 animate-bounce rounded-full bg-muted-foreground motion-reduce:animate-none"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
