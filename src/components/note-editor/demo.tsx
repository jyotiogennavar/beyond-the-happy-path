"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Stage } from "@/catalog/stage";
import { useMachine } from "@/catalog/use-machine";
import { noteStates, noteTransition, type NoteEvent, type NoteState } from "./machine";
import { NoteEditor } from "./note-editor";

const initialNote =
  "The ferry was late. The light on the water kept changing.";

const saveDelayMs = 700;

export function NoteDemo() {
  const failId = useId();
  const { state, send: dispatch, jump: jumpTo } = useMachine(noteTransition, "idle");
  const [value, setValue] = useState(initialNote);
  const [lastSaved, setLastSaved] = useState(initialNote);
  const [failNext, setFailNext] = useState(false);
  const failNextRef = useRef(false);
  const saveRequested = useRef(false);
  const pending = value !== lastSaved;

  function send(event: NoteEvent) {
    if (
      event.type === "SAVE" ||
      event.type === "RETRY" ||
      (event.type === "GO_ONLINE" && event.hasPending)
    ) {
      saveRequested.current = true;
    }
    dispatch(event);
  }

  function jump(next: NoteState) {
    saveRequested.current = false;
    jumpTo(next);
  }

  useEffect(() => {
    if (state !== "saving" || !saveRequested.current) return;

    const shouldFail = failNextRef.current;
    const note = value;
    const timeout = window.setTimeout(() => {
      saveRequested.current = false;
      if (shouldFail) {
        failNextRef.current = false;
        setFailNext(false);
        dispatch({ type: "SAVE_ERROR" });
        return;
      }
      setLastSaved(note);
      dispatch({ type: "SAVE_SUCCESS" });
    }, saveDelayMs);

    return () => window.clearTimeout(timeout);
  }, [state, dispatch, value]);

  function toggleConnection() {
    if (state === "offline") {
      send({ type: "GO_ONLINE", hasPending: pending });
      return;
    }
    send({ type: "GO_OFFLINE" });
  }

  return (
    <Stage
      id="note-editor"
      title="Note editor"
      summary="A note moves from editing to saving to saved. A failed save can be retried, and offline edits stay on the device until the connection returns."
      states={noteStates}
      state={state}
      onJump={jump}
      controls={
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <button
            type="button"
            onClick={toggleConnection}
            className="inline-flex h-11 cursor-pointer items-center rounded-md border border-border px-3 text-sm transition-[transform,background-color] duration-150 ease-out hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-safe:active:scale-[0.96]"
          >
            {state === "offline" ? "Reconnect" : "Go offline"}
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
            Fail the next save
          </label>
        </div>
      }
    >
      <NoteEditor
        state={state}
        value={value}
        pending={pending}
        onValueChange={setValue}
        onEvent={send}
      />
    </Stage>
  );
}
