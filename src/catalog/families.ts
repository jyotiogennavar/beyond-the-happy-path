export const families = [
  { id: "crud", label: "01 — CRUD" },
  { id: "async", label: "02 — Async actions" },
  { id: "fetch", label: "03 — Data fetching" },
  { id: "communication", label: "04 — Communication" },
  { id: "transactions", label: "05 — Transactions" },
  { id: "connectivity", label: "06 — Connectivity" },
] as const;

export type FamilyId = (typeof families)[number]["id"];
