export class TouiError extends Error {
  /** HTTP status returned by the toui.io API. */
  readonly status: number;
  /** Error code surfaced by the API when present. */
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'TouiError';
    this.status = status;
    this.code = code;
  }
}
