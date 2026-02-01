export type NormalizedUsageRecord = {
  id: number;
  mnc: number | null;
  bytes_used: number;
  dmcc: string | null;
  cellid: number | null;
  ip: string | null;
};

export type ParseError = {
  lineNumber: number;
  line: string;
  message: string;
};
