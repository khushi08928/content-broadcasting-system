# Content Broadcasting System

A backend system for educational content broadcasting where teachers upload subject-based content, principals approve it, and students access it via public API endpoints with time-based scheduling and rotation.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express 5
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon - cloud hosted)
- **ORM:** Drizzle ORM
- **Authentication:** JWT + bcrypt
- **File Storage:** AWS S3
- **File Upload:** Multer
- **Rate Limiting:** express-rate-limit
- **Deployment:** Render

## Project Structure

```
content-broadcasting-system/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.ts        # Signup, Login, Logout, Me
│   │   ├── content.controller.ts     # Upload, Get My Content, Get By ID
│   │   ├── approval.controller.ts    # Approve, Reject, Get Pending/All
│   │   └── broadcast.controller.ts   # Public live broadcasting + rotation
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   └── content.routes.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts         # JWT verification
│   │   ├── role.middleware.ts         # RBAC enforcement
│   │   ├── upload.middleware.ts       # Multer file handling
│   │   └── rateLimiter.middleware.ts  # Rate limiting
│   ├── models/
│   │   ├── auth.model.ts             # Users table
│   │   ├── content.model.ts          # Content table
│   │   ├── content-slot.model.ts     # Subject slots table
│   │   ├── content-schedule.model.ts # Rotation schedule table
│   │   └── index.ts                  # Barrel export
│   ├── utils/
│   │   └── s3.ts                     # AWS S3 upload/delete
│   ├── db/
│   │   └── index.ts                  # Database connection
│   ├── types/
│   │   ├── express.d.ts              # Express type augmentation
│   │   └── multer.d.ts               # Multer type declarations
│   └── index.ts                      # Entry point
├── architecture-notes.txt
├── drizzle.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js v18+
- PostgreSQL database (local or Neon)
- AWS S3 bucket with public read access

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd content-broadcasting-system

# Install dependencies
npm install

# Create .env file and fill in your values
```

### Environment Variables

```env
PORT=4000
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET=your_bucket_name
NODE_ENV=development
```

### Database Setup

```bash
npm run db:push
```

### Running Locally

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## API Documentation

**Base URL:** `https://content-broadcasting-system-fg8g.onrender.com/api/v1`

### Authentication

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/auth/signup` | ❌ | - | Register new user |
| POST | `/auth/login` | ❌ | - | Login |
| POST | `/auth/logout` | ✅ | Any | Logout |
| GET | `/auth/me` | ✅ | Any | Get current user profile |

### Content Management

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/content/upload` | ✅ | Teacher | Upload content (form-data) |
| GET | `/content/my` | ✅ | Teacher | Get own content |
| GET | `/content/my?subject=dsa` | ✅ | Teacher | Filter own content by subject |
| GET | `/content/all` | ✅ | Principal | Get all content (paginated) |
| GET | `/content/all?page=1&limit=10` | ✅ | Principal | With pagination |
| GET | `/content/pending` | ✅ | Principal | Get pending content |
| GET | `/content/:id` | ✅ | Any | Get content by ID |
| PATCH | `/content/:id/approve` | ✅ | Principal | Approve content |
| PATCH | `/content/:id/reject` | ✅ | Principal | Reject content |

### Public Broadcasting (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/content/live/:teacherId` | Get currently active content for a teacher |
| GET | `/content/live/:teacherId?subject=dsa` | Filter by subject |

### Request Examples

**Signup:**
```json
POST /api/v1/auth/signup
{
    "name": "Teacher Name",
    "email": "teacher@school.com",
    "password": "password123",
    "role": "teacher"
}
```

**Upload Content (form-data):**
```
POST /api/v1/content/upload
Authorization: Bearer <token>

title: "DSA Sorting Algorithms"
subject: "DSA"
description: "All sorting algorithms"
start_time: "2026-04-27T00:00:00Z"
end_time: "2026-04-30T23:59:59Z"
rotation_duration: 300
file: <image file (JPG/PNG/GIF, max 10MB)>
```

**Reject Content:**
```json
PATCH /api/v1/content/:id/reject
{
    "rejection_reason": "Content quality is not acceptable"
}
```

## Content Status Lifecycle

```
uploaded → pending → approved (goes live within time window)
                   → rejected (rejection reason visible to teacher)
```

## Scheduling & Rotation Logic

The system implements **time-based content rotation** per subject:

1. Each content has `start_time`, `end_time`, and `rotation_duration` (in seconds)
2. Content is only active within its time window
3. Multiple content items per subject rotate based on duration
4. Rotation loops continuously using **modular arithmetic** (`currentTime % totalCycleDuration`)
5. Each subject rotates **independently**

**Example:** 3 DSA content items, each 5 minutes (300s):
```
Total cycle = 900 seconds

Time 0-299:   Content A
Time 300-599: Content B
Time 600-899: Content C
Time 900+:    Loops back to Content A
```

## Rate Limiting

| Route | Limit | Purpose |
|-------|-------|---------|
| Auth (login/signup) | 20 req / 15 min | Brute force protection |
| Content APIs | 100 req / 15 min | General API protection |
| Broadcasting (`/live`) | 60 req / 1 min | Public endpoint protection |

## Edge Cases Handled

- No approved content → `{ data: null, message: "No content available" }`
- Approved but outside time window → not shown
- Content without start_time/end_time → never active
- Invalid teacher ID → empty response (not error)
- Invalid subject → empty response (not error)
- Duplicate email signup → 409 Conflict
- Invalid file type → 400 Bad Request
- File too large (>10MB) → 400 Bad Request
- Rejecting already rejected content → 400
- Approving already approved content → 400
- Teacher trying to approve → 403 Forbidden
- Principal trying to upload → 403 Forbidden

## Assumptions

- One principal can exist in the system (no principal hierarchy)
- Teachers can only view their own content
- Rotation duration is in seconds (default: 300 = 5 minutes)
- Content without start_time/end_time is never active
- Students don't need authentication to view live content

## Deployment

Deployed on **Render**:
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Live URL:** https://content-broadcasting-system-fg8g.onrender.com
