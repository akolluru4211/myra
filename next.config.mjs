/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
  async redirects() {
    return [
      // 1. Authentication Duplicates
      { source: "/auth/login", destination: "/login", permanent: true },
      { source: "/auth/signup", destination: "/signup", permanent: true },

      // 2. Learning & Projects Duplicates
      { source: "/problems", destination: "/dsa", permanent: true },
      { source: "/practice", destination: "/dsa", permanent: true },
      { source: "/showcase", destination: "/dsa", permanent: true },
      { source: "/projectstudio", destination: "/projects", permanent: true },

      // 3. Directory & Networking Duplicates
      { source: "/networking", destination: "/network", permanent: true },
      { source: "/college", destination: "/colleges", permanent: true },

      // 4. Ambassador Hub Duplicate
      { source: "/ambassador/hub", destination: "/ambassador", permanent: true },

      // 5. Branding Assistant Duplicate
      { source: "/branding-assistant", destination: "/career/branding", permanent: true },

      // 6. Verification / Certificate Duplicate
      { source: "/certificate/:certificateId*", destination: "/verify/:certificateId*", permanent: true },

      // 7. Portfolio Duplicate
      { source: "/portfolio/:username", destination: "/u/:username/portfolio", permanent: true },

      // 8. Public Marketing Relocations
      { source: "/for-career", destination: "/for/students", permanent: true },
      { source: "/for-college", destination: "/for/colleges", permanent: true },
      { source: "/for-professionals", destination: "/for/professionals", permanent: true },
      { source: "/sector-landing/:sector*", destination: "/sector/:sector*", permanent: true },

      // 9. Employer & Applications Consolidations
      { source: "/jobs/employer", destination: "/employer/jobs", permanent: true },
      { source: "/jobs/applications", destination: "/career/applications", permanent: true },

      // 10. Loose Career & Settings Relocations
      { source: "/offers/compare", destination: "/career/offers/compare", permanent: true },
      { source: "/billing", destination: "/settings/billing", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=()",
          },
          {
            key: "X-Permitted-Cross-Domain-Policies",
            value: "none",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
