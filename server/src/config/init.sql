CREATE DATABASE memory_tester;

\c memory_tester;

CREATE TYPE content_type AS ENUM ('picture', 'video');

CREATE TABLE IF NOT EXISTS "Users" (
                                       id SERIAL PRIMARY KEY,
                                       username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    points INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                              );

CREATE TABLE IF NOT EXISTS "Tests" (
                                       id SERIAL PRIMARY KEY,
                                       "UserId" INTEGER REFERENCES "Users"(id),
    "contentType" content_type NOT NULL,
    content JSONB NOT NULL,
    schedule JSONB NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                              );

CREATE INDEX idx_tests_schedule ON "Tests" USING gin (schedule);