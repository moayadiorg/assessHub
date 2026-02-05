# Customer Assessment Platform - Technical Specification

## 1. Overview

### 1.1 Purpose
A web application for Solution Architects to conduct customer maturity assessments based on the CMM (Capability Maturity Model) framework. The platform enables creating, managing, and analyzing assessments across various capability domains.

### 1.2 Target Users
- **Administrators**: Create and manage assessment templates, categories, and questions
- **Solution Architects (SA)**: Conduct assessments with customers, add commentary
- **Viewers**: View completed assessment results (customers, stakeholders)

### 1.3 Key Features
- Multi-category questionnaires with 1-5 maturity scoring
- In-app assessment structure builder
- CSV import for bulk assessment creation
- Spider/radar charts for category visualization
- Heatmaps for identifying low-scoring areas
- PDF export and shareable results
- Role-based access control

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 14 (App Router) | React framework with server components |
| Styling | Tailwind CSS + Radix UI Themes | Utility CSS + accessible component library |
| State | Zustand | Lightweight global state management |
| Backend | Next.js API Routes | Node.js serverless functions |
| Database | SQLite + Prisma ORM | Local database (enterprise-ready migration path) |
| Auth | NextAuth.js | Authentication with OAuth providers |
| Charts | Recharts | Spider/radar charts, data visualization |
| CSV | Papa Parse | CSV parsing for imports |
| Export | jsPDF + html2canvas | PDF generation |

---

## 3. Data Models

### 3.1 Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│ AssessmentType  │       │     User        │
├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │
│ name            │       │ name            │
│ description     │       │ email           │
│ version         │       │ role            │
│ isActive        │       └─────────────────┘
│ createdAt       │
│ updatedAt       │
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐
│    Category     │
├─────────────────┤
│ id              │
│ assessmentTypeId│───────┐
│ name            │       │
│ description     │       │
│ order           │       │
└────────┬────────┘       │
         │ 1:N            │
         ▼                │
┌─────────────────┐       │
│    Question     │       │
├─────────────────┤       │
│ id              │       │
│ categoryId      │       │
│ text            │       │
│ description     │       │
│ order           │       │
└────────┬────────┘       │
         │ 1:N            │
         ▼                │
┌─────────────────┐       │
│ QuestionOption  │       │
├─────────────────┤       │
│ id              │       │
│ questionId      │       │
│ score (1-5)     │       │
│ label           │       │
│ description     │       │
└─────────────────┘       │
                          │
┌─────────────────┐       │
│   Assessment    │◄──────┘
├─────────────────┤
│ id              │
│ name            │
│ customerName    │
│ assessmentTypeId│
│ createdBy       │
│ status          │
│ createdAt       │
│ updatedAt       │
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐
│    Response     │
├─────────────────┤
│ id              │
│ assessmentId    │
│ questionId      │
│ score (1-5)     │
│ commentary      │
└─────────────────┘
```

### 3.2 Assessment Status Flow
```
draft ──► in-progress ──► completed
  │                           │
  └───────────────────────────┘
        (can reopen)
```

### 3.3 CMM Maturity Levels

| Score | Level | Description |
|-------|-------|-------------|
| 1 | Initial | Ad-hoc, chaotic, no defined processes |
| 2 | Managed | Basic processes established, reactive |
| 3 | Defined | Standardized processes across organization |
| 4 | Quantitatively Managed | Measured and controlled |
| 5 | Optimizing | Continuous improvement, innovative |

---

## 4. API Specification

### 4.1 Assessment Types

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assessment-types` | List all assessment types |
| GET | `/api/assessment-types/[id]` | Get single type with categories/questions |
| POST | `/api/assessment-types` | Create new assessment type |
| PUT | `/api/assessment-types/[id]` | Update assessment type |
| DELETE | `/api/assessment-types/[id]` | Delete assessment type |
| POST | `/api/assessment-types/import` | Import from CSV |

### 4.2 Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories?typeId=` | List categories for a type |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/[id]` | Update category |
| DELETE | `/api/categories/[id]` | Delete category |
| PUT | `/api/categories/reorder` | Reorder categories |

### 4.3 Questions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/questions?categoryId=` | List questions for a category |
| POST | `/api/questions` | Create question with options |
| PUT | `/api/questions/[id]` | Update question |
| DELETE | `/api/questions/[id]` | Delete question |

### 4.4 Assessments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assessments` | List all assessments (with filters) |
| GET | `/api/assessments/[id]` | Get assessment with responses |
| POST | `/api/assessments` | Create new assessment |
| PUT | `/api/assessments/[id]` | Update assessment metadata |
| DELETE | `/api/assessments/[id]` | Delete assessment |
| GET | `/api/assessments/[id]/results` | Get computed scores |
| GET | `/api/assessments/[id]/export` | Export as PDF |

### 4.5 Responses

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/responses` | Save/update response (upsert) |
| PUT | `/api/responses/bulk` | Bulk save responses |

---

## 5. Scoring Logic

### 5.1 Question Score
Each question receives a score from 1-5 based on user selection.

### 5.2 Category Score
```
categoryScore = sum(questionScores) / numberOfQuestions
```
Rounded to 1 decimal place.

### 5.3 Overall Score
```
overallScore = sum(categoryScores) / numberOfCategories
```
Rounded to 1 decimal place.

### 5.4 Maturity Level Mapping
| Score Range | Level |
|-------------|-------|
| 1.0 - 1.4 | Initial |
| 1.5 - 2.4 | Managed |
| 2.5 - 3.4 | Defined |
| 3.5 - 4.4 | Quantitatively Managed |
| 4.5 - 5.0 | Optimizing |

---

## 6. User Interface Screens

### 6.1 Navigation Structure
```
├── Dashboard (/)
├── Assessments
│   ├── List (/assessments)
│   ├── New (/assessments/new)
│   ├── Conduct (/assessments/[id])
│   └── Results (/assessments/[id]/results)
└── Admin
    ├── Dashboard (/admin)
    ├── Assessment Types (/admin/types)
    ├── Type Editor (/admin/types/[id])
    ├── Questions (/admin/questions/[typeId])
    └── CSV Import (/admin/import)
```

### 6.2 Screen Specifications

#### Dashboard
- Recent assessments (last 5)
- Quick stats: Completed, In Progress, Drafts
- "Start New Assessment" button
- Quick access to admin (if authorized)

#### Assessment List
- Table with columns: Name, Customer, Type, Status, Created, Actions
- Filters: Status, Type, Date range
- Search by name/customer
- Actions: View, Edit, Delete, Export

#### Assessment Form
- Category tabs or accordion navigation
- Progress indicator (X of Y questions answered)
- Per-question:
  - Question text and description
  - 5 radio buttons with maturity level labels
  - Commentary textarea (optional)
- Auto-save on answer change
- Save Draft / Submit buttons

#### Results Dashboard
- Spider/Radar chart showing all category scores
- Heatmap grid: Categories (rows) × Questions (columns)
  - Color scale: Red (1) → Yellow (3) → Green (5)
- Score summary table
- Export to PDF button
- Share link generator

#### Admin: Assessment Type Builder
- List of existing types with version numbers
- Create new type form
- Edit type metadata
- Link to manage categories/questions

#### Admin: Question Editor
- Tree view: Categories → Questions
- Drag to reorder
- Inline editing
- Modal for maturity level descriptions
- Preview assessment structure

#### Admin: CSV Import
- File dropzone
- Format specification / template download
- Data preview table
- Validation error display
- Import button with progress

---

## 7. CSV Import Format

### 7.1 Template Structure
```csv
assessment_type,category,category_order,question,question_order,level_1,level_2,level_3,level_4,level_5
```

### 7.2 Column Definitions

| Column | Required | Description |
|--------|----------|-------------|
| assessment_type | Yes | Name of assessment type (creates if not exists) |
| category | Yes | Category name |
| category_order | Yes | Display order (integer) |
| question | Yes | Question text |
| question_order | Yes | Order within category (integer) |
| level_1 | Yes | Description for score 1 (Initial) |
| level_2 | Yes | Description for score 2 (Managed) |
| level_3 | Yes | Description for score 3 (Defined) |
| level_4 | Yes | Description for score 4 (Quantitatively Managed) |
| level_5 | Yes | Description for score 5 (Optimizing) |

### 7.3 Example
```csv
assessment_type,category,category_order,question,question_order,level_1,level_2,level_3,level_4,level_5
Cloud Maturity,Infrastructure,1,How automated is your infrastructure provisioning?,1,Manual provisioning,Some scripts,IaC templates,Full IaC with CI/CD,Self-service platform
Cloud Maturity,Infrastructure,1,How do you manage infrastructure state?,2,No tracking,Spreadsheets,Basic state files,Centralized state management,GitOps with drift detection
Cloud Maturity,Security,2,How are secrets managed?,1,Hardcoded,Environment variables,Vault with manual rotation,Automated rotation,Zero-trust dynamic secrets
```

---

## 8. Authentication & Authorization

### 8.1 Roles

| Role | Permissions |
|------|-------------|
| admin | Full access: manage types, questions, all assessments |
| user (SA) | Create/edit own assessments, view all assessment types |
| viewer | View completed assessments (read-only) |

### 8.2 Access Matrix

| Resource | Admin | User | Viewer |
|----------|-------|------|--------|
| Dashboard | ✓ | ✓ | ✓ |
| Assessment Types (view) | ✓ | ✓ | ✓ |
| Assessment Types (manage) | ✓ | ✗ | ✗ |
| Assessments (own) | ✓ | ✓ | ✗ |
| Assessments (all) | ✓ | ✗ | ✗ |
| Assessment Results | ✓ | ✓ | ✓ (shared only) |
| Admin Panel | ✓ | ✗ | ✗ |

---

## 9. Project Structure

```
/IaCWorkshop/
├── spec/                     # This specification
│   └── SPECIFICATION.md
├── mocks/                    # HTML mockups (Phase 0)
│   ├── index.html
│   ├── assessment-list.html
│   ├── assessment-form.html
│   ├── results.html
│   ├── admin-types.html
│   ├── admin-questions.html
│   ├── admin-csv.html
│   └── styles.css
├── prisma/
│   ├── schema.prisma
│   └── dev.db
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── assessments/
│   │   ├── admin/
│   │   └── api/
│   ├── components/
│   │   ├── layout/
│   │   ├── assessment/
│   │   ├── visualization/
│   │   └── admin/
│   ├── lib/
│   │   ├── prisma.ts
│   │   └── utils/
│   ├── store/
│   └── types/
├── public/
├── package.json
├── tailwind.config.ts
├── next.config.js
└── CLAUDE.md
```

---

## 10. Implementation Phases

### Phase 0: HTML Mocks
Create static mockups to visualize all screens before coding.

### Phase 1: Foundation
- Project scaffolding
- Database setup
- Base layout with navigation

### Phase 2: Data Layer
- Prisma schema and migrations
- API routes for all entities

### Phase 3: Admin (Build the Builder)
- Assessment type management
- Category/question CRUD
- CSV import

### Phase 4: Assessment Engine
- Assessment form
- Scoring logic
- Auto-save

### Phase 5: Visualization
- Spider chart
- Heatmap
- Results dashboard

### Phase 6: Export & Auth
- PDF export
- NextAuth.js integration
- Role-based access

### Phase 7: AI Features (Future)
- AI-assisted answer suggestions
- Commentary generation

---

## 11. Non-Functional Requirements

### 11.1 Performance
- Page load < 2 seconds
- Assessment auto-save < 500ms response
- Support 50+ concurrent users

### 11.2 Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### 11.3 Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support (via Radix UI)

### 11.4 Security
- HTTPS only
- CSRF protection
- Input sanitization
- SQL injection prevention (Prisma)

---

## 12. Verification Checklist

| Phase | Verification |
|-------|--------------|
| 0 | HTML mocks render correctly in browser |
| 1 | `npm run dev` starts, sidebar collapses |
| 2 | Prisma Studio shows tables, APIs return data |
| 3 | Can create assessment type, categories, questions via UI |
| 4 | Can complete an assessment, scores calculate correctly |
| 5 | Charts render with sample data |
| 6 | PDF exports successfully, auth restricts access |
