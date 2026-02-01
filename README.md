# Hologram CDR Processing System

A small end-to-end system for ingesting CDR files, parsing mixed record formats, storing normalized usage records, and exposing the data via API and UI.

## Architecture

- API: Node.js + TypeScript + Express  
  Handles file upload, parsing, validation, and persistence.

- Database: PostgreSQL  
  Stores normalized usage records.

- ORM: Prisma  
  Used for schema management and database access.

- UI: React (Vite)  
  Simple interface for health, upload, and record viewing.

- Infrastructure: Docker Compose  
  Runs the database, API, and UI together, each in its own container.

Parsing logic is isolated from HTTP and database concerns to keep it testable and easy to reason about.

## Running the Project

### Prerequisites
- Docker
- Docker Compose

### Start everything
From the project root, run:

    docker compose up --build

This will:
- Start PostgreSQL
- Run database migrations automatically
- Start the API
- Start the web UI

### Stop everything

    docker compose down

### Reset the database

    docker compose down -v
    docker compose up --build

## Services

- API: http://localhost:3001  
- Swagger UI: http://localhost:3001/docs  
- Web UI: http://localhost:5173  

## Notes

- File uploads support partial success: valid records are stored even if some lines fail.
- Invalid lines are returned with line-level error details.
- The system is fully containerized so it can be run locally without additional setup.
