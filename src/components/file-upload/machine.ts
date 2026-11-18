export const uploadStates = [
  "empty",
  "selecting",
  "invalid",
  "uploading",
  "processing",
  "success",
  "error",
  "cancelled",
] as const;

export type UploadState = (typeof uploadStates)[number];

export type UploadEvent =
  | { type: "BROWSE" }
  | { type: "DRAG_ENTER" }
  | { type: "DRAG_LEAVE" }
  | { type: "DISMISS" }
  | { type: "FILE_ACCEPTED" }
  | { type: "FILE_REJECTED" }
  | { type: "UPLOAD_DONE" }
  | { type: "PROCESS_DONE" }
  | { type: "FAIL" }
  | { type: "CANCEL" }
  | { type: "RETRY" }
  | { type: "RESET" };

export function uploadTransition(
  state: UploadState,
  event: UploadEvent,
): UploadState {
  switch (state) {
    case "empty":
      if (event.type === "BROWSE" || event.type === "DRAG_ENTER") return "selecting";
      if (event.type === "FILE_ACCEPTED") return "uploading";
      if (event.type === "FILE_REJECTED") return "invalid";
      return state;
    case "selecting":
      if (event.type === "DRAG_LEAVE" || event.type === "DISMISS") return "empty";
      if (event.type === "FILE_ACCEPTED") return "uploading";
      if (event.type === "FILE_REJECTED") return "invalid";
      return state;
    case "invalid":
      if (event.type === "BROWSE" || event.type === "DRAG_ENTER") return "selecting";
      if (event.type === "FILE_ACCEPTED") return "uploading";
      if (event.type === "RESET") return "empty";
      return state;
    case "uploading":
      if (event.type === "UPLOAD_DONE") return "processing";
      if (event.type === "FAIL") return "error";
      if (event.type === "CANCEL") return "cancelled";
      return state;
    case "processing":
      if (event.type === "PROCESS_DONE") return "success";
      if (event.type === "FAIL") return "error";
      return state;
    case "success":
      if (event.type === "RESET") return "empty";
      if (event.type === "FILE_ACCEPTED") return "uploading";
      if (event.type === "FILE_REJECTED") return "invalid";
      return state;
    case "error":
      if (event.type === "RETRY" || event.type === "FILE_ACCEPTED") return "uploading";
      if (event.type === "FILE_REJECTED") return "invalid";
      if (event.type === "RESET") return "empty";
      return state;
    case "cancelled":
      if (event.type === "RETRY" || event.type === "FILE_ACCEPTED") return "uploading";
      if (event.type === "FILE_REJECTED") return "invalid";
      if (event.type === "RESET") return "empty";
      return state;
  }
}

export const maxUploadBytes = 8 * 1024 * 1024;
export const maxUploadLabel = "8 MB";

export function rejectionReason(file: File): string | null {
  const name = file.name.toLowerCase();
  const allowedType =
    file.type.startsWith("image/") || file.type === "application/pdf";
  const allowedName = /\.(png|jpe?g|gif|webp|avif|svg|pdf)$/.test(name);
  if (!allowedType && !allowedName) return "Use an image or a PDF.";
  if (file.size > maxUploadBytes) {
    return `That file is larger than ${maxUploadLabel}.`;
  }
  return null;
}
