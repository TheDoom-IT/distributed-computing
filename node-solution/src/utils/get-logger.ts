import {createLogger, format, transports} from 'winston';

export function getLogger(nodeId: string) {
    const logger = createLogger({
        level: 'info',
        format: format.combine(
            format.splat(),
            format.simple()
        ),
        transports: [
            new transports.File({filename: `${nodeId}-logs.log`}),
        ]
    });

    if (process.env.NODE_ENV !== 'production') {
        logger.add(new transports.Console({
            format: format.simple(),
        }));
    }

    return logger
}
