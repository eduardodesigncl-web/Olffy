export default {
  cacheComponents: true,
  // Cabeceras de seguridad básicas para todo el sitio. El admin además exige
  // sesión firmada (proxy.ts) y las API revalidan la sesión por endpoint.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
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
