/** @type {import('next').NextConfig} */
module.exports = {
  output: 'standalone',
  reactStrictMode: true,
  async rewrites() {
    return [{ source: '/favicon.ico', destination: '/icon.svg' }];
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = config.watchOptions || {};
      config.watchOptions.poll = 300;
    }
    return config;
  },
};
