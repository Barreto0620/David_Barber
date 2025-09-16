/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'export' para desenvolvimento normal
  // output: 'export', // Comente esta linha para desenvolvimento
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true 
  },
  
  // Configuração do Webpack
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.ignoreWarnings = [
        { module: /node_modules\/@supabase\/realtime-js/ },
      ];
    }
    return config;
  },
  
  // Configurações experimentais para App Router
  experimental: {
    appDir: true,
  },
};

module.exports = nextConfig;