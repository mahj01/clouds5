import type { Request, Response } from "express";
import {
  getIdTokenFromAuthHeader,
  verifyIdToken,
} from "../services/auth.service";

export async function me(req: Request, res: Response) {
  try {
    const idToken = getIdTokenFromAuthHeader(req.header("authorization"));
    if (!idToken) {
      return res.status(401).json({ error: "Missing Bearer token" });
    }

    const user = await verifyIdToken(idToken);
    return res.json({ user });
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export async function verify(req: Request, res: Response) {
  try {
    const idToken = (req.body?.idToken as string | undefined) ?? undefined;
    if (!idToken) {
      return res.status(400).json({ error: "Missing idToken in body" });
    }

    const user = await verifyIdToken(idToken);
    return res.json({ user });
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
