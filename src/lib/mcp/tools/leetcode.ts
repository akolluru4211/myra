import { MCPToolDefinition } from "../types";
import { fetchLeetCodeProfileData } from "@/lib/services/social-integrations";

/** Read-only LeetCode profile lookup used for career context and Myra guidance. */
export const leetcodeTools: MCPToolDefinition[] = [
  {
    name: "leetcode.get_profile",
    domain: "developer",
    description: "Retrieve a public LeetCode profile summary for the authenticated student.",
    requiredRoles: ["CLIENT", "STUDENT", "WORKING_PROFESSIONAL"] as any,
    parameters: {
      username: {
        type: "string",
        description: "LeetCode username or profile URL.",
        required: true,
      },
    },
    isSensitive: false,
    handler: async (params) => {
      const username = typeof params?.username === "string" ? params.username : "";
      const result = await fetchLeetCodeProfileData(username);
      return {
        success: result.success,
        data: result.data,
        error: result.error,
        statusCode: result.success ? 200 : 404,
      };
    },
  },
];
