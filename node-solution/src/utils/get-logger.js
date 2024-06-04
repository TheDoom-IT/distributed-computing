import { createLogger, format, transports } from 'winston';

export function getLogger() {
    const logger =  createLogger({
        level: 'info',
        format: format.combine(
            format.splat(),
            format.simple()
        ),
        transports: [
            new transports.File({ filename: 'logs.log' }),
        ]
    });

    logger.add(new transports.Console({
        format: format.simple(),
    }));

    return logger
}
