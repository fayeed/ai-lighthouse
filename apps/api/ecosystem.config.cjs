// PM2 Ecosystem Configuration
// https://pm2.keymetrics.io/docs/usage/application-declaration/

module.exports = {
  apps: [{
    name: 'ai-lighthouse-api',
    script: 'src/index.ts',
    interpreter: 'node',
    interpreter_args: '--import tsx',
    instances: 1,
    exec_mode: 'cluster',
    
    // Auto-restart configuration
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    
    // Restart on crashes
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    // Exponential backoff restart delay
    exp_backoff_restart_delay: 100,
    
    // Error handling
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 3002,
    },
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
  }]
};
