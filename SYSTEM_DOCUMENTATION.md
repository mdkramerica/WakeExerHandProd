# ExerAI System Documentation
## Comprehensive Live Website Functionality & Flows

> **Live Site**: [https://wakeexer.replit.app](https://wakeexer.replit.app)  
> **Admin Portal**: [https://wakeexer.replit.app/admin](https://wakeexer.replit.app/admin)  
> **Clinical Dashboard**: [https://wakeexer.replit.app/clinical](https://wakeexer.replit.app/clinical)

---

## 🏗️ System Architecture Overview

### **Technology Stack**
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript  
- **Database**: PostgreSQL with Drizzle ORM
- **UI Framework**: Radix UI + Tailwind CSS
- **State Management**: TanStack Query + React hooks
- **Motion Tracking**: MediaPipe Holistic/Hands
- **Authentication**: Multi-tier (Patients, Clinicians, Admins)
- **Deployment**: Replit with automatic database provisioning

### **Core Components**
```
├── client/src/
│   ├── pages/           # Route components
│   ├── components/      # Reusable UI components  
│   ├── lib/            # Utilities & API client
│   └── App.tsx         # Main routing configuration
├── server/
│   ├── routes.ts       # API endpoints
│   ├── storage.ts      # Database operations
│   ├── db.ts          # Database connection
│   └── index.ts       # Server entry point
├── shared/
│   └── schema.ts      # Database schema & types
```

---

## 🎯 User Flows & Access Patterns

### **1. Patient Flow** 
**Entry Point**: `https://wakeexer.replit.app`

#### **Step 1: Access Code Authentication**
```
Landing Page → Enter 6-digit code → Verification
```
- **Route**: `/` (`client/src/pages/landing.tsx`)
- **API**: `POST /api/users/verify-code`
- **Authentication Logic**: 
  - Checks existing users first (backward compatibility)
  - Validates against admin-created patient records
  - Creates new user if valid admin code
  - Rejects invalid/unknown codes

#### **Step 2: Injury Type Selection (First-time patients)**
```
Valid Code → Injury Selection → Assessment Dashboard
```
- **Route**: `/injury-selection` (`client/src/pages/injury-selection.tsx`)
- **Purpose**: Configure assessment battery based on condition
- **Options**: Trigger Finger, Carpal Tunnel, Wrist Fracture, etc.

#### **Step 3: Daily Assessment Dashboard**
```
Returning Patients → Patient Dashboard → Assessment Selection
```
- **Route**: `/patient/:code` or `/patient/:code/dashboard` 
- **Component**: `client/src/pages/patient-daily-dashboard.tsx`
- **Features**:
  - Today's required assessments
  - Progress tracking
  - Assessment history
  - DASH questionnaire integration

#### **Step 4: Assessment Execution**
```
Assessment Selection → Video Instructions → Motion Recording → Results
```

**Video Instructions**:
- **Route**: `/assessment/:id/video/:code`
- **Component**: `client/src/pages/video-instruction.tsx`  
- **Features**: Looping instructional videos, assessment preparation

**Motion Recording**:
- **Route**: `/assessment/:id/record/:code`
- **Component**: `client/src/pages/recording.tsx`
- **Technology**: MediaPipe integration via `client/src/components/holistic-tracker.tsx`
- **Process**:
  1. Camera initialization (640x480 resolution)
  2. MediaPipe hand/pose detection
  3. 15-second recording with countdown
  4. Quality scoring & confidence filtering (70% threshold)
  5. Data storage with frame metadata

**Results Display**:
- **Routes**: 
  - `/assessment-results/:code/:userAssessmentId`
  - `/wrist-results/:userCode/:userAssessmentId`
  - `/wrist-deviation-results/:userCode/:userAssessmentId`
- **Features**: ROM calculations, motion replay, progress comparison

---

### **2. Admin Portal Flow**
**Entry Point**: `https://wakeexer.replit.app/admin`

#### **Authentication**
- **Component**: `client/src/pages/AdminLogin.tsx`
- **API**: `POST /api/admin/login`
- **Credentials**: Separate admin user system

#### **Dashboard Features** (`client/src/pages/AdminDashboard.tsx`)

**Patient Management**:
- Generate new patient access codes
- View patient compliance metrics
- Monitor assessment completion rates
- Export patient data

**Analytics Dashboard**:
- Total/active patient counts
- Compliance rates and trends
- Assessment completion statistics
- Risk indicators for patients below 60% compliance

**DASH Progress Tracking**:
- **Route**: `/admin/dash-results/:patientCode/:assessmentId`
- **Component**: `client/src/pages/admin-dash-results.tsx`
- **Features**: Longitudinal DASH score analysis with clinical interpretation

**Key APIs**:
```typescript
GET /api/admin/patients              // Patient list
GET /api/admin/compliance           // Compliance metrics  
POST /api/admin/generate-code       // Create patient access code
GET /api/admin/dash-progress/:code  // DASH trend analysis
```

---

### **3. Clinical Dashboard Flow** 
**Entry Point**: `https://wakeexer.replit.app/clinical`

#### **Authentication**
- **Component**: `client/src/pages/clinical-login.tsx`
- **API**: `POST /api/clinical/login`
- **Role-based**: clinician, researcher, admin roles

#### **Dashboard Modules**
**Protected Layout**: `client/src/components/clinical-layout.tsx`

**Core Modules**:
1. **Patient Dashboard** (`/clinical/patient-dashboard`)
   - Individual patient detailed views
   - Assessment history analysis
   - Progress visualization

2. **Analytics Suite** (`/clinical/analytics`)
   - Cross-patient analysis
   - Outcome predictions
   - Cohort comparisons

3. **Research Tools** (`/clinical/research`)
   - Study enrollment management
   - Protocol compliance monitoring
   - Data export functionality

4. **Study Management**:
   - **Enrollment**: `/clinical/study/enroll`
   - **Cohorts**: `/clinical/study/cohorts` 
   - **Analytics**: `/clinical/study/analytics`
   - **Compliance**: `/clinical/study/compliance`

---

## 📊 Database Schema Architecture

### **Authentication Tables**
```sql
-- Patient access codes (legacy system)
users: id, code, injury_type, surgery_date, first_name, last_name, email

-- Clinical staff authentication  
clinical_users: id, username, password, email, first_name, last_name, role

-- Admin portal authentication
admin_users: id, username, password, email, first_name, last_name

-- Modern patient management (PHI-free)
patients: id, patient_id, alias, cohort_id, access_code, injury_type
```

### **Assessment System**
```sql
-- Assessment templates
assessments: id, name, description, video_url, duration, repetitions

-- Assessment type definitions  
assessment_types: id, name, description, instructions, duration

-- Individual patient results
user_assessments: id, user_id, assessment_id, rom_data, quality_scores, motion_data

-- Clinical assessment records
patient_assessments: id, patient_id, assessment_type_id, clinician_id, metrics
```

### **Analytics & Research**
```sql
-- Research cohort definitions
cohorts: id, name, description, normal_rom_ranges

-- DASH questionnaire responses  
quick_dash_responses: id, patient_assessment_id, question_id, response_value

-- Audit logging
audit_logs: id, user_id, action, resource, details

-- Data export tracking
data_exports: id, export_type, status, file_path, metadata
```

---

## 🔌 API Endpoint Reference

### **Authentication Endpoints**
```typescript
// Patient authentication
POST /api/users/verify-code         // Access code validation
GET  /api/users/by-code/:code       // User lookup
PATCH /api/users/:id               // User updates

// Clinical authentication  
POST /api/clinical/login           // Staff login
GET  /api/clinical/me              // Current user info

// Admin authentication
POST /api/admin/login             // Admin login
```

### **Patient Management**
```typescript  
// Patient operations
GET  /api/patients                // Patient list (clinical)
POST /api/patients               // Create patient (admin)
GET  /api/patients/:id           // Patient details
GET  /api/patients/by-code/:code // Patient lookup

// Assessment management
GET  /api/users/:id/assessments/today    // Today's assessments
GET  /api/users/:id/assessments          // All assessments  
POST /api/users/:id/assessments          // Submit assessment
GET  /api/assessments/:id                // Assessment details
```

### **Analytics & Reporting**
```typescript
// Dashboard metrics
GET  /api/dashboard/metrics              // Overall statistics
GET  /api/patients/dashboard            // Patient dashboard data
GET  /api/admin/compliance              // Compliance metrics

// Progress tracking  
GET  /api/users/by-code/:code/history   // Assessment history
GET  /api/patients/:id/streak           // Compliance streak
GET  /api/admin/dash-progress/:code     // DASH progression

// Data export
POST /api/data-export                   // Request data export
GET  /api/data-export/:id               // Download export
```

---

## 🎨 Frontend Architecture

### **Routing Structure** (`client/src/App.tsx`)
```typescript
// Main application routes
├── /                          # Landing page (patient entry)
├── /admin                     # Admin portal  
├── /clinical/*               # Clinical dashboard (protected)
├── /patient/:code/*          # Patient dashboard & flows
├── /assessment/:id/*         # Assessment execution flows
└── /shared/:token            # Shared assessment results
```

### **Component Hierarchy**
```
App.tsx
├── Router
│   ├── Landing.tsx              # Main entry point
│   ├── AdminPortal.tsx          # Admin portal container  
│   ├── ClinicalLayout.tsx       # Clinical dashboard wrapper
│   ├── PatientDailyDashboard.tsx # Patient dashboard
│   └── Assessment Components
│       ├── VideoInstruction.tsx  # Pre-assessment videos
│       ├── Recording.tsx         # Motion capture interface
│       └── Results Components    # Assessment results display
```

### **Key Shared Components**
- **HolisticTracker** (`client/src/components/holistic-tracker.tsx`): MediaPipe integration
- **AssessmentReplay** (`client/src/components/assessment-replay.tsx`): Motion playback
- **Header/Footer**: Consistent navigation and branding
- **Clinical Layout**: Protected route wrapper with sidebar navigation

---

## ⚡ Motion Tracking System

### **MediaPipe Integration**
**Primary Component**: `client/src/components/holistic-tracker.tsx`

**Technical Specifications**:
- **Resolution**: 640x480 video capture
- **Framework**: MediaPipe Holistic with Hands fallback
- **Confidence Threshold**: 70% for landmark detection
- **Recording Duration**: 15 seconds with synchronized countdown
- **Data Capture**: Frame-by-frame landmark coordinates with timestamps

**Assessment Types**:
1. **TAM (Total Active Motion)**: Finger flexion/extension ROM
2. **Kapandji Test**: Thumb opposition assessment  
3. **Wrist Assessment**: Flexion, extension, radial/ulnar deviation
4. **Quality Scoring**: Multi-factor assessment including tracking stability

### **Data Processing Pipeline**
```
Video Capture → MediaPipe Processing → Landmark Extraction → 
Quality Analysis → ROM Calculation → Database Storage → 
Results Visualization → Motion Replay
```

---

## 🔐 Security & Access Control

### **Multi-Tier Authentication**
1. **Patient Access**: 6-digit codes (admin-generated)
2. **Clinical Staff**: Username/password with role-based permissions  
3. **Admin Portal**: Separate authentication system

### **Access Control Matrix**
| Role | Patients | Clinical | Admin | Data Export |
|------|----------|----------|--------|-------------|
| Patient | Own data only | ❌ | ❌ | Own results |
| Clinician | Assigned patients | ✅ | ❌ | Patient cohorts |
| Researcher | Study cohorts | ✅ | ❌ | Research data |
| Admin | All patients | ✅ | ✅ | Full system |

### **Data Protection**
- **PHI Compliance**: De-identified patient aliases
- **Audit Logging**: All data access tracked
- **Session Management**: Token-based authentication
- **Role Validation**: Endpoint-level permission checking

---

## 📈 Analytics & Reporting

### **Patient Progress Tracking**
**Dashboard Metrics**:
- Assessment completion rates
- ROM progression over time  
- Compliance streak tracking
- DASH score longitudinal analysis

**Clinical Analytics**:
- Cross-patient comparisons
- Cohort outcome analysis
- Predictive modeling for recovery
- Risk stratification for non-compliant patients

### **Data Export System**
**Export Formats**:
- Individual patient reports (PDF)
- Bulk data export (ZIP with CSV files)
- Research datasets (de-identified)
- Assessment motion data (frame-by-frame JSON)

**Export Components**:
- `server/routes.ts`: Export request handling
- PDF generation via Puppeteer
- ZIP compression with archiver
- Structured file organization

---

## 🚀 Deployment & Environment

### **Environment Configuration**
```bash
# Database
DATABASE_URL=postgresql://...
PGHOST=...
PGPORT=5432
PGDATABASE=...
PGUSER=...  
PGPASSWORD=...

# Application  
NODE_ENV=production
PORT=5000
```

### **Build & Deployment**
```bash
npm run build    # Build frontend + backend
npm run dev      # Development server
npm run db:push  # Database schema sync
```

### **File Structure**
```
project/
├── client/          # React frontend
├── server/          # Express backend  
├── shared/          # Common types & schemas
├── dist/           # Built assets (auto-generated)
├── package.json    # Dependencies & scripts
└── vite.config.ts  # Build configuration
```

---

## 🔧 Development Guidelines

### **Adding New Assessment Types**
1. **Database**: Add to `assessment_types` table via admin portal
2. **Frontend**: Create assessment component in `client/src/pages/`
3. **Backend**: Add processing logic in `server/routes.ts`  
4. **Schema**: Update types in `shared/schema.ts`

### **Extending Analytics**
1. **API**: Add endpoints in `server/routes.ts`
2. **Storage**: Implement data methods in `server/storage.ts`
3. **Frontend**: Create dashboard components
4. **Types**: Update interfaces in `shared/schema.ts`

### **Authentication Changes**
1. **Middleware**: Update `requireAuth` in `server/routes.ts`
2. **Frontend**: Modify auth hooks in `client/src/lib/auth.ts`
3. **Database**: Update user tables as needed
4. **Role Management**: Adjust `requireRole` middleware

---

## 🎯 Current System Status

### **Live Functionality** ✅
- ✅ Patient access code authentication (backward compatible)
- ✅ Motion tracking with MediaPipe integration
- ✅ Assessment recording (15-second cycles with countdown)
- ✅ Real-time ROM calculation and quality scoring
- ✅ Progress tracking and compliance monitoring  
- ✅ Admin portal with patient management
- ✅ Clinical dashboard with analytics
- ✅ DASH questionnaire integration
- ✅ Data export system (PDF reports, CSV data)
- ✅ Motion replay with frame-by-frame visualization

### **Key Technical Features**
- **Database**: PostgreSQL with automatic initialization
- **Authentication**: Multi-tier with role-based access control
- **Motion Capture**: MediaPipe with confidence-based filtering
- **Analytics**: Real-time compliance tracking and risk assessment
- **Data Export**: Professional PDF reports and structured data exports
- **Responsive Design**: Mobile-optimized interface
- **Security**: PHI-compliant with audit logging

### **System Integrations**
- **MediaPipe CDN**: Reliable motion tracking library delivery
- **PostgreSQL**: Production database with Drizzle ORM
- **TanStack Query**: Optimized data fetching and caching  
- **Radix UI**: Accessible component framework
- **Replit Deployment**: Automatic scaling and database provisioning

---

This documentation provides a comprehensive overview of the ExerAI system architecture, user flows, and technical implementation. The system successfully integrates motion tracking, clinical assessment, and data analytics into a cohesive platform for hand rehabilitation research and patient care.