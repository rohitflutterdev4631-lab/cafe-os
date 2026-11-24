/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'images.unsplash.com',
      'res.cloudinary.com',
      'images.openai.com',
      'plus.unsplash.com'
    ],
  },
  async rewrites() {
    return [
      {
        source: '/nordic-roast',
        destination: '/c/nordic-roast',
      },
      {
        source: '/nordic-roast/checkout',
        destination: '/c/nordic-roast/checkout',
      },
      {
        source: '/nordic-roast/orders/:orderNumber*',
        destination: '/c/nordic-roast/orders/:orderNumber*',
      },
    ];
  },
};

module.exports = nextConfig;
