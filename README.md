# African Language Translation Platform (ndovu.guru)

A comprehensive Next.js application for preserving and digitizing African languages through community-driven translation and voice recording efforts.

## 🌍 Project Overview

The African Language Translation Platform is designed to bridge language gaps by enabling users to translate between English, Kiswahili, and various African local languages (with initial focus on Kalenjin dialects). The platform supports both text translation and voice recording for comprehensive language preservation.

### Key Features
- **Multi-language Translation**: English ↔ Kiswahili ↔ Local Languages
- **Voice Recording**: Audio capture for pronunciation and language preservation
- **Role-Based Access Control**: User, Validator, and Admin roles
- **Community Review System**: Translation validation by language experts
- **Microservice Architecture**: Scalable and maintainable codebase
- **Real-time Statistics**: Track translation progress and accuracy

## 🛠 Technology Stack

- **Frontend**: Next.js 15.2.4, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Node.js, Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with RBAC
- **Database**: 7 configured tables with Row Level Security
- **Deployment**: Vercel (default domain), Docker, Kubernetes support
- **Domain**: ndovu.guru (Hostinger)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn** package manager
- **Git** for version control
- **Supabase Account** (for database and authentication)

## 🚀 Local Development Setup

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd translator-system
\`\`\`

### 2. Install Dependencies

\`\`\`bash
# Using npm
npm install

# Using yarn
yarn install
\`\`\`

### 3. Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database Configuration
POSTGRES_URL=your_postgres_connection_string
POSTGRES_PRISMA_URL=your_postgres_prisma_url
POSTGRES_URL_NON_POOLING=your_postgres_non_pooling_url

# Application Configuration
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
\`\`\`

### 4. Database Setup

Run the database migration scripts in order:

\`\`\`bash
# Create initial tables
npm run db:migrate:01

# Setup RBAC system
npm run db:migrate:08

# Setup admin user
npm run db:migrate:09

# Create voice recording tables
npm run db:migrate:11
\`\`\`

Or run all migrations at once:
\`\`\`bash
npm run db:setup
\`\`\`

### 5. Start Development Server

\`\`\`bash
# Using npm
npm run dev

# Using yarn
yarn dev
\`\`\`

The application will be available at `http://localhost:3000`

## 🗄 Database Schema

The platform uses 7 main tables:

1. **user_profiles** - User information and preferences
2. **english_sentences** - Standard English sentences for translation
3. **standard_sentences** - Multi-language sentence repository
4. **user_translations** - User-submitted translations
5. **translation_reviews** - Validator reviews and feedback
6. **voice_recordings** - Audio files and metadata
7. **user_sessions** - Session management and activity tracking

## 👥 User Roles & Access

### User (Translator)
- Translate sentences from English/Kiswahili to local languages
- Record voice pronunciations
- View personal translation statistics
- Access translation practice interface

### Validator (Reviewer)
- Review and approve/reject translations
- Provide feedback on submissions
- Access validation dashboard
- Monitor translation quality

### Admin
- Full system access and user management
- View system-wide statistics
- Manage user roles and permissions
- Access admin dashboard
- Default admin: proxima4life@gmail.com

## 🌐 Accessing the Application

### Main Routes
- `/` - Login/Registration page
- `/setup-profile` - User profile configuration
- `/translate` - Translation interface
- `/voice-recording` - Voice recording interface
- `/settings` - User settings and statistics
- `/admin` - Admin dashboard (admin only)

### API Endpoints
- `/api/random-sentence` - Fetch random sentences for translation
- `/api/submit-translation` - Submit translations for review
- `/api/users` - User management (admin only)

## 🐳 Docker Deployment

### Development Environment
\`\`\`bash
# Build and run with docker-compose
docker-compose -f docker-compose.dev.yml up --build

# Stop services
docker-compose -f docker-compose.dev.yml down
\`\`\`

### Production Environment
\`\`\`bash
# Build and run production services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
\`\`\`

## ☸️ Kubernetes Deployment

\`\`\`bash
# Apply Kubernetes configurations
kubectl apply -f k8s/

# Check deployment status
kubectl get pods
kubectl get services

# Scale deployment
kubectl scale deployment translator-app --replicas=3
\`\`\`

## 🚀 Production Deployment

### Vercel Deployment (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch
4. Your app will be available at your-project-name.vercel.app

### Manual Deployment
\`\`\`bash
# Build production version
npm run build

# Start production server
npm start
\`\`\`

## 📊 Monitoring & Analytics

The platform includes comprehensive monitoring:
- User activity tracking
- Translation accuracy metrics
- Voice recording statistics
- System performance monitoring
- Error logging and reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation in `/docs` folder

## 🔧 Development Commands

\`\`\`bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks

# Database
npm run db:setup     # Run all database migrations
npm run db:seed      # Seed database with sample data
npm run db:reset     # Reset database (development only)

# Docker
make dev             # Start development environment
make prod            # Start production environment
make clean           # Clean Docker containers and images

# Deployment
npm run deploy       # Deploy to Vercel
make k8s-deploy      # Deploy to Kubernetes
\`\`\`

---

**Built with ❤️ for African language preservation**
