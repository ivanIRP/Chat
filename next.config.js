/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['nodemailer', 'bcryptjs'],
  },
}

module.exports = nextConfig
