/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mantém as configurações originais
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },

  // Adiciona a configuração do Webpack
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.ignoreWarnings = [
        { module: /node_modules\/@supabase\/realtime-js/ },
      ];
    }
    return config;
  },
};

module.exports = nextConfig;