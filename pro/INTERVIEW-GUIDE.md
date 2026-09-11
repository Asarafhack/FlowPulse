# Interview Guide

## Architecture
React UI → API client → authentication/validation middleware → services →
repositories/data access → PostgreSQL/Supabase.

## Authentication
Passwords are bcrypt-hashed. Login verifies the hash and creates a signed JWT.
Protected API operations require authentication and reject invalid/expired tokens.

## Authorization
Ownership is enforced server-side. A user can only view, edit and delete their
own projects and tasks; task ownership is derived from the parent project.

## Database
Accounts/users have one-to-many projects; projects have one-to-many tasks.
Foreign keys, constraints and indexes preserve integrity and query performance.

## Security
bcrypt, JWT, protected routes, input validation, server-side ownership checks,
safe database SDK/parameterized access, rate limiting, and no sensitive values
in normal responses/logs.

## Rate limiting
The authentication limiter is per-process/in-memory. It is appropriate for a
single-process assessment deployment. A distributed deployment would use shared
storage such as Redis.

## Interview rule
Explain only technologies and flows that are actually present in the source.
