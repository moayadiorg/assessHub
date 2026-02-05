# AssessHub - Coder Agent Memory

## Project Overview
Next.js 14 App Router application for customer assessments with Prisma ORM, SQLite, and Radix UI Themes.
- Dev server: Port 3005
- Database: SQLite with Prisma
- UI Library: Radix UI Themes

## Project Structure
- `/src/app/api/*` - API routes using Next.js App Router conventions
- `/src/components/*` - Reusable React components
- `/src/app/*` - Page components
- `/prisma/schema.prisma` - Database schema

## API Patterns
1. **Query Parameters**: Use URLSearchParams for filtering (status, typeId, search)
2. **Response Format**: APIs return JSON with proper HTTP status codes
3. **Error Handling**: Validate required fields, return descriptive error messages
4. **Async Params**: Next.js 14 requires `await params` for dynamic routes

## Component Patterns
1. **Client Components**: Use `'use client'` directive for interactive components
2. **TypeScript**: Define interfaces for props and API response types
3. **Radix UI**: Import from `@radix-ui/themes`, use Flex/Box for layout
4. **Header Component**: Accepts `title` and `showNewAssessment` props

## Filter Implementation
- Use `useState` for filter values (search, status, type)
- Debounce search input with 300ms timeout using `useEffect`
- Rebuild query params and refetch data when filters change
- Status values: 'draft', 'in-progress', 'completed'

## Date Formatting
Relative time display: "<60m: Xm ago", "<24h: Xh ago", "<7d: Xd ago", else: full date

## Assessment Status
- draft: gray badge
- in-progress: yellow badge
- completed: green badge

## Dashboard Statistics (Plan 12)
- **Authentication**: All API routes MUST check authentication using `getServerSession(authOptions)`
- **Scoring Logic**: Categories with no responses return score 0 (not null/filtered out)
  - Only return null for overall score if NO responses exist at all
  - Must match logic in `/api/assessments/[id]/results/route.ts:41-73`
- **Division by Zero**: Check `totalAssessments === 0` before division, show "No assessments yet" message
- **Pattern**:
  ```typescript
  const categoryScores = categories.map(category => {
    // ... calculate responses
    if (categoryResponses.length === 0) return 0  // Not null!
    return totalScore / categoryResponses.length
  })
  const validCategories = categoryScores.filter(score => score > 0)
  ```

## Implementation Notes
- Assessment progress calculated as answeredQuestions/totalQuestions
- Empty states handle both no data and filtered no results scenarios
- Delete operations require confirmation dialog
- Forms validate required fields and display error messages

## API Security & Error Handling (Plan 13)
1. **Authentication**: All API routes require `getServerSession(authOptions)` check at the start
   - Return 401 Unauthorized if no session
   - Import: `import { getServerSession } from 'next-auth'`

2. **Prisma Error Codes**:
   - P2002: Unique constraint violation (duplicate) → 409 Conflict
   - P2025: Record not found → 404 Not Found
   - Wrap create/update/delete in try-catch blocks

3. **Input Validation**:
   - Customer name max length: 200 characters (constant: `MAX_NAME_LENGTH = 200`)
   - Return 400 Bad Request with descriptive message if validation fails
   - Always trim() string inputs before validation

4. **Race Condition Handling**:
   - Customer creation in POST /api/assessments: If P2002 error, retry findUnique
   - DELETE operations: Catch P2025 for concurrent deletion scenarios
   - PATCH operations: Reject empty updates with "No fields to update"

## Drag-and-Drop (Plan 05)
- Use `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` packages
- Pattern: `DndContext` > `SortableContext` > `useSortable` for items
- `arrayMove` utility reorders arrays after drag
- Call reorder API endpoints (/api/categories/reorder, /api/questions/reorder)

## Admin Questions Editor (Plan 05)
- Route: `/admin/questions/[typeId]/page.tsx`
- Uses `useParams()` hook for client-side param access (Next.js 15+)
- Components:
  - CategoryList: Drag-and-drop wrapper
  - CategoryItem: Expandable accordion with questions
  - QuestionItem: Display with color-coded maturity badges
  - CategoryDialog: CRUD for categories
  - QuestionDialog: CRUD for questions with Tabs (Question/Maturity Levels)
- Color scheme for scores 1-5: red, orange, yellow, green, emerald

## Dialog Pattern
1. Control open state in parent with `useState`
2. Pass edit object or null for create mode
3. `useEffect` populates form when dialog opens
4. `onSuccess` callback refreshes parent data
5. Always use `Dialog.Close` with type="button" for cancel

## Assessment Form (Plan 08)
- Route: `/assessments/[id]/page.tsx`
- Auto-save pattern: Immediate save on score selection, 500ms debounce on commentary
- Use `lodash.debounce` for debounced saves
- Optimistic UI updates with `setResponses` before API call
- Components:
  - CategoryNav: Sidebar showing category completion (green checkmark when all answered)
  - QuestionCard: Individual question with MaturitySelector and optional commentary
  - MaturitySelector: 5-option radio group with tooltips, color-coded 1-5
- Save status: Show spinner while saving, checkmark with timestamp after save
- Progress tracking: answered/total in header with Progress bar
- Category navigation: Previous/Next buttons at bottom
- Complete button: Disabled until all questions answered, redirects to /results
- Animation: Added `.animate-spin` to globals.css using @keyframes

## Results Visualization (Plan 09)
- Route: `/assessments/[id]/results/page.tsx`
- Uses `recharts` library for spider/radar charts
- Components in `/src/components/visualization/`:
  - **SpiderChart**: RadarChart with category scores, domain [0,5], tooltips
  - **Heatmap**: Color-coded grid of question scores with legend
  - **ScoreSummary**: 4 cards (Overall Score, Completion %, Strongest, Weakest)
  - **MaturityBadge**: Level badge with color mapping (1=red, 2=orange, 3=yellow, 4=green, 5=teal)
  - **CategoryBreakdown**: Collapsible sections with Progress bars and question details
- Color scheme: Same as assessment form (red→orange→yellow→green→emerald for 1-5)
- Actions: "Back to Assessments", "Share" (placeholder), "Export PDF" (placeholder)
- Collapsible pattern: Use `@radix-ui/react-collapsible` with chevron icons

## PDF Export (Plan 10)
- Libraries: `jspdf` (v4.1.0) and `html2canvas` (v1.4.1)
- Location: `/src/lib/pdf-export.ts` for utilities, `/src/components/export/` for components
- Key functions:
  - `exportToPDF(elementId, options)`: Captures element as canvas, creates multi-page PDF
  - `generatePDFBlob(elementId, options)`: Returns PDF as Blob for programmatic use
- PDFDocument component:
  - A4 width (210mm) with 20mm padding
  - Includes header, overall score, spider chart, category details, footer
  - Uses Recharts RadarChart for visualization
  - Color-coded scores: red (<2), orange (2-3), yellow (3-4), green (>=4)
- ShareDialog component:
  - Shows full URL with copy-to-clipboard button
  - "Copied!" feedback with 2-second timeout
- Type compatibility: Use `as any` for html2canvas options (type definitions are outdated)
- Multi-page support: Automatically splits long content across multiple PDF pages

## Reports Landing Page (Plan 14)
- Route: `/reports/page.tsx`
- **Authentication**: Uses `useSession()` hook, redirects to `/auth/signin` if unauthenticated
- **Customer Reports Section**:
  - Dropdown populated from `GET /api/customers`
  - Shows assessment count next to each customer name
  - "View Report" button navigates to `/reports/customer/[id]`
  - Disabled if no customer selected
- **Comparison Reports Section**:
  - Type dropdown from `GET /api/assessment-types?active=true`
  - Assessment dropdowns from `GET /api/assessments?typeId=xxx&status=completed`
  - Filters prevent selecting same assessment in both dropdowns
  - Shows message if < 2 completed assessments available
  - "Compare" button navigates to `/reports/compare?a1=xxx&a2=yyy`
- **All Customers Table**:
  - Searchable with real-time filtering
  - Displays customer name, assessment count badge, and quick "View Report" action
  - Disables "View Report" for customers with 0 assessments
  - Empty states: "No customers found" / "No customers match your search"
- **Error Handling**: Shows error card with retry button on API failures
- **Loading States**: Shows loading message during initial data fetch and auth check

## Customer Report Page (Plan 15)
- Route: `/reports/customer/[id]/page.tsx`
- API: `/api/reports/customer/[id]/route.ts`
- **Authentication**:
  - API requires `getServerSession(authOptions)` check
  - Client checks for 401 response and redirects to `/auth/signin`
- **Data Structure**:
  - Fetches customer with all completed assessments
  - Groups assessments by type for organized display
  - Calculates scores using same logic as results route
  - Orders assessments chronologically (updatedAt: asc) for trend analysis
- **Trend Analysis**:
  - Direction: improving (change > 0.1), declining (change < -0.1), stable (|change| <= 0.1)
  - Compares first vs last assessment score per type
  - Only shown when 2+ assessments exist for a type
  - Visual indicators: ArrowUpIcon (green), ArrowDownIcon (red), MinusIcon (gray)
- **Components**:
  - **TrendChart**: Recharts LineChart showing score evolution over time
    - X-axis: Date labels (MMM YY format)
    - Y-axis: Scores 0-5 with reference lines at 2.5 and 3.5
    - Tooltip: Shows assessment name, score, and full date
    - Color: Uses assessment type's iconColor
  - **SpiderChart**: Reused from visualization components for latest assessment
  - **Assessment Table**: Links to individual results, shows completion date, score, maturity level
- **PDF Export**: Uses `exportToPDF` from `/src/lib/pdf-export.ts`
- **Empty States**: Handles no completed assessments gracefully
- **Navigation**: Back button to `/reports`, links to individual assessment results

## Comparative Report (Plan 16)
- Route: `/reports/compare/page.tsx`
- API: `GET /api/reports/compare?a1=xxx&a2=yyy`
- **Validation**: Requires authentication, both params required, assessments must exist and be same type
- **Score Calculation**:
  - Track `answeredQuestions` per category
  - Filter by `answeredQuestions > 0` (not `score > 0`) to match results route
  - Categories with no responses return score 0
- **Delta Calculation**: `score1 - score2` (positive = assessment1 higher, negative = assessment2 higher)
- **Components**:
  - **ComparisonSpiderChart**: Overlaid radar chart with 2 datasets (blue/green)
  - **ComparisonTable**: Score comparison with delta badges (blue=positive, green=negative, gray=tie)
  - **AssessmentHeader**: Side-by-side cards with winner badge
- **Layout**: Assessment headers → Overall comparison → Spider chart → Comparison table
- **PDF Export**:
  - Uses `exportToPDF` with landscape orientation
  - Sanitize assessment names with `replace(/[^a-z0-9_\-\.]/gi, '_')`
  - Wrap in try-catch with alert on error
- **Query Params**: Use `useSearchParams()` for client-side access to `a1` and `a2`

## Wave 7 Code Review Fixes
1. **Middleware**: Added `/reports/:path*` to matcher for route protection
2. **401 Handling**: Customer report page checks for 401 and redirects to signin
3. **PDF Export**: Added error handling with try-catch and user alerts
4. **Filename Sanitization**: Remove invalid characters from PDF filenames
5. **Scoring Consistency**: Filter by `answeredQuestions > 0` to match results route pattern
