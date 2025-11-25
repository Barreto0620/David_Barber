/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silenciar warnings do Supabase
  webpack: (config, { isServer }) => {
    // Ignorar warnings de dependências dinâmicas do Supabase
    config.ignoreWarnings = [
      {
        module: /node_modules\/@supabase\//,
        message: /Critical dependency/,
      },
    ];

    return config;
  },

  // Outras configurações (se você já tiver)
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;