import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";

const PUBLIC: RegExp[] = [
  /^\/api\/auth\/(login|register)$/,
];

const ADMIN_ONLY: RegExp[] = [
  /^\/api\/reports(\/.*)?$/,
  /^\/api\/admin(\/.*)?$/,
];

const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";

function applyCors(res: NextResponse): NextResponse {
  res.headers.set("Access-Control-Allow-Origin", CORS_ORIGIN);
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH",
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, Accept",
  );
  res.headers.set("Access-Control-Max-Age", "86400");
  return res;
}

export async function middleware(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return applyCors(new NextResponse(null, { status: 204 }));
  }

  const { pathname } = req.nextUrl;

  if (req.method === "GET" && pathname === "/api/companies") {
    return applyCors(NextResponse.next());
  }
  if (PUBLIC.some((r) => r.test(pathname))) {
    return applyCors(NextResponse.next());
  }

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return applyCors(
      new NextResponse(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Missing bearer token" } }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    );
  }

  try {
    const payload = await verifyToken(auth.slice(7));
    const role = String(payload.role);

    if (
      ADMIN_ONLY.some((r) => r.test(pathname)) &&
      role !== "ROLE_ADMIN" &&
      role !== "ROLE_COMPANY_ADMIN"
    ) {
      return applyCors(
        new NextResponse(JSON.stringify({ error: { code: "FORBIDDEN", message: "Admin only" } }), {
          status: 403,
          headers: { "content-type": "application/json" },
        }),
      );
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", String(payload.uid));
    requestHeaders.set("x-user-email", String(payload.sub));
    requestHeaders.set("x-user-role", role);

    return applyCors(NextResponse.next({ request: { headers: requestHeaders } }));
  } catch {
    return applyCors(
      new NextResponse(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Invalid token" } }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    );
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
