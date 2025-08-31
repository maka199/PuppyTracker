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
- **Provider**: Simple username-based authentication
- **Strategy**: Username stored in localStorage (frontend) and validated via custom middleware (backend)
- **Session Management**: Stateless - no server-side sessions required
- **Authorization**: Route-level middleware that validates username from `x-username` header

### External Dependencies
- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Simple username-based system (no external auth service)
- **Development**: Replit-specific development tools and error overlay
- **UI Components**: Radix UI headless components
- **Icons**: Font Awesome via CDN
- **Fonts**: Google Fonts (DM Sans, Fira Code, Geist Mono, Architects Daughter)

### Core Features Architecture
- **Walk Tracking**: Start/stop walk sessions with real-time timer and event logging
- **Activity Feed**: Shared timeline showing all family members' logged activities
- **Feeding Management**: Quick feeding logs with meal type and portion tracking
- **Responsive Design**: Mobile-first design with bottom navigation for mobile devices
- **Simple Authentication**: Username-based login with localStorage persistence and stateless backend validation

## Authentication System

### Overview
The app uses a simple username-based authentication system that allows family members to log in with just their name or nickname. This replaces the previous Replit Auth system for easier deployment and usage.

### Frontend Authentication Flow
1. **Landing Page**: Users see a simple login form with a username input field
2. **Login Process**: Enter any name/nickname and click "Start Tracking"
3. **Storage**: Username is stored in browser localStorage for persistence
4. **Context**: React AuthContext provides username state throughout the app
5. **Logout**: Simple logout button clears localStorage and returns to landing page

### Backend Authentication
1. **Middleware**: `validateUsername` middleware checks for username in `x-username` header or request body
2. **API Requests**: All authenticated endpoints require username via header
3. **User Association**: All activities (walks, feedings, etc.) are associated with the provided username
4. **No Sessions**: Stateless system with no server-side session management required

### API Usage
- All API requests from authenticated users include: `{ 'x-username': 'user-name' }`
- Backend associates all created resources with the provided username
- No complex token management or session handling needed