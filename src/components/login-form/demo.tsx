"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Stage } from "@/catalog/stage";
import { useMachine } from "@/catalog/use-machine";
import { LoginForm } from "./login-form";
import {
  loginStates,
  loginTransition,
  type LoginEvent,
  type LoginResume,
  type LoginState,
} from "./machine";

type Outcome = "success" | "invalid" | "locked";

const signInDelayMs = 700;

export function LoginDemo() {
  const outcomeId = useId();
  const { state, send: dispatch, jump: jumpTo } = useMachine(loginTransition, "empty");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [outcome, setOutcome] = useState<Outcome>("success");
  const outcomeRef = useRef<Outcome>("success");
  const attempt = useRef(0);
  const pending = useRef(false);
  const beforeOffline = useRef<LoginResume>("empty");

  function remember(next: LoginState) {
    if (next === "offline" || next === "submitting") return;
    beforeOffline.current = next;
  }

  function send(event: LoginEvent) {
    if (event.type === "SUBMIT") {
      attempt.current += 1;
      pending.current = true;
    }
    if (event.type === "GO_OFFLINE") {
      attempt.current += 1;
      pending.current = false;
      remember(state);
    }
    if (event.type === "RESET") setPassword("");
    dispatch(event);
  }

  function jump(next: LoginState) {
    attempt.current += 1;
    pending.current = false;
    if (next === "offline") remember(state);
    else remember(next);
    if (next !== "empty") {
      setEmail((current) => (current.trim() === "" ? "ada@ferry.test" : current));
      setPassword((current) => (current === "" ? "ferry-light" : current));
    }
    jumpTo(next);
  }

  function toggleConnection() {
    if (state === "offline") {
      send({ type: "GO_ONLINE", resume: beforeOffline.current });
      return;
    }
    send({ type: "GO_OFFLINE" });
  }

  useEffect(() => {
    if (state !== "submitting" || !pending.current) return;
    const id = attempt.current;
    const result = outcomeRef.current;
    const timeout = window.setTimeout(() => {
      if (id !== attempt.current) return;
      pending.current = false;
      if (result === "invalid") dispatch({ type: "SUBMIT_INVALID" });
      else if (result === "locked") dispatch({ type: "SUBMIT_LOCKED" });
      else dispatch({ type: "SUBMIT_SUCCESS" });
    }, signInDelayMs);
    return () => window.clearTimeout(timeout);
  }, [state, dispatch]);

  return (
    <Stage
      id="login-form"
      title="Login form"
      summary="A sign-in can open the account, reject the credentials, or lock it. Offline, the email and password stay in the form until the connection returns."
      states={loginStates}
      state={state}
      onJump={jump}
      controls={
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <button
            type="button"
            onClick={toggleConnection}
            className="inline-flex h-11 min-w-28 cursor-pointer items-center justify-center rounded-md border border-border px-3 text-sm whitespace-nowrap transition-[transform,background-color] duration-150 ease-out hoverable:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-safe:active:scale-[0.96]"
          >
            {state === "offline" ? "Reconnect" : "Go offline"}
          </button>
          <button
            type="button"
            onClick={() => send({ type: "UNLOCK" })}
            disabled={state !== "locked"}
            className="inline-flex h-11 cursor-pointer items-center rounded-md border border-border px-3 text-sm whitespace-nowrap transition-[transform,background-color] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground enabled:hoverable:bg-foreground/5 motion-safe:active:scale-[0.96] disabled:cursor-not-allowed disabled:text-muted"
          >
            Unlock account
          </button>
          <label htmlFor={outcomeId} className="flex items-center gap-2 text-sm whitespace-nowrap">
            If you sign in
            <select
              id={outcomeId}
              value={outcome}
              onChange={(event) => {
                const next = event.target.value as Outcome;
                outcomeRef.current = next;
                setOutcome(next);
              }}
              className="h-8 cursor-pointer rounded-md border border-border bg-background px-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              <option value="success">Succeeds</option>
              <option value="invalid">Wrong password</option>
              <option value="locked">Locks the account</option>
            </select>
          </label>
        </div>
      }
    >
      <LoginForm
        state={state}
        email={email}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onEvent={send}
      />
    </Stage>
  );
}
