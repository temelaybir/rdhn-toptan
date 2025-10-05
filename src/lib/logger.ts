import { createLogger, format, transports } from 'winston'
import path from 'path'

const { combine, timestamp, printf, colorize, errors, json } = format

const loggerTransports = []

// Üretim ortamında (Vercel) sadece konsola logla
if (process.env.NODE_ENV === 'production') {
  loggerTransports.push(new transports.Console({
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      json()
    )
  }))
} else {
  // Geliştirme ortamında (lokal) hem konsola hem de dosyaya logla
  const logDirectory = path.join(process.cwd(), 'logs')

  loggerTransports.push(new transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      printf(({ level, message, timestamp: ts, stack, ...metadata }) => {
        let log = `${ts} ${level}: ${message}`
        if (stack) {
          log += `\n${stack}`
        } else if (Object.keys(metadata).length) {
          log += ` ${JSON.stringify(metadata, null, 2)}`
        }
        return log
      })
    )
  }))

  loggerTransports.push(new transports.File({ 
    filename: path.join(logDirectory, 'error.log'), 
    level: 'error',
    format: combine(timestamp(), errors({ stack: true }), json())
  }))
  
  loggerTransports.push(new transports.File({ 
    filename: path.join(logDirectory, 'debug.log'),
    format: combine(timestamp(), errors({ stack: true }), json())
  }))
}

const logger = createLogger({
  level: 'debug',
  transports: loggerTransports,
  exitOnError: false,
})

export { logger } 