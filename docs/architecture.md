# Architecture

## Overview

### Brief description of the system and what it does.

## System Flow

### Zoom Cloud Recording → Zoom Webhook → NestJS API → PostgreSQL → Resend → Next.js Portal

## Repository Structure

### Explain the monorepo layout.

## Frontend Architecture

### Explain `apps/web`, Next.js App Router, pages, components, features, and API calls.

## Backend Architecture

### Explain `apps/api`, NestJS modular monolith, modules, services, controllers.

## Database Architecture

### Explain what PostgreSQL stores and what it does not store.

## External Services

### Explain Zoom, Resend, Vercel, Railway, Namecheap.

## TypeScript Configuration

### Explain separate configs for Next.js and NestJS.

ZoomVault uses separate TypeScript configurations for each app.

`apps/web` uses the default Next.js TypeScript configuration.

`apps/api` uses the default NestJS TypeScript configuration.

This avoids forcing frontend and backend code into one shared compiler setup too early.

## Deployment Architecture

### Explain frontend on Vercel and backend/database on Railway.

## Security Model

### Explain temporary links, expiration, admin access code, webhook validation.