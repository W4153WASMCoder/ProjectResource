import type { Application, Request, Response, NextFunction } from "express";

export function generate_routes(app: Application) {
    app.get(
        "/data",
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                // Your route handling logic here
                res.send({ message: "Hello World" });
            } catch (error) {
                next(error);
            }
        },
    );
}
