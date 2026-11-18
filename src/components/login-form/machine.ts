export const loginStates = [
  "empty",
  "submitting",
  "success",
  "invalid",
  "locked",
  "offline",
] as const;

export type LoginState = (typeof loginStates)[number];

export type LoginResume = Exclude<LoginState, "offline">;

export type LoginEvent =
  | { type: "EDIT" }
  | { type: "SUBMIT" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SUBMIT_INVALID" }
  | { type: "SUBMIT_LOCKED" }
  | { type: "UNLOCK" }
  | { type: "RESET" }
  | { type: "GO_OFFLINE" }
  | { type: "GO_ONLINE"; resume: LoginResume };

export function loginTransition(state: LoginState, event: LoginEvent): LoginState {
  switch (state) {
    case "empty":
      if (event.type === "SUBMIT") return "submitting";
      if (event.type === "GO_OFFLINE") return "offline";
      return state;
    case "submitting":
      if (event.type === "SUBMIT_SUCCESS") return "success";
      if (event.type === "SUBMIT_INVALID") return "invalid";
      if (event.type === "SUBMIT_LOCKED") return "locked";
      if (event.type === "GO_OFFLINE") return "offline";
      return state;
    case "success":
      if (event.type === "RESET") return "empty";
      if (event.type === "GO_OFFLINE") return "offline";
      return state;
    case "invalid":
      if (event.type === "EDIT") return "empty";
      if (event.type === "SUBMIT") return "submitting";
      if (event.type === "GO_OFFLINE") return "offline";
      return state;
    case "locked":
      if (event.type === "UNLOCK") return "empty";
      if (event.type === "GO_OFFLINE") return "offline";
      return state;
    case "offline":
      if (event.type === "GO_ONLINE") {
        return event.resume === "submitting" ? "empty" : event.resume;
      }
      return state;
  }
}
