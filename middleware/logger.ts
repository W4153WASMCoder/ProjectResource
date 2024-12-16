import { Request, Response, NextFunction } from "express";

export function log_init(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    const timestamp = new Date().toISOString();
    const uid = (req.get("uid") as string);
    // console.log(uid);
    console.log(
        `[${timestamp}] ${uid} : ${req.method} ${req.originalUrl} request being served.`,
    );
    next();
}
export function log_close(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    const timestamp = new Date().toISOString();
    const uid = req.uid;
    console.log(
        `[${timestamp}] ${uid} : ${req.method} ${req.originalUrl} request served.`,
    );

    next();
}
