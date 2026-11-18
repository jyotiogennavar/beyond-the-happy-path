"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

type StageProps<S extends string> = {
  id: string;
  title: string;
  summary: string;
  states: readonly S[];
  state: S;
  onJump: (state: S) => void;
  children: ReactNode;
  controls?: ReactNode;
};

function stateLabel(state: string) {
  return state.charAt(0).toUpperCase() + state.slice(1);
}

export function Stage<S extends string>({
  id,
  title,
  summary,
  states,
  state,
  onJump,
  children,
  controls,
}: StageProps<S>) {
  const titleId = `${id}-title`;

  return (
    <MotionConfig reducedMotion="user">
      <article className="flex flex-col gap-8" aria-labelledby={titleId}>
        <header className="flex max-w-prose flex-col gap-2">
          <h3
            id={titleId}
            className="text-balance font-sans text-2xl font-normal tracking-[-0.015em]"
          >
            {title}
          </h3>
          <p className="text-pretty text-sm leading-relaxed text-muted">{summary}</p>
        </header>
        {children}
        <footer className="flex flex-col gap-4 border-t border-border pt-4 [border-top-width:var(--line)]">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted">States</p>
            <div
              role="group"
              aria-label={`${title} states`}
              className="flex flex-wrap gap-1"
            >
              {states.map((item) => {
                const selected = item === state;
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onJump(item)}
                    className={`h-11 cursor-pointer border-b px-3 text-sm transition-[color,border-color,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-safe:active:scale-[0.96] ${
                      selected
                        ? "border-foreground text-foreground"
                        : "border-transparent text-muted hoverable:text-foreground"
                    }`}
                  >
                    {stateLabel(item)}
                  </button>
                );
              })}
            </div>
          </div>
          {controls}
        </footer>
      </article>
    </MotionConfig>
  );
}
