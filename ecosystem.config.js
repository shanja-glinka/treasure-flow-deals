module.exports = {
  apps: [
    {
      name: 'deals-service',
      script: './dist/main.js',
      env_file: './.env',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 8162,
      },
    },
  ],
};
