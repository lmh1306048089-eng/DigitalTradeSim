# Digital Trade Training System

## Overview

This is a full-stack digital trade training platform designed for educational institutions to provide students with immersive virtual learning experiences in international trade operations. The system simulates real-world trade scenarios including customs declarations, document processing, and cross-border logistics workflows.

The platform supports role-based access control with three user types: students who complete training modules and experiments, teachers who manage assignments and evaluate student performance, and administrators who oversee system configuration and user management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern component development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui design system for consistent, accessible components
- **Styling**: Tailwind CSS with custom CSS variables for theming and responsive design
- **Form Handling**: React Hook Form with Zod validation for robust form management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Authentication**: JWT-based authentication with access/refresh token strategy
- **Password Security**: bcryptjs for secure password hashing
- **File Handling**: Multer middleware for document uploads with file type validation
- **Development**: tsx for TypeScript execution in development mode

### Database Design
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Database**: PostgreSQL with Neon serverless infrastructure
- **Schema Structure**:
  - Users table with role-based permissions (student/teacher/admin)
  - Virtual scenes for immersive learning environments
  - Experiments workflow system with step-by-step guidance
  - Student progress tracking with completion status
  - Training tasks and experiment results for assessment
  - File upload management for document submissions

### Authentication & Authorization
- **JWT Strategy**: Dual-token system with short-lived access tokens (15min) and long-lived refresh tokens (7d)
- **Role-Based Access**: Hierarchical permissions system with route-level protection
- **Security**: Password hashing, token verification middleware, and request validation

### File Management
- **Upload System**: Configurable file upload with size limits (10MB) and type restrictions
- **Supported Formats**: PDF, DOC, DOCX, and common image formats
- **Storage**: Local filesystem with organized directory structure
- **Integration**: File metadata tracking in database with experiment/result associations

## External Dependencies

### Database Infrastructure
- **Neon Database**: Serverless PostgreSQL with connection pooling
- **Drizzle Kit**: Database migration and schema management tools

### UI/UX Libraries
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form**: Form state management and validation

### Development Tools
- **Vite**: Build tool and development server with HMR
- **TypeScript**: Static type checking across the entire codebase
- **ESBuild**: Fast bundling for production builds

### Authentication & Security
- **jsonwebtoken**: JWT token generation and verification
- **bcryptjs**: Secure password hashing implementation

### File Processing
- **Multer**: Multipart/form-data handling for file uploads
- **File Type Validation**: MIME type checking for security

### Development Environment
- **Replit Integration**: Custom plugins for development experience
- **Environment Configuration**: Process-based configuration management