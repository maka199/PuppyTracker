# replit.md

## Overview

PawTracker is a family dog activity logging application built with a React frontend and Express backend. The app allows multiple family members to collaboratively track their dog's activities including walks, bathroom breaks, and feeding times. It features real-time activity tracking, session-based walk logging with event recording (pee/poo stops), and a shared family dashboard showing recent activities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL session store
- **API Design**: RESTful API with centralized error handling middleware

### Data Storage Solutions
- **Database**: PostgreSQL via Neon serverless connection
- **Schema Management**: Drizzle Kit for migrations and schema synchronization
- **Session Storage**: PostgreSQL-backed session store using connect-pg-simple
- **Database Connection**: Connection pooling with @neondatabase/serverless

### Authentication and Authorization
- **Provider**: Replit Auth (OpenID Connect)
- **Strategy**: Passport.js with OpenID Connect strategy
- **Session Management**: Server-side sessions with secure HTTP-only cookies
- **Authorization**: Route-level middleware protection for authenticated endpoints

### External Dependencies
- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Replit OpenID Connect service
- **Development**: Replit-specific development tools and error overlay
- **UI Components**: Radix UI headless components
- **Icons**: Font Awesome via CDN
- **Fonts**: Google Fonts (DM Sans, Fira Code, Geist Mono, Architects Daughter)

### Core Features Architecture
- **Walk Tracking**: Start/stop walk sessions with real-time timer and event logging
- **Activity Feed**: Shared timeline showing all family members' logged activities
- **Feeding Management**: Quick feeding logs with meal type and portion tracking
- **Responsive Design**: Mobile-first design with bottom navigation for mobile devices