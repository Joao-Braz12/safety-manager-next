import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-me",
);

const EXP_MS = Number(process.env.JWT_EXPIRATION_MS ?? 86_400_000);

export interface AppJwtPayload extends JWTPayload {
  sub: string;
  uid: number;
  role: string;
}

export async function signToken(payload: {
  sub: string;
  uid: number;
  role: string;
}): Promise<string> {
  const expSeconds = Math.floor(Date.now() / 1000) + Math.floor(EXP_MS / 1000);
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expSeconds)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AppJwtPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as AppJwtPayload;
}
