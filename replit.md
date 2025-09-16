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
- **Invisible Auto-filling**: All experimental task forms automatically pre-fill with realistic test data on component mount without any user notifications or UI indicators
- **Database-Driven**: Test data stored in MySQL database with configurable datasets for different scenarios  
- **Completely Silent Process**: Students see forms already populated with valid data with no "已自动填充测试数据" notifications or dropdown selectors
- **No Manual Switching**: Removed all data set switching UI controls - auto-filling happens seamlessly in background
- **Realistic Chinese Enterprise Data**: Includes valid unified credit codes, business licenses, and registration information
- **Mandatory Development Rule**: ALL future experimental tasks MUST implement invisible automatic test data pre-filling with:
  - No toast notifications about data being filled
  - No dropdown selectors for switching datasets
  - No UI indicators showing auto-fill status
  - Silent background data population on component mount

## 实验开发标准 (Experiment Development Standards)

### 强制自动预填要求 (Mandatory Auto-prefill Requirements)
- **完全静默**: 所有实验任务表单必须在组件挂载时自动预填测试数据，无任何用户通知或UI指示器
- **数据库驱动**: 测试数据存储在数据库中，通过API端点 `/api/test-data/<实验key>` 获取
- **默认数据集**: 总是使用"默认测试企业"数据集进行静默预填
- **同意复选框**: 预填时保持所有同意复选框为false（未选中）状态
- **可选切换**: 提供可选的数据集切换功能（如需要）
- **零用户交互**: 预填过程完全在后台进行，不显示toast通知或选择器

### 实验元数据标准 (Experiment Metadata Standards)
- **核心流程**: 每个实验必须在数据库中定义准确的coreFlow（核心步骤）
- **步骤展示**: 实验详情页根据元数据动态显示实验流程步骤
- **进度同步**: 通过 `/api/progress` 端点同步学生进度状态
- **6步流程**: 电商企业资质备案遵循6步核心流程设计

### UX一致性要求 (UX Consistency Requirements)
- **表单技术栈**: 使用shadcn + react-hook-form + zodResolver
- **查询管理**: TanStack Query v5，分层queryKeys，变更后缓存失效
- **加载状态**: 显示加载/骨架状态，优雅处理401错误
- **图标标准**: 使用lucide-react图标库
- **测试标识**: 所有交互元素和关键显示元素添加data-testid属性
- **文件上传**: 使用共享的FileUpload组件

### 导航和流程标准 (Navigation and Flow Standards)
- **详情优先**: 用户首先看到实验详情页，然后主动启动表单
- **返回场景**: 标准的返回到场景导航
- **进度追踪**: 一致的按钮标签、图标和步骤器
- **认证处理**: 优雅的认证错误处理，显示重新登录提示

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