/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        appDir: false, // Using pages directory for this example
    },
    typescript: {
        // Dangerously allow production builds to successfully complete even if type errors exist
        ignoreBuildErrors: false,
    },
    eslint: {
        // Warning: This allows production builds to successfully complete even if ESLint errors exist
        ignoreDuringBuilds: false,
    },
}

module.exports = nextConfig