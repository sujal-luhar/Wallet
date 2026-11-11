export type TxActionResponse<T = string> =
  | { success: true; id: T }
  | { success: false; error: string };

