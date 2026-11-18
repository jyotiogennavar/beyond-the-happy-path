"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CircleAlert, CircleCheck } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  maxUploadLabel,
  type UploadEvent,
  type UploadState,
} from "./machine";

const statusEase = [0.19, 1, 0.22, 1] as const;

export type UploadFile = {
  name: string;
  size: number;
};

type FileUploadProps = {
  state: UploadState;
  file: UploadFile | null;
  progress: number;
  reason: string;
  onEvent: (event: UploadEvent) => void;
  onFile: (file: File) => void;
};

const primaryButton =
  "inline-flex h-11 w-full shrink-0 items-center justify-center rounded-md border px-4 text-sm whitespace-nowrap transition-[transform,color,background-color,border-color] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground enabled:cursor-pointer enabled:border-foreground enabled:bg-foreground enabled:text-background enabled:hoverable:bg-[color-mix(in_oklch,var(--foreground)_88%,var(--background))] motion-safe:enabled:active:scale-[0.96] disabled:border-border disabled:text-muted sm:w-auto sm:min-w-36";

const quietButton =
  "inline-flex h-11 w-full shrink-0 cursor-pointer items-center justify-center rounded-md border border-border px-4 text-sm whitespace-nowrap transition-[transform,background-color] duration-150 ease-out hoverable:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-safe:active:scale-[0.96] sm:w-auto sm:min-w-36";

const compactButton =
  "inline-flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border px-2.5 text-sm whitespace-nowrap transition-[transform,background-color] duration-150 ease-out hoverable:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-safe:active:scale-[0.96]";

function formatBytes(bytes: number) {
  const kilobytes = bytes / 1024;
  if (kilobytes < 1) return `${bytes} B`;
  const megabytes = kilobytes / 1024;
  if (megabytes < 1) {
    return `${kilobytes < 10 ? kilobytes.toFixed(1) : Math.round(kilobytes)} KB`;
  }
  return `${megabytes < 10 ? megabytes.toFixed(1) : Math.round(megabytes)} MB`;
}

function liveMessage(state: UploadState, reason: string) {
  switch (state) {
    case "selecting":
      return "Choosing a file.";
    case "invalid":
      return reason;
    case "uploading":
      return "Uploading.";
    case "processing":
      return "Processing.";
    case "success":
      return "Uploaded.";
    case "error":
      return "Couldn’t upload this file.";
    case "cancelled":
      return "Upload cancelled.";
    case "empty":
      return "";
  }
}

function statusCopy(state: UploadState, progress: number) {
  switch (state) {
    case "uploading":
      return `Uploading… ${Math.round(progress)}%`;
    case "processing":
      return "Processing…";
    case "success":
      return "Uploaded";
    case "error":
      return "Couldn’t upload this file. Try again.";
    case "cancelled":
      return "Upload cancelled.";
    default:
      return "";
  }
}

function zoneCopy(
  state: UploadState,
  dragging: boolean,
  file: UploadFile | null,
  reason: string,
) {
  if (dragging) {
    return {
      title: "Release to upload.",
      detail: `Image or PDF, up to ${maxUploadLabel}.`,
      danger: false,
    };
  }
  if (state === "invalid") {
    return {
      title: file?.name ?? "That file can’t be uploaded.",
      detail: reason,
      danger: true,
    };
  }
  if (state === "selecting") {
    return {
      title: "Choosing a file…",
      detail: `Image or PDF, up to ${maxUploadLabel}.`,
      danger: false,
    };
  }
  return {
    title: "Drop an image or PDF, or choose a file.",
    detail: `Up to ${maxUploadLabel}.`,
    danger: false,
  };
}

function borderClass(state: UploadState, dragging: boolean) {
  if (dragging || state === "selecting") return "border-foreground";
  if (state === "success") return "border-success-border";
  if (state === "invalid" || state === "error") return "border-danger-border";
  return "border-border";
}

function acceptsDrag(state: UploadState) {
  return state === "empty" || state === "invalid" || state === "selecting";
}

export function FileUpload({
  state,
  file,
  progress,
  reason,
  onEvent,
  onFile,
}: FileUploadProps) {
  const reduceMotion = useReducedMotion() === true;
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);
  const onEventRef = useRef(onEvent);
  const fileInput = useRef<HTMLInputElement>(null);
  const zone =
    state === "empty" || state === "selecting" || state === "invalid";
  const clamped = Math.max(0, Math.min(100, progress));
  const copy = zoneCopy(state, dragging && zone, file, reason);

  if (!zone && dragging) setDragging(false);

  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    if (zone) return;
    depth.current = 0;
  }, [zone]);

  useEffect(() => {
    const input = fileInput.current;
    if (!input) return;
    const onCancel = () => onEventRef.current({ type: "DISMISS" });
    input.addEventListener("cancel", onCancel);
    return () => input.removeEventListener("cancel", onCancel);
  }, [zone]);

  function onDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!acceptsDrag(state)) return;
    depth.current += 1;
    if (depth.current > 1) return;
    setDragging(true);
    onEvent({ type: "DRAG_ENTER" });
  }

  function onDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (depth.current === 0) return;
    depth.current -= 1;
    if (depth.current > 0) return;
    setDragging(false);
    onEvent({ type: "DRAG_LEAVE" });
  }

  function onDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = zone ? "copy" : "none";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    depth.current = 0;
    setDragging(false);
    if (!zone) return;
    const dropped = event.dataTransfer.files.item(0);
    if (dropped) onFile(dropped);
    else onEvent({ type: "DRAG_LEAVE" });
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.item(0) ?? null;
    event.target.value = "";
    if (picked) onFile(picked);
  }

  const action =
    state === "uploading"
      ? { label: "Cancel", event: { type: "CANCEL" } as const, className: quietButton }
      : state === "error"
        ? { label: "Retry", event: { type: "RETRY" } as const, className: primaryButton }
        : state === "cancelled"
          ? { label: "Upload again", event: { type: "RETRY" } as const, className: primaryButton }
          : state === "success"
            ? { label: "Upload another", event: { type: "RESET" } as const, className: compactButton }
            : null;

  return (
    <div
      className={`w-full max-w-xl rounded-lg border bg-background has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-foreground ${borderClass(state, dragging && zone)}`}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <p className="sr-only" aria-live="polite">
        {liveMessage(state, reason)}
      </p>
      {zone ? (
        <label className="flex min-h-[9.5rem] cursor-pointer flex-col justify-center gap-1 px-3 py-4 text-left sm:min-h-[7.25rem]">
          <input
            ref={fileInput}
            type="file"
            accept="image/*,application/pdf,.pdf"
            className="sr-only"
            onClick={() => onEvent({ type: "BROWSE" })}
            onChange={onInputChange}
          />
          <span
            className={`text-sm ${copy.danger ? "truncate text-foreground" : "text-foreground"}`}
          >
            {copy.title}
          </span>
          <span
            className={`flex items-start gap-2 text-sm ${copy.danger ? "text-danger" : "text-muted"}`}
          >
            {copy.danger ? (
              <CircleAlert className="pointer-events-none mt-0.5 size-4 shrink-0" aria-hidden />
            ) : null}
            <span>{copy.detail}</span>
          </span>
        </label>
      ) : (
        <div className="flex flex-col gap-3 px-3 py-3">
          <div className="flex items-baseline justify-between gap-4">
            <p className="min-w-0 truncate text-sm">{file?.name ?? "File"}</p>
            <p className="shrink-0 text-sm text-muted tabular-nums">
              {file ? formatBytes(file.size) : ""}
            </p>
          </div>
          {state === "uploading" || state === "processing" ? (
            <div
              className="relative h-1 overflow-hidden rounded-full bg-border"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={state === "uploading" ? Math.round(clamped) : undefined}
              aria-valuetext={statusCopy(state, clamped)}
              aria-label={file?.name ?? "Upload"}
            >
              {state === "uploading" ? (
                <div
                  className="h-full w-full origin-left bg-foreground motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out"
                  style={{ transform: `scaleX(${clamped / 100})` }}
                />
              ) : reduceMotion ? (
                <div className="h-full w-2/5 bg-foreground" />
              ) : (
                <motion.div
                  className="absolute inset-y-0 left-0 w-1/3 bg-foreground"
                  animate={{ x: ["-100%", "320%"] }}
                  transition={{
                    duration: 1.1,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}
            </div>
          ) : null}
          <div className="flex min-h-11 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-6 flex-1">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={state}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: statusEase }}
                  className={`flex items-start gap-2 text-sm ${
                    state === "error"
                      ? "text-danger"
                      : state === "success"
                        ? "text-success"
                        : "text-muted"
                  }`}
                >
                  {state === "success" ? (
                    <CircleCheck className="pointer-events-none mt-0.5 size-4 shrink-0" aria-hidden />
                  ) : null}
                  {state === "error" ? (
                    <CircleAlert className="pointer-events-none mt-0.5 size-4 shrink-0" aria-hidden />
                  ) : null}
                  <span className="tabular-nums">
                    {state === "uploading" ? (
                      <>
                        Uploading…{" "}
                        <span className="inline-block w-[3ch] text-right">
                          {Math.round(clamped)}
                        </span>
                        {"%"}
                      </>
                    ) : (
                      statusCopy(state, clamped)
                    )}
                  </span>
                </motion.p>
              </AnimatePresence>
            </div>
            {action ? (
              <button
                type="button"
                onClick={() => onEvent(action.event)}
                className={action.className}
              >
                {action.label}
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
