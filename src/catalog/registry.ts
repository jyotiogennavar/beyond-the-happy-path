import type { ComponentType } from "react";
import { FileUploadDemo } from "@/components/file-upload/demo";
import { LoginDemo } from "@/components/login-form/demo";
import { NoteDemo } from "@/components/note-editor/demo";
import type { FamilyId } from "./families";

export type CatalogEntry = {
  id: string;
  family: FamilyId;
  Demo: ComponentType;
};

export const catalog: CatalogEntry[] = [
  { id: "note-editor", family: "crud", Demo: NoteDemo },
  { id: "file-upload", family: "async", Demo: FileUploadDemo },
  { id: "login-form", family: "connectivity", Demo: LoginDemo },
];
