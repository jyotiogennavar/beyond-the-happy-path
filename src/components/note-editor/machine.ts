export const noteStates = [
  "idle",
  "editing",
  "saving",
  "saved",
  "error",
  "offline",
] as const;

export type NoteState = (typeof noteStates)[number];

export type NoteEvent =
  | { type: "EDIT" }
  | { type: "SAVE" }
  | { type: "SAVE_SUCCESS" }
  | { type: "SAVE_ERROR" }
  | { type: "GO_OFFLINE" }
  | { type: "GO_ONLINE"; hasPending: boolean }
  | { type: "RETRY" };

export function noteTransition(state: NoteState, event: NoteEvent): NoteState {
  switch (state) {
    case "idle":
      if (event.type === "EDIT") return "editing";
      if (event.type === "GO_OFFLINE") return "offline";
      return state;
    case "editing":
      if (event.type === "SAVE") return "saving";
      if (event.type === "GO_OFFLINE") return "offline";
      return state;
    case "saving":
      if (event.type === "SAVE_SUCCESS") return "saved";
      if (event.type === "SAVE_ERROR") return "error";
      if (event.type === "GO_OFFLINE") return "offline";
      return state;
    case "saved":
      if (event.type === "EDIT") return "editing";
      if (event.type === "GO_OFFLINE") return "offline";
      return state;
    case "error":
      if (event.type === "RETRY" || event.type === "SAVE") return "saving";
      if (event.type === "EDIT") return "editing";
      if (event.type === "GO_OFFLINE") return "offline";
      return state;
    case "offline":
      if (event.type === "GO_ONLINE") {
        return event.hasPending ? "saving" : "idle";
      }
      return state;
  }
}
