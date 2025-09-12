# Digital Trade Training System

## Overview

This is a full-stack digital trade training platform designed for educational institutions to provide students with immersive virtual learning experiences in international trade operations. The system simulates real-world trade scenarios including customs declarations, document processing, and cross-border logistics workflows.

The platform supports role-based access control with three user types: students who complete training modules and experiments, teachers who manage assignments and evaluate student performance, and administrators who oversee system configuration and user management.

## Recent Changes

### API Performance Optimization (September 2025)
- **Sentry Monitoring Fix**: Added proper HEAD /api endpoint handler to respond with 204 status codes
- **Performance Improvement**: Eliminated continuous HEAD request polling issues that were causing log spam
- **Monitoring Compliance**: Proper health check response for external monitoring systems
- **Clean Logging**: Removed debug middleware that was polluting application logs

### 5 Training Scenarios Implementation (September 2025)
- **Scenario-Based Architecture**: Transformed from task-centered to scenario-based approach matching the digital trade ecosystem definition
- **5 Virtual Training Scenarios**: 
  1. Enterprise Scene (电商企业场景) - Cross-border e-commerce enterprise operations
  2. Customs Office Scene (海关场景) - Customs review and supervision
  3. Customs Supervision Scene (海关监管作业场所场景) - Customs supervision operations
  4. Overseas Warehouse Scene (海外仓库场景) - Overseas warehousing and logistics
  5. Buyer Home Scene (买家居家场景) - Consumer receiving and delivery scenarios
- **City-District Visualization**: Homepage features an interactive city-district layout showing the complete digital trade process flow
- **Role-Based Scene Access**: Different business roles can only access their permitted training scenarios with visual permission indicators
- **Direct Navigation Flow**: Task center → experiment details → homepage (bypassing intermediate pages)
- **Removed Experiment List**: Complete removal of experiment progress overview interfaces for cleaner user experience

### Automated Test Data Pre-filling System (September 2025)
- **Default Data Population**: All experimental task forms automatically pre-fill with realistic test data on component mount
- **Database-Driven**: Test data stored in MySQL database with configurable datasets for different scenarios
- **No Manual Interaction**: Students see forms already populated with valid data, eliminating manual data entry step
- **Multiple Test Datasets**: Support for multiple enterprise data sets with easy switching capabilities
- **Realistic Chinese Enterprise Data**: Includes valid unified credit codes, business licenses, and registration information
- **Development Rule**: All future experimental tasks MUST implement automatic test data pre-filling following this pattern

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
- **Database**: MySQL (preferred) for production reliability and performance
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
- **MySQL Database**: Production-grade MySQL for reliable data storage
- **Drizzle Kit**: Database migration and schema management tools with MySQL config (drizzle.mysql.config.ts)

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