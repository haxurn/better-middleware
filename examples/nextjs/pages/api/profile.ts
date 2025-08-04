import type { NextApiResponse } from "next";
import {
  withAuthAndMethod,
  type AuthenticatedNextApiRequest,
} from "../../lib/auth-middleware";

interface ProfileResponse {
  message: string;
  user: any;
  session: {
    id: string;
    expiresAt: string;
  };
  framework: string;
}

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<ProfileResponse>,
) {
  const { user, session } = req;

  res.status(200).json({
    message: "User profile retrieved successfully",
    user,
    session: {
      id: session!.id,
      expiresAt: session!.expiresAt,
    },
    framework: "Next.js",
  });
}

export default withAuthAndMethod("GET", handler);
