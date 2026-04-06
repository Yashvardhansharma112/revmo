import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enforce HTTPS in production
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent MIME type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Enable HSTS with upgrade of insecure requests
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; upgrade-insecure-requests" },
          // Control referrer information
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Restrict browser features
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Content Security Policy - strict restrictive policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Restrict scripts - only self and necessary origins
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Styles only from self
              "style-src 'self' 'unsafe-inline'",
              // Images from self and data URIs only
              "img-src 'self' data: blob:",
              // Fonts from self only
              "font-src 'self' data:",
              // Connect to specific allowed APIs only
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              // Prevent all framing
              "frame-ancestors 'none'",
              // Form actions to self only
              "form-action 'self'",
              // Base URI restricted
              "base-uri 'self'",
              // Prevent object-src (Flash etc)
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  // Note: HTTP to HTTPS redirect is handled by Vercel platform automatically
  // No need to configure it here - it can cause "Invalid redirect found" errors
};

export default nextConfig;
