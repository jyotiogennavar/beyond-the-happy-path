import type { ComponentType } from "react";
import { NoteDemo } from "@/components/note-editor/demo";
import type { FamilyId } from "./families";

export type CatalogEntry = {
  id: string;
  family: FamilyId;
  Demo: ComponentType;
};

export const catalog: CatalogEntry[] = [
  { id: "note-editor", family: "crud", Demo: NoteDemo },
];
