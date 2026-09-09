# Online Equipment Borrowing and Return Monitoring System

**Course:** Systems Analysis and Design (Intermediate Software Development)  
**Repository:** `SAD-EquipmentBorrowing-Moreno`  
**Live System:** https://smartchain11.github.io/SAD-EquipmentBorrowing-Moreno/

A full-stack web application for monitoring the borrowing and return of College
equipment (laptops, projectors, cameras, microphones, routers, extension cords,
HDMI cables, computer toolkits, portable speakers, and other ICT equipment).

| Layer     | Technology                                      |
| --------- | ----------------------------------------------- |
| Front End | HTML, CSS, JavaScript                           |
| Hosting   | GitHub Pages                                    |
| Backend   | Supabase (PostgreSQL + Authentication)          |

---

## Features

1. **User Authentication** – Login, Logout, session management.
2. **Dashboard** – Total Equipment, Available, Borrowed, Returned Transactions, Overdue.
3. **Equipment Module (CRUD)** – Add, view, edit, delete equipment.
4. **Borrowing Module** – Record a borrowing transaction atomically.
5. **Return Equipment** – Marks a transaction as Returned and makes the equipment Available again.
6. **Overdue Detection** – `IF current date > due date AND status != 'Returned' THEN Overdue`.
7. **Search** – By equipment name, asset code, or borrower name.
8. **Filter** – By equipment availability and transaction status.
9. **Business Rules** – BR-01 to BR-12 enforced in the UI, database, and functions.

---

## Getting Started

### 1. Set up the Supabase backend

1. Go to https://supabase.com and create a new project.
2. Open **SQL Editor** → paste the whole content of `supabase/schema.sql` → **Run**.
   This creates the `equipment` and `borrow_transactions` tables, enables
   **Row Level Security**, and creates the atomic `record_borrow()` and
   `return_equipment()` functions.
3. Open **Authentication → Providers → Email**: if you want instant account
   creation without email confirmation, disable **"Confirm email"**.
4. Open **Project Settings → API** and copy the **Project URL** and the
   **anon public** key.

### 2. Configure the application

Open `js/config.js` and paste your credentials:

```js
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";
```

### 3. Test locally

Open `index.html` in a browser (double-click the file), create an account, and sign in.

### 4. Deploy to GitHub Pages

1. Create a new repository named `SAD-EquipmentBorrowing-Moreno` (public).
2. Upload the whole project folder to the repository (or use `git push`).
3. GitHub → **Settings → Pages** → Source: **Deploy from a branch** → branch `main` → `/` (root) → **Save**.
4. Wait a minute, then open:
   `https://smartchain11.github.io/SAD-EquipmentBorrowing-Moreno/`

---

## Database Design

**Table 1: `equipment`**

| Field           | Data Type | Description                          |
| --------------- | --------- | ------------------------------------ |
| `id`            | bigint    | Primary key                          |
| `equipment_name`| text      | Name of equipment                    |
| `category`      | text      | Equipment category                   |
| `asset_code`    | text      | Unique equipment code                |
| `condition`     | text      | Good / Fair / For Repair             |
| `availability`  | text      | Available / Borrowed                 |
| `created_at`    | timestamp | Date record was created              |

**Table 2: `borrow_transactions`**

| Field           | Data Type | Description                            |
| --------------- | --------- | -------------------------------------- |
| `id`            | bigint    | Primary key                            |
| `equipment_id`  | bigint    | Reference to equipment (FK)            |
| `borrower_name` | text      | Name of borrower                       |
| `borrower_type` | text      | Student / Faculty / Staff              |
| `department`    | text      | Office/Department                      |
| `date_borrowed` | date      | Borrowing date                         |
| `due_date`      | date      | Expected return date                   |
| `date_returned` | date      | Actual return date                     |
| `status`        | text      | Borrowed / Returned / Overdue          |
| `user_id`       | uuid      | User who recorded the transaction      |
| `created_at`    | timestamp | Record creation date                   |

**Relationship:** One `equipment` may appear in many `borrow_transactions`,
but each transaction refers to exactly one equipment item (1:N).

---

## Business Rules Implemented

| ID    | Business Rule                                   | Where enforced            |
| ----- | ----------------------------------------------- | ------------------------- |
| BR-01 | Equipment name cannot be empty                  | UI validation             |
| BR-02 | Asset code must be unique                       | `UNIQUE` constraint + UI  |
| BR-03 | Only available equipment may be borrowed        | `record_borrow()` + UI    |
| BR-04 | Borrower name must be provided                  | UI validation             |
| BR-05 | Due date cannot be earlier than borrowing date  | DB CHECK + UI             |
| BR-06 | Newly borrowed equipment receives Borrowed status | `record_borrow()`       |
| BR-07 | Borrowed equipment becomes unavailable          | `record_borrow()`         |
| BR-08 | Returned equipment becomes available again      | `return_equipment()`      |
| BR-09 | Equipment past due date identified as Overdue   | `computedStatus()` (JS)   |
| BR-10 | Deletion requires confirmation                  | `confirm()` dialog        |
| BR-11 | Only authenticated users may manage records     | Supabase Auth + RLS       |
| BR-12 | A returned transaction cannot be returned twice | `return_equipment()`      |

---

## Requirements Traceability Matrix

| Requirement | Feature            | Test Case |
| ----------- | ------------------ | --------- |
| FR-01       | User Login         | TC-01     |
| FR-02       | Add Equipment      | TC-02     |
| FR-03       | Edit Equipment     | TC-03     |
| FR-04       | Delete Equipment   | TC-04     |
| FR-05       | Record Borrowing   | TC-05     |
| FR-06       | Return Equipment   | TC-06     |
| FR-07       | Detect Overdue     | TC-07     |
| FR-08       | Search Records     | TC-08     |
| FR-09       | Filter Records     | TC-09     |
| FR-10       | Dashboard Summary  | TC-10     |

Full documents are in the `docs/` folder along with the Use Case Diagram (SVG)
and ERD (SVG).

---

## Project Structure

```
SAD-EquipmentBorrowing-Moreno/
├── index.html            # Login / Sign-up page
├── dashboard.html        # Dashboard with summary statistics
├── equipment.html        # Equipment CRUD + search/filter
├── transactions.html     # Borrowing, return, overdue, search/filter
├── css/style.css         # Styles
├── js/
│   ├── config.js         # SUPABASE_URL and anon key (edit this)
│   ├── common.js         # Toasts, auth guard, formatting helpers
│   ├── auth.js           # Login / sign-up logic
│   ├── equipment.js      # Equipment module
│   ├── transactions.js   # Transaction / return module
│   └── dashboard.js      # Dashboard module
├── supabase/schema.sql   # Database schema, RLS policies, functions
├── docs/                 # SAD documents and diagrams
└── README.md
```

---

## Submitted by

**Name:** Jun Dave Moreno · **Section:** BSIT 3B