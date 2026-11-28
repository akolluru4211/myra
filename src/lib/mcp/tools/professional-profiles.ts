import { MCPToolDefinition } from "../types";
import { fetchGitHubProfileData, verifyLinkedInProfile } from "@/lib/services/social-integrations";

const studentRoles = ["CLIENT", "STUDENT", "WORKING_PROFESSIONAL"] as any;

export const professionalProfileTools: MCPToolDefinition[] = [
  {
    name: "github.get_profile",
    domain: "developer",
    description: "Retrieve public GitHub profile, repository, language, and activity summary.",
    requiredRoles: studentRoles,
    parameters: {
      username: { type: "string", description: "GitHub username or profile URL.", required: true },
    },
    isSensitive: false,
    handler: async (params) => {
      const result = await fetchGitHubProfileData(typeof params?.username === "string" ? params.username : "");
      return { success: result.success, data: result.data, error: result.error, statusCode: result.success ? 200 : 404 };
    },
  },
  {
    name: "linkedin.validate_profile",
    domain: "career",
    description: "Validate a LinkedIn profile URL without scraping or collecting credentials.",
    requiredRoles: studentRoles,
    parameters: {
      profileUrl: { type: "string", description: "Public LinkedIn profile URL.", required: true },
    },
    isSensitive: false,
    handler: async (params) => {
      const result = verifyLinkedInProfile(typeof params?.profileUrl === "string" ? params.profileUrl : "");
      return { success: result.success, data: result.data, error: result.error, statusCode: result.success ? 200 : 400 };
    },
  },
];
