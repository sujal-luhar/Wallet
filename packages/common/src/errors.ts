// Errors whose message is safe to show to the user.
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppError";
  }
}

// Ref: https://dev.to/armorbreak/error-handling-in-nodejs-beyond-trycatch-2026-4d3h