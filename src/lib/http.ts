import { NextResponse } from "next/server";

export function json<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function error(
  code: string,
  message: string,
  status: number,
  details?: unknown,
): NextResponse {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

export function unauthorized(message = "Unauthorized") {
  return error("UNAUTHORIZED", message, 401);
}

export function forbidden(message = "Forbidden") {
  return error("FORBIDDEN", message, 403);
}

export function notFound(message = "Not Found") {
  return error("NOT_FOUND", message, 404);
}

export function badRequest(message: string, details?: unknown) {
  return error("BAD_REQUEST", message, 400, details);
}

export function conflict(message: string) {
  return error("CONFLICT", message, 409);
}
