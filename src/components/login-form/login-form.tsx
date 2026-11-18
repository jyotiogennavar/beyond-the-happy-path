"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CircleAlert, CloudOff, LoaderCircle } from "lucide-react";
import { useId, useRef, useState, type FormEvent } from "react";
import { type LoginEvent, type LoginState } from "./machine";

const statusEase = [0.19, 1, 0.22, 1] as const;

type LoginFormProps = {
  state: LoginState;
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onEvent: (event: LoginEvent) => void;
};

const fieldClass =
  "w-full rounded-lg border bg-background px-3 py-3 text-base text-foreground transition-[border-color] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

const primaryButton =
  "inline-flex h-11 w-full shrink-0 items-center justify-center rounded-md border px-4 text-sm whitespace-nowrap transition-[transform,color,background-color,border-color] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground enabled:cursor-pointer enabled:border-foreground enabled:bg-foreground enabled:text-background enabled:hoverable:bg-[color-mix(in_oklch,var(--foreground)_88%,var(--background))] motion-safe:enabled:active:scale-[0.96] disabled:border-border disabled:text-muted sm:w-auto sm:min-w-32";

const quietButton =
  "inline-flex h-11 w-full shrink-0 cursor-pointer items-center justify-center rounded-md border border-border px-4 text-sm whitespace-nowrap transition-[transform,background-color] duration-150 ease-out hoverable:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-safe:active:scale-[0.96] sm:w-auto";

function emailProblem(value: string) {
  const email = value.trim();
  if (email === "") return "Enter your email.";
  if (!/^\S+@\S+\.\S+$/.test(email)) return "Enter a valid email.";
  return null;
}

function statusMessage(state: LoginState, email: string) {
  switch (state) {
    case "submitting":
      return "Signing in…";
    case "success":
      return email.trim() ? `Signed in as ${email.trim()}.` : "Signed in.";
    case "invalid":
      return "That email or password isn’t right.";
    case "locked":
      return "Too many attempts. This account is locked for now.";
    case "offline":
      return "You’re offline. Your email and password stay here until you reconnect.";
    case "empty":
      return "";
  }
}

export function LoginForm({
  state,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onEvent,
}: LoginFormProps) {
  const reduceMotion = useReducedMotion() === true;
  const emailId = useId();
  const passwordId = useId();
  const emailErrorId = useId();
  const passwordErrorId = useId();
  const statusId = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [visible, setVisible] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [fieldState, setFieldState] = useState(state);
  if (state !== fieldState) {
    setFieldState(state);
    setEmailError(null);
    setPasswordError(null);
  }
  const frozen = state === "submitting" || state === "success" || state === "locked";
  const canSubmit = state === "empty" || state === "invalid";
  const message = statusMessage(state, email);
  const emailDescribedBy = [emailError ? emailErrorId : null, statusId]
    .filter(Boolean)
    .join(" ");
  const passwordDescribedBy = [passwordError ? passwordErrorId : null, statusId]
    .filter(Boolean)
    .join(" ");

  function requestSubmit() {
    if (!canSubmit) return;
    const nextEmail = emailProblem(email);
    const nextPassword = password === "" ? "Enter your password." : null;
    setEmailError(nextEmail);
    setPasswordError(nextPassword);
    if (nextEmail) {
      emailRef.current?.focus();
      return;
    }
    if (nextPassword) {
      passwordRef.current?.focus();
      return;
    }
    onEvent({ type: "SUBMIT" });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    requestSubmit();
  }

  return (
    <form
      className="flex w-full max-w-xl flex-col gap-4"
      aria-busy={state === "submitting"}
      noValidate
      onSubmit={onSubmit}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor={emailId} className="text-sm">
          Email
        </label>
        <input
          ref={emailRef}
          id={emailId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          readOnly={frozen}
          value={email}
          aria-invalid={Boolean(emailError) || state === "invalid"}
          aria-describedby={emailDescribedBy}
          onChange={(event) => {
            onEmailChange(event.target.value);
            if (emailError) setEmailError(null);
            if (state === "invalid") onEvent({ type: "EDIT" });
          }}
          className={`${fieldClass} ${
            emailError || state === "invalid"
              ? "border-danger-border"
              : "border-border hoverable:border-foreground/25"
          }`}
        />
        {emailError ? (
          <p id={emailErrorId} className="flex items-start gap-2 text-sm text-danger">
            <CircleAlert className="pointer-events-none mt-0.5 size-4 shrink-0" aria-hidden />
            {emailError}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor={passwordId} className="text-sm">
          Password
        </label>
        <div className="relative">
          <input
            ref={passwordRef}
            id={passwordId}
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            readOnly={frozen}
            value={password}
            enterKeyHint="go"
            aria-invalid={Boolean(passwordError) || state === "invalid"}
            aria-describedby={passwordDescribedBy}
            onChange={(event) => {
              onPasswordChange(event.target.value);
              if (passwordError) setPasswordError(null);
              if (state === "invalid") onEvent({ type: "EDIT" });
            }}
            className={`${fieldClass} pr-16 ${
              passwordError || state === "invalid"
                ? "border-danger-border"
                : "border-border hoverable:border-foreground/25"
            }`}
          />
          <button
            type="button"
            aria-pressed={visible}
            aria-label={visible ? "Hide password" : "Show password"}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setVisible((current) => !current)}
            className="absolute inset-y-0 right-0 flex w-16 cursor-pointer items-center justify-center text-sm text-muted transition-[color,transform] duration-150 ease-out hoverable:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-safe:active:scale-[0.96]"
          >
            {visible ? "Hide" : "Show"}
          </button>
        </div>
        {passwordError ? (
          <p
            id={passwordErrorId}
            className="flex items-start gap-2 text-sm text-danger"
          >
            <CircleAlert className="pointer-events-none mt-0.5 size-4 shrink-0" aria-hidden />
            {passwordError}
          </p>
        ) : null}
      </div>
      <div className="flex min-h-11 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div id={statusId} aria-live="polite" className="min-h-6 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            {message ? (
              <motion.p
                key={state}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: statusEase }}
                className={`flex items-start gap-2 text-sm ${
                  state === "invalid" || state === "locked" ? "text-danger" : "text-muted"
                }`}
              >
                {state === "submitting" ? (
                  <LoaderCircle
                    className="pointer-events-none mt-0.5 size-4 shrink-0 motion-safe:animate-spin"
                    aria-hidden
                  />
                ) : null}
                {state === "invalid" || state === "locked" ? (
                  <CircleAlert className="pointer-events-none mt-0.5 size-4 shrink-0" aria-hidden />
                ) : null}
                {state === "offline" ? (
                  <CloudOff className="pointer-events-none mt-0.5 size-4 shrink-0" aria-hidden />
                ) : null}
                <span>{message}</span>
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
        {state === "success" ? (
          <button
            type="button"
            onClick={() => {
              onEvent({ type: "RESET" });
              emailRef.current?.focus();
            }}
            className={quietButton}
          >
            Use a different account
          </button>
        ) : (
          <button type="submit" disabled={!canSubmit} className={primaryButton}>
            {state === "submitting" ? "Signing in…" : state === "invalid" ? "Try again" : "Sign in"}
          </button>
        )}
      </div>
    </form>
  );
}
