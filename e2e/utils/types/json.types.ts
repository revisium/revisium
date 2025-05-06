export type JsonObject = { [Key in string]?: JsonValue };

export type JsonPrimitives = string | number | boolean;

export interface JsonArray extends Array<JsonValue> {}

export type JsonValue = JsonPrimitives | JsonObject | JsonArray | null;
