import { JsonSchema } from 'e2e/utils/types/schema.types';

export type JsonPatchMove = { op: 'move'; from: string; path: string };
export type JsonPatchReplace = {
  op: 'replace';
  path: string;
  value: JsonSchema;
};
export type JsonPatchRemove = { op: 'remove'; path: string };
export type JsonPatchAdd = { op: 'add'; path: string; value: JsonSchema };

export type JsonPatch =
  | JsonPatchMove
  | JsonPatchReplace
  | JsonPatchRemove
  | JsonPatchAdd;
