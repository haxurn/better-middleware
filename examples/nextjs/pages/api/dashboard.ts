import type { NextApiResponse } from "next";
import {
  withAuthAndMethod,
  type AuthenticatedNextApiRequest,
} from "../../lib/auth-middleware";

interface DashboardResponse {
  message: string;
  userId: string;
  sessionId: string;
  framework: string;
  timestamp: string;
}

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<DashboardResponse>,
) {
  const { user, session } = req;

  res.status(200).json({
    message: `Welcome to your dashboard, ${user!.name || user!.email}!`,
    userId: user!.id,
    sessionId: session!.id,
    framework: "Next.js",
    timestamp: new Date().toISOString(),
  });
}

export default withAuthAndMethod("GET", handler);
