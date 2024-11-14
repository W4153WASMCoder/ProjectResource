# ProjectResource
Here's a `README.md` for your TypeScript Express app:

# TypeScript Express Project

This project is a TypeScript-based Express application for managing resources in `db_project_resource`.

## Prerequisites

- Node.js (v14 or higher recommended)
- npm (comes with Node.js)
- MySQL (to set up the database)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory and add the following details:

```env
DATABASE_HOST="localhost"
DATABASE_USER="root"
DATABASE_PASSWORD=""
DATABASE_NAME="db_project_resource"
PORT=8080
```

Adjust the values as per your local database configuration.

### 3. Install Dependencies

```bash
npm install
```

### 4. Build the Project

To compile TypeScript files, run:

```bash
npm run build
```

The compiled JavaScript files will be in the `dist/` folder.

### 5. Run the Application

- **Production:** Run the compiled code with Node.js:
  ```bash
  npm start
  ```

- **Development:** Use `ts-node-dev` for hot-reloading in development:
  ```bash
  npm run dev
  ```

### 6. Access the API

Once running, the app is accessible at `http://localhost:8080` (or the port specified in your `.env` file).

## Project Structure

- `./app.ts`: Main application file
- `./middleware/pagination.ts`: Middleware for pagination
- `./models/files_models.ts`: Database models for file management
- `./routes/projects.ts`: Routes for project-related endpoints
- `./routes/project_files.ts`: Routes for project file management
- `./swagger.ts`: Swagger setup for API documentation

## Additional Scripts

- **Build**: `npm run build` - Compiles TypeScript to JavaScript.
- **Start**: `npm start` - Runs the compiled app in production.
- **Dev**: `npm run dev` - Starts the app in development mode with hot-reloading.

