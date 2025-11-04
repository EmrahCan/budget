module.exports = {
  apps: [
    {
      name: 'budget-backend',
      script: './backend/server.js',
      cwd: '/Users/emrahcercioglu/Documents/Butce/budget',
      env: {
        NODE_ENV: 'development',
        PORT: 5002,
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_NAME: 'budget_app',
        DB_USER: 'postgres',
        DB_PASSWORD: 'password123',
        JWT_SECRET: 'budget_app_super_secret_jwt_key_2024',
        JWT_EXPIRES_IN: '7d',
        FRONTEND_URL: 'http://localhost:3001',
        GEMINI_API_KEY: 'AIzaSyC9JlhE9djALEg6lPurAbV0PpWY-KdAK1g',
        GEMINI_MODEL: 'gemini-1.5-pro'
      },
      watch: false,
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'budget-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/Users/emrahcercioglu/Documents/Butce/budget/frontend',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        REACT_APP_API_URL: 'http://localhost:5002/api',
        REACT_APP_ENVIRONMENT: 'development',
        REACT_APP_DEBUG: 'true'
      },
      watch: false,
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    }
  ]
};