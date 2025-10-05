const path = require('path')

// Public HTML git repo yapısını tespit et
const isInPublicHtml = __dirname.includes('public_html')
const projectRoot = __dirname

module.exports = {
  apps: [
    {
      name: 'catkapinda',
      script: './server.js',
      cwd: projectRoot, // Working directory'yi belirt
      instances: 'max', // CPU core sayısına göre instance oluştur
      exec_mode: 'cluster',
      
      // Environment ayarları
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
        PROJECT_ROOT: projectRoot
      },
      
      // Development environment
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        HOSTNAME: 'localhost',
        PROJECT_ROOT: projectRoot
      },
      
      // Production environment
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
        PROJECT_ROOT: projectRoot
      },

      // Performans ayarları
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      
      // Log ayarları - Public HTML'e göre ayarlandı
      log_file: path.join(projectRoot, 'logs', 'combined.log'),
      out_file: path.join(projectRoot, 'logs', 'out.log'),
      error_file: path.join(projectRoot, 'logs', 'error.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Process yönetimi
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,
      
      // Health check
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Monitoring
      pmx: true,
      vizion: false,
      
      // Cluster ayarları
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Watch ayarları - Git repo için
      ignore_watch: [
        'node_modules',
        '.next',
        'logs',
        '*.log',
        '.git',
        '.env*',
        'screenshots',
        'public/images'
      ],
      
      // Cron restart (opsiyonel - günlük restart)
      // cron_restart: '0 2 * * *', // Her gün saat 02:00'da restart
      
      // Script args
      args: [],
      
      // Source map support
      source_map_support: true,
      
      // Instance var
      instance_var: 'INSTANCE_ID',
      
      // Graceful shutdown
      kill_timeout: 5000,
      shutdown_with_message: true,
      
      // Git repo için özel ayarlar
      combine_logs: true,
      log_type: 'json',
      
      // Public HTML hosting için ek ayarlar
      ...(isInPublicHtml && {
        // Public HTML'de ise özel konfigürasyon
        env_production: {
          ...this?.env_production,
          PUBLIC_HTML_MODE: 'true',
          HOSTING_MODE: 'shared'
        }
      })
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo.git',
      path: isInPublicHtml ? '/public_html' : '/var/www/production',
      'pre-deploy-local': '',
      'post-deploy': `cd ${isInPublicHtml ? 'commerce' : '.'} && npm install && npm run build && pm2 reload ecosystem.config.js --env production`,
      'pre-setup': '',
      'post-setup': 'ls -la'
    },
    
    // Git pull tabanlı deployment
    git_update: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo.git',
      path: '/public_html',
      'pre-deploy-local': '',
      'post-deploy': 'cd commerce && npm install && npm run build && npm run pm2:restart',
      'pre-setup': ''
    }
  },

  // PM2 Plus monitoring ayarları (opsiyonel)
  monitoring: {
    http: true,
    https: false,
    port: 9615
  }
} 