"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CircleAlert, CloudOff, LoaderCircle } from "lucide-react";
import {
  useId,
  type KeyboardEventHandler,
  type Ref,
  type TextareaHTMLAttributes,
} from "react";
import { type NoteEvent, type NoteState } from "./machine";

const statusEase = [0.19, 1, 0.22, 1] as const;

type NoteEditorProps = {
  state: NoteState;
  value: string;
  pending: boolean;
  onEvent: (event: NoteEvent) => void;
  onValueChange: (value: string) => void;
  ref?: Ref<HTMLTextAreaElement>;
} & Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "defaultValue" | "onChange" | "children"
>;

function statusMessage(state: NoteState, pending: boolean) {
  switch (state) {
    case "idle":
      return "Up to date";
    case "editing":
      return "Unsaved changes";
    case "saving":
      return "Saving…";
    case "saved":
      return "Saved";
    case "error":
      return "Couldn’t save this note. Try again.";
    case "offline":
      return pending
        ? "Offline. These edits will save when you reconnect."
        : "You’re offline. This note is up to date.";
  }
}

function saveLabel(state: NoteState) {
  if (state === "saving") return "Saving…";
  if (state === "error") return "Retry save";
  return "Save note";
}

export function NoteEditor({
  state,
  value,
  pending,
  onEvent,
  onValueChange,
  ref,
  id,
  onKeyDown,
  className,
  ...props
}: NoteEditorProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const statusId = `${fieldId}-status`;
  const reduceMotion = useReducedMotion() === true;
  const invalid = state === "error";
  const canSave = state === "editing" || state === "error";

  function requestSave() {
    if (state === "error") {
      onEvent({ type: "RETRY" });
      return;
    }
    if (state === "editing") onEvent({ type: "SAVE" });
  }

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      requestSave();
    }
  };

  return (
    <form
      className="flex w-full max-w-xl flex-col gap-3"
      aria-busy={state === "saving"}
      onSubmit={(event) => {
        event.preventDefault();
        requestSave();
      }}
    >
      <label htmlFor={fieldId} className="text-sm">
        Note
      </label>
      <textarea
        {...props}
        ref={ref}
        id={fieldId}
        name="note"
        value={value}
        rows={6}
        autoComplete="off"
        data-lpignore="true"
        data-1p-ignore="true"
        readOnly={state === "saving"}
        aria-invalid={invalid}
        aria-describedby={statusId}
        aria-keyshortcuts="Control+Enter"
        placeholder="Write a note…"
        onChange={(event) => {
          onValueChange(event.target.value);
          onEvent({ type: "EDIT" });
        }}
        onKeyDown={handleKeyDown}
        className={`w-full resize-y rounded-lg border bg-background px-3 py-3 font-serif text-base leading-relaxed text-foreground transition-[border-color] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${
          invalid
            ? "border-danger-border"
            : "border-border hoverable:border-foreground/25"
        }${className ? ` ${className}` : ""}`}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div id={statusId} aria-live="polite" className="min-h-6 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={state === "offline" && pending ? "offline-pending" : state}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: statusEase }}
              className={`flex items-start gap-2 text-sm ${
                invalid ? "text-danger" : "text-muted"
              }`}
            >
              {state === "saving" ? (
                <LoaderCircle
                  className="pointer-events-none mt-0.5 size-4 shrink-0 motion-safe:animate-spin"
                  aria-hidden
                />
              ) : null}
              {state === "error" ? (
                <CircleAlert className="pointer-events-none mt-0.5 size-4 shrink-0" aria-hidden />
              ) : null}
              {state === "offline" ? (
                <CloudOff className="pointer-events-none mt-0.5 size-4 shrink-0" aria-hidden />
              ) : null}
              <span>
                {statusMessage(state, pending)}
                {state === "editing" ? (
                  <span className="text-muted"> · Ctrl+Enter</span>
                ) : null}
              </span>
            </motion.p>
          </AnimatePresence>
        </div>
        <button
          type="submit"
          disabled={!canSave}
          className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-md border px-4 text-sm transition-[transform,color,background-color,border-color] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground enabled:cursor-pointer enabled:border-foreground enabled:bg-foreground enabled:text-background enabled:hoverable:bg-[color-mix(in_oklch,var(--foreground)_88%,var(--background))] motion-safe:enabled:active:scale-[0.96] disabled:border-border disabled:text-muted sm:w-36"
        >
          {saveLabel(state)}
        </button>
      </div>
    </form>
  );
}
