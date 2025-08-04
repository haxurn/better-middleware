import type { NextApiResponse } from "next";
import {
  withAuthAndMethod,
  type AuthenticatedNextApiRequest,
} from "../../lib/auth-middleware";

interface DataResponse {
  message: string;
  requestedBy: string;
  timestamp: string;
  receivedData: any;
  framework: string;
}

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<DataResponse>,
) {
  const { user, body } = req;

  res.status(200).json({
    message: "Data endpoint accessed successfully",
    requestedBy: user!.email,
    timestamp: new Date().toISOString(),
    receivedData: body,
    framework: "Next.js",
  });
}

export default withAuthAndMethod("POST", handler);
