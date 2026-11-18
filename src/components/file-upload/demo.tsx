"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Stage } from "@/catalog/stage";
import { useMachine } from "@/catalog/use-machine";
import { FileUpload, type UploadFile } from "./file-upload";
import {
  rejectionReason,
  uploadStates,
  uploadTransition,
  type UploadEvent,
  type UploadState,
} from "./machine";

const sampleFile: UploadFile = {
  name: "ferry-timetable.pdf",
  size: 1_480_320,
};

export function FileUploadDemo() {
  const failId = useId();
  const { state, send: dispatch, jump: jumpTo } = useMachine(
    uploadTransition,
    "empty",
  );
  const [file, setFile] = useState<UploadFile | null>(null);
  const [progress, setProgress] = useState(0);
  const [reason, setReason] = useState("Use an image or a PDF.");
  const [failNext, setFailNext] = useState(false);
  const failNextRef = useRef(false);
  const active = useRef(false);

  function send(event: UploadEvent) {
    if (event.type === "RETRY") {
      setProgress(0);
      active.current = true;
    }
    if (
      event.type === "CANCEL" ||
      event.type === "RESET" ||
      event.type === "FAIL"
    ) {
      active.current = false;
    }
    if (event.type === "RESET") {
      setFile(null);
      setProgress(0);
    }
    dispatch(event);
  }

  function begin(next: UploadFile) {
    setFile(next);
    setProgress(0);
    active.current = true;
    dispatch({ type: "FILE_ACCEPTED" });
  }

  function choose(picked: File) {
    setFile({ name: picked.name, size: picked.size });
    const problem = rejectionReason(picked);
    if (problem) {
      setReason(problem);
      active.current = false;
      dispatch({ type: "FILE_REJECTED" });
      return;
    }
    begin({ name: picked.name, size: picked.size });
  }

  function jump(next: UploadState) {
    active.current = false;
    if (next === "empty" || next === "selecting") {
      setFile(null);
      setProgress(0);
    } else if (next === "invalid") {
      setFile({ name: "voice-memo.mov", size: 2_400_000 });
      setReason("Use an image or a PDF.");
      setProgress(0);
    } else {
      setFile(sampleFile);
      setProgress(next === "uploading" || next === "error" || next === "cancelled" ? 42 : 100);
    }
    jumpTo(next);
  }

  useEffect(() => {
    if (state !== "uploading" || !active.current) return;

    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(100, current + 4));
    }, 80);

    return () => window.clearInterval(timer);
  }, [state]);

  useEffect(() => {
    if (state !== "uploading" || !active.current) return;

    if (failNextRef.current && progress >= 46) {
      active.current = false;
      failNextRef.current = false;
      setFailNext(false);
      dispatch({ type: "FAIL" });
      return;
    }

    if (progress >= 100) dispatch({ type: "UPLOAD_DONE" });
  }, [progress, state, dispatch]);

  useEffect(() => {
    if (state !== "processing" || !active.current) return;

    const timer = window.setTimeout(() => {
      active.current = false;
      dispatch({ type: "PROCESS_DONE" });
    }, 800);

    return () => window.clearTimeout(timer);
  }, [state, dispatch]);

  return (
    <Stage
      id="file-upload"
      title="File upload"
      summary="A file moves from the drop area through upload and processing. An image or PDF can be cancelled or fail and be retried; anything else is rejected."
      states={uploadStates}
      state={state}
      onJump={jump}
      controls={
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <button
            type="button"
            onClick={() => begin(sampleFile)}
            disabled={state === "uploading" || state === "processing"}
            className="inline-flex h-11 cursor-pointer items-center rounded-md border border-border px-3 text-sm whitespace-nowrap transition-[transform,background-color] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground enabled:hoverable:bg-foreground/5 motion-safe:active:scale-[0.96] disabled:cursor-not-allowed disabled:text-muted"
          >
            Upload a sample
          </button>
          <label
            htmlFor={failId}
            className="flex h-11 cursor-pointer items-center gap-2 text-sm"
          >
            <input
              id={failId}
              type="checkbox"
              checked={failNext}
              onChange={(event) => {
                failNextRef.current = event.target.checked;
                setFailNext(event.target.checked);
              }}
              className="size-4 accent-foreground"
            />
            Fail the next upload
          </label>
        </div>
      }
    >
      <FileUpload
        state={state}
        file={file}
        progress={progress}
        reason={reason}
        onEvent={send}
        onFile={choose}
      />
    </Stage>
  );
}
