/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["pg"],
  async redirects() {
    return [{ source: "/measure", destination: "/results", permanent: true }];
  },
};

export default nextConfig;
