export default {
  cacheComponents: true,
  // Rutas legacy de producto y carrito → frontend oficial. Resueltas a nivel
  // de servidor, sin renderizar nada.
  async redirects() {
    return [
      {
        source: "/producto/:handle",
        destination: "/tienda/:handle",
        permanent: true,
      },
      {
        source: "/product/:handle",
        destination: "/tienda/:handle",
        permanent: true,
      },
      {
        source: "/carrito",
        destination: "/checkout",
        permanent: false,
      },
    ];
  },
  experimental: {
    inlineCss: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [62, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/s/files/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};
