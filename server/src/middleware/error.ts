import { Request, Response, NextFunction } from 'express';
import { ServerError } from '../types';

export const errorHandler = (
    err: ServerError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error(err);

    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal server error',
            status: err.status || 500
        }
    });
};