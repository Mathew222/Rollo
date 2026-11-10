# Personal Expense Tracker

A lightweight, modern full-stack personal expense tracking web application built for the **Software Engineer Practical Test**, denominated in **Indian Rupee (₹)** and styled with a warm, natural aesthetic using the **Outfit** typography family.

---

## 1. How to Run (Exact Commands)

### Prerequisites
- **Node.js**: v18.0.0+ (v20+ recommended)
- **npm**: v9.0.0+

### Setup & Launch
1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server** (starts Express API & Vite dev server on port 3000):
   ```bash
   npm run dev
   ```
   Open your browser at: `http://localhost:3000`

3. **Type-checking & Linting**:
   ```bash
   npm run lint
   ```

4. **Production Build & Execution**:
   ```bash
   npm run build
   npm start
   ```

---

## 2. Requirements Implemented

| Requirement | Implementation Details |
| :--- | :--- |
| **1. Add an expense** | Form fields: `Title` (short text), `Amount` (number in local currency `₹`, validated `> 0`, max limit `₹1,00,00,000`), `Category` (Food, Transport, Shopping, Bills, Entertainment, Other), `Date` (defaults to today `YYYY-MM-DD`, with calendar validation & quick "Today"/"Yesterday" shortcuts), and optional `Note` (longer text). |
| **2. View list of all expenses** | Sorted chronologically by `date` (most recent first). Secondary sort by creation timestamp for identical dates. Displays all fields: Title, Amount in negative red tabular numerals (`-₹XX.XX`), Category tag, Date, and Note. |
| **3. Edit or delete any expense** | Full CRUD: Edit opens modal pre-populated with current values and inline validation. Delete prompts with a confirmation dialog showing expense details, plus a notification with 1-click **Undo** recovery. |
| **4. Monthly summary for current month** | Warm sunset gradient hero cards: Total spent in the current month in `₹`, transaction count, average per transaction, top category, and interactive daily spending histogram with hover tooltips. Includes previous/next month navigation controls and category breakdown grid. |
| **5. Filtering** | Filter by **Category** (All + 6 categories), **Date Range** (`from` / `to` with presets: "All Time", "This Month", "Last 30 Days"), and **Title** (real-time case-insensitive partial match across title and note). |

---

## 3. Stack Choices & Tradeoffs

| Component | Choice | Tradeoff / Rationale |
| :--- | :--- | :--- |
| **Backend & Server** | **Node.js + Express** (`server.ts`) | **Pros**: Ultra-fast to implement, zero external server dependencies, provides clean RESTful API (`/api/expenses`, `/api/expenses/summary`).<br>**Tradeoff**: In-memory / file I/O rather than multi-process connection pools. |
| **Database / Persistence** | **JSON file storage** (`data/expenses.json`) | **Pros**: Zero database daemon configuration (e.g. Postgres or Docker not required to grade), portable, human-readable, persists across page refreshes and server restarts.<br>**Tradeoff**: For high-concurrency production workloads with millions of records, an RDBMS (PostgreSQL/SQLite) with indexing on `date` and `category` would be preferred. For a single-user personal expense tracker, file storage provides ideal balance. |
| **Frontend Framework** | **React 19 + TypeScript** | **Pros**: Declarative UI state, full type safety for expense records, reusable component hierarchy, instant reactive filtering and optimistic UI updates.<br>**Tradeoff**: Slightly larger bundle than vanilla JS, but drastically reduces boilerplate and state bugs. |
| **Styling** | **Tailwind CSS v4** | **Pros**: Standardized design tokens, zero CSS runtime overhead, accessible typography hierarchy, high readability without CSS bloat. |

---

## 4. Edge Cases Handled

1. **Empty States**:
   - **Zero expenses in database**: Shows a dedicated welcome card explaining how to log the first expense, with a direct CTA button and a "Reset Demo Data" option.
   - **Zero results matching filters**: When search/filter returns no items, displays a clear "No matching expenses found" state with a 1-click "Reset All Filters" action.
2. **Invalid & Hostile Inputs**:
   - Blank / whitespace-only titles are blocked with inline error messages.
   - Non-numeric amounts, negative amounts, and zero amounts (`$0.00`) are blocked.
   - Extremely large numbers ($10,000,000+) are capped.
   - Invalid category tampering rejected by both client validation and backend API.
   - Invalid dates (e.g., February 31st or malformed strings) caught by ISO validator.
3. **Weird Date Ranges**:
   - If the user selects a `from` date that is chronologically **after** the `to` date (e.g., `2026-12-01` to `2026-11-01`), the UI displays an amber warning alert and provides a 1-click **"Swap Dates"** button to correct the range without frustrating the user.
4. **Secondary Sort Stability**:
   - When multiple expenses occur on the same calendar day, records are deterministically sorted by `createdAt` ISO timestamp so the most recently logged expense consistently appears on top.
5. **Note Display**:
   - Long multi-paragraph notes are cleanly clamped with a "Show more / Show less" toggle so they never blow out the list layout.

---

## 5. What's Done vs. Skipped (And Why)

### Done:
- Complete end-to-end CRUD operations (Create, Read, Update, Delete) with persistent storage.
- Real-time multi-criteria filtering (Category + Date Range + Title search).
- Monthly aggregation engine with category breakdowns and month switcher.
- Graceful empty states and input validation on both client and server.
- Seed data covering current and prior months for immediate evaluation.
- Quick Undo toast on deletion to prevent accidental data loss.

### Skipped (and Rationale based on Test Guidelines):
- **User Authentication / Multi-tenancy**: Explicitly listed under *"What We Don't Care About"*; keeping it single-user minimizes configuration overhead for reviewers.
- **Multi-currency conversion**: The prompt stated: *"in your local currency (no multi-currency)"*. Standard `$` formatting is used.
- **Complex cloud deployment**: Prompt specified *"Runs locally — no deployment required"*.
- **Heavy chart libraries**: Built an accessible, lightweight native CSS proportional distribution bar to avoid heavy bundle dependencies like Chart.js/Recharts while delivering crystal-clear visual breakdown.

---

## 6. Known Rough Edges & Future Improvements

1. **Concurrent File Writes**: The JSON storage writes to disk synchronously. In an enterprise multi-user app, we would use SQLite with WAL mode or PostgreSQL to prevent race conditions.
2. **Pagination / Infinite Scroll**: The app currently renders all filtered expenses. For datasets with >10,000 entries, virtualized list rendering (e.g. `tanstack-virtual`) or server-side cursor pagination would optimize memory and rendering performance.
3. **Export to CSV**: Adding a 1-click CSV export would be a natural next utility for personal budgeting.
