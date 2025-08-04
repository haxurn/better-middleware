import type { NextApiRequest, NextApiResponse } from "next";

interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  framework: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>,
) {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    framework: "Next.js",
  });
}
