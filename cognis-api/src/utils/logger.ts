import pino from 'pino';
import { LOG_LEVEL, IS_DEVELOPMENT } from '../config/env.js';

// Configure logger
const logger = pino({
  level: LOG_LEVEL,
  transport: IS_DEVELOPMENT
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  redact: ['req.headers.authorization', 'req.body.password', '*.password', '*.apiKey'],
});

export default logger;
