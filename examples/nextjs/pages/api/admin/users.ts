import type { NextApiResponse } from "next";
import {
  withRole,
  type AuthenticatedNextApiRequest,
} from "../../../lib/auth-middleware";

interface User {
  id: string;
  email: string;
  role: string;
  createdAt?: string;
}

interface AdminUsersResponse {
  message: string;
  adminUser: string;
  users: User[];
  framework: string;
  timestamp: string;
}

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<AdminUsersResponse>,
) {
  const { user } = req;

  // Only allow GET method
  if (req.method !== "GET") {
    return res.status(405).json({
      message: `Method ${req.method} not allowed`,
      adminUser: user!.email,
      users: [],
      framework: "Next.js",
      timestamp: new Date().toISOString(),
    } as AdminUsersResponse);
  }

  // Mock user data - in a real app, this would come from a database
  const users: User[] = [
    {
      id: "1",
      email: "user1@example.com",
      role: "user",
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      email: "admin@example.com",
      role: "admin",
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "3",
      email: "moderator@example.com",
      role: "moderator",
      createdAt: "2024-01-15T00:00:00Z",
    },
  ];

  res.status(200).json({
    message: "Admin endpoint accessed successfully",
    adminUser: user!.email,
    users,
    framework: "Next.js",
    timestamp: new Date().toISOString(),
  });
}

// Require admin role to access this endpoint
export default withRole(["admin"], handler);
