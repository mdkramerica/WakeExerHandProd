# 🏥 WakeExer Hand Assessment System

A HIPAA-compliant hand rehabilitation assessment platform using computer vision and MediaPipe for real-time motion tracking.

## 🚀 Features

### 📊 Assessment System
- **TAM (Total Active Motion)** assessment with MediaPipe hand tracking
- **Kapandji Opposition Test** for thumb functionality
- **Wrist Range of Motion** (flexion/extension, radial/ulnar deviation)
- **QuickDASH** outcome measures
- **Real-time motion capture** and analysis

### 👥 Multi-User Platform
- **Patient Portal** - Self-assessment with access codes
- **Clinical Dashboard** - Provider access with role-based permissions
- **Admin Portal** - System administration and user management
- **Research Interface** - Data analysis and cohort management

### 🔒 HIPAA Compliance & Security
- **JWT Authentication** with HTTP-only cookies
- **bcrypt Password Hashing** (12 rounds)
- **Account Lockout** after failed login attempts
- **Rate Limiting** and DDoS protection
- **CORS Protection** with domain whitelist
- **Security Headers** via Helmet.js
- **AES-256-GCM Encryption** for sensitive data
- **Comprehensive Audit Logging**
- **Secure Session Management**

### 🏥 Clinical Features
- **Injury-Specific Cohorts** with normal ROM ranges
- **Progress Tracking** with visual analytics
- **Data Export** capabilities for research
- **Multi-Assessment Workflows**
- **Customizable Assessment Protocols**

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Wouter** for routing
- **Shadcn/UI** component library
- **TanStack Query** for data fetching
- **MediaPipe** for hand/pose tracking
- **Zod** for validation

### Backend
- **Node.js** with Express
- **TypeScript** with tsx/esbuild
- **PostgreSQL** with Drizzle ORM
- **JWT** for authentication
- **Winston** for logging
- **bcrypt** for password security

### Infrastructure
- **Railway** for deployment
- **PostgreSQL** database
- **Docker** containerization
- **GitHub Actions** for CI/CD

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/WakeExerHandProd.git
   cd WakeExerHandProd
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   Edit `.env` with your database credentials and security keys.

4. **Set up database**
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:5000` to access the application.

## 🔒 Security Configuration

### Environment Variables
See `env.example` for all required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens (generate with `openssl rand -base64 64`)
- `ENCRYPTION_KEY` - AES encryption key (generate with `openssl rand -hex 32`)
- `NODE_ENV` - Set to `production` for production deployments

### Default Credentials (Change Immediately)
After deployment, change these default passwords:

**Clinical Dashboard:**
- Admin: `admin` / `TempSecureAdmin2024!@#$%`
- Clinician: `clinician` / `TempSecureClinician2024!@#$%`
- Researcher: `researcher` / `TempSecureResearcher2024!@#$%`

**Admin Portal:**
- Portal Admin: `portaladmin` / `TempSecurePortalAdmin2024!@#$%`

## 🚀 Deployment

### Railway Deployment

1. **Create Railway project**
   ```bash
   railway login
   railway init
   ```

2. **Add PostgreSQL database**
   ```bash
   railway add postgresql
   ```

3. **Set environment variables**
   Copy from `env.example` and set in Railway dashboard

4. **Deploy**
   ```bash
   railway up
   ```

See `RAILWAY_DEPLOYMENT_GUIDE.md` for detailed deployment instructions.

## 📊 Usage

### Patient Access
1. Visit the application URL
2. Enter your assigned access code (e.g., `DEMO01`)
3. Complete assessments using webcam-based motion tracking
4. View progress and historical data

### Clinical Access
1. Navigate to `/clinical/login`
2. Login with clinical credentials
3. Manage patients and view assessment data
4. Generate reports and track outcomes

### Admin Access
1. Navigate to `/admin`
2. Login with admin credentials
3. Manage users, cohorts, and system settings
4. Export data for research purposes

## 🔍 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - Clinical user login
- `POST /api/auth/logout` - Logout and invalidate session
- `POST /api/admin/login` - Admin user login

### Assessment Endpoints
- `GET /api/users/:code` - Get patient information
- `POST /api/assessments` - Submit assessment data
- `GET /api/assessments/:userId` - Get user assessments

### Health Check
- `GET /health` - Application health status
- `GET /health/db` - Database connectivity check

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilities
├── server/                # Express backend
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data layer
│   ├── security.ts       # Security services
│   ├── middleware.ts     # Express middleware
│   └── seed-database.ts  # Database seeding
├── shared/               # Shared types and schemas
│   └── schema.ts        # Drizzle database schema
├── migrations/          # Database migrations
└── docs/               # Documentation
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema
- `npm run db:seed` - Seed database with initial data

### Code Quality
- TypeScript for type safety
- Zod for runtime validation
- Comprehensive error handling
- Security-first architecture

## 📚 Documentation

- `SECURITY_IMPLEMENTATION.md` - Detailed security features
- `RAILWAY_DEPLOYMENT_GUIDE.md` - Deployment instructions
- `env.example` - Environment variable reference

## 🏥 HIPAA Compliance

This application implements comprehensive security measures for HIPAA compliance:

- **Data Encryption**: All sensitive data encrypted at rest and in transit
- **Access Controls**: Role-based access with strong authentication
- **Audit Logging**: Complete audit trail of all data access
- **Data Integrity**: Database constraints and validation
- **Security Headers**: Protection against common web vulnerabilities

See `SECURITY_IMPLEMENTATION.md` for complete details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation in `/docs`
- Review security implementation guide
- Create an issue for bugs or feature requests

## 🏆 Acknowledgments

- MediaPipe for computer vision capabilities
- Railway for deployment platform
- Open source community for excellent tools and libraries

---

**⚠️ Important**: This application handles protected health information (PHI). Ensure all security guidelines are followed and default passwords are changed before production use.