export interface ILogger {
    info(message: string): void;
    warn(message: string): void;
    debug(message: string): void;
    error(message: string): void;
}

export const consoleLogger: ILogger = console     
    