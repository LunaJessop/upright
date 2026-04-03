import type { NextFunction, Request, Response } from "express";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(err);
    return;
  }
  const e = err as { statusCode?: number; code?: string; message?: string };
  if (e.code === "23505") {
    res.status(409).json({ error: "Conflict", detail: e.message });
    return;
  }
  if (e.code === "23503") {
    res.status(400).json({ error: "Foreign key violation", detail: e.message });
    return;
  }
  if (e.statusCode === 400) {
    res.status(400).json({ error: e.message ?? "Bad request" });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
