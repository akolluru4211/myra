import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://edworld.co.in";
  const lastModified = new Date();

  return [
    // 1. Public Marketing
    { url: `${baseUrl}`, lastModified, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/pricing`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/contact`, lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/for/students`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/for/colleges`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/for/professionals`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/sector/career`, lastModified, changeFrequency: "weekly", priority: 0.8 },

    // 2. Authentication & Onboarding
    { url: `${baseUrl}/login`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/signup`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/auth/forgot-password`, lastModified, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/auth/reset-password`, lastModified, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/onboarding`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/onboarding/student`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/onboarding/professional`, lastModified, changeFrequency: "monthly", priority: 0.6 },

    // 3. Student Workspace & Account
    { url: `${baseUrl}/dashboard`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/profile`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/settings/alerts`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/settings/billing`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/messages`, lastModified, changeFrequency: "daily", priority: 0.7 },

    // 4. Public Profiles & Verification
    { url: `${baseUrl}/verify`, lastModified, changeFrequency: "monthly", priority: 0.7 },

    // 5. Career Readiness
    { url: `${baseUrl}/career`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/career/roadmap`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/career/readiness`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/career/skills-gap`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/career/timeline`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/career/branding`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/career/scam-checker`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/career/offers/compare`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/career/applications`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/career/documents`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/career/evidence`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/career/interview-prep`, lastModified, changeFrequency: "weekly", priority: 0.8 },

    // 6. Resumes
    { url: `${baseUrl}/resumes`, lastModified, changeFrequency: "weekly", priority: 0.9 },

    // 7. Interviews & Assessments
    { url: `${baseUrl}/interviews`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/interviews/panel`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/interviews/language-training`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/interviews/reflection`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/interview-experiences`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/aptitude`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/leadership-assessment`, lastModified, changeFrequency: "weekly", priority: 0.8 },

    // 8. Learning & Projects
    { url: `${baseUrl}/learn`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/dsa`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/projects`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/edbuild`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/focus`, lastModified, changeFrequency: "daily", priority: 0.8 },

    // 9. Jobs & Directory
    { url: `${baseUrl}/jobs`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/colleges`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/network`, lastModified, changeFrequency: "daily", priority: 0.9 },

    // 10. Employer Portal
    { url: `${baseUrl}/employer/dashboard`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/employer/jobs`, lastModified, changeFrequency: "weekly", priority: 0.8 },

    // 11. Internal Portals
    { url: `${baseUrl}/admin`, lastModified, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/ambassador`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/founder`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/hr`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/hr/provision-account`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/employee`, lastModified, changeFrequency: "weekly", priority: 0.7 },

    // 12. Legal & Consent
    { url: `${baseUrl}/privacy`, lastModified, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/cookies`, lastModified, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/refund`, lastModified, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/consent/verify`, lastModified, changeFrequency: "monthly", priority: 0.4 },
  ];
}
