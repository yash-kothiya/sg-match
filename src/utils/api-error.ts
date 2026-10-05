export class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string>,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}
