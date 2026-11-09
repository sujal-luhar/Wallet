export interface TxActionResponse{
  success: boolean;
  id?: string;       // Transaction ID
  error?: string;    // Optional error message
}