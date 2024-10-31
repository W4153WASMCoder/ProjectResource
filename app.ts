// Import necessary modules with types
import * as dotenv from "dotenv";
import express from "express";
import type { Application } from "express";
import http, { Server as HttpServer } from "http";
import fs from "fs";
import { generate_routes } from "./routes/router.js";
// for projects microservice
import project_router from "./routes/projects.js";
import project_files_router from "./routes/project_files.js";
import swagger from "./swagger.js";
import pool from "./db.js";
import type { Express } from "express";

// Load environment variables from .env file
dotenv.config();

// Express app instantiation
const app: Application = express();

// Instantiate handlers for http and https
const httpServer: HttpServer = http.createServer(app);
//const httpsServer = https.createServer(credentials, app);

//Middleware Definition
app.use(express.static("./static"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
generate_routes(app);
// for projects microservice
app.use("/projects", project_router);
app.use("/project_files", project_files_router);
swagger(app as Express);
//End Middleware definition
//
//Start Server
console.log(
    "Starting up server on ports: " +
    process.env.PORT +
    ", " +
    process.env.PORTSSL,
);
httpServer.listen(process.env.PORT, () =>
    console.log("Server started listening on port: " + process.env.PORT),
);
//httpsServer.listen(process.env.PORTSSL,() => console.log('Server started listening on port: '+process.env.PORTSSL));