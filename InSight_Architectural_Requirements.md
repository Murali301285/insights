# InSight ERP & Intelligence Platform
**Architectural & Technical Requirements Document**

## 1. Executive Summary
**InSight** is an enterprise-grade Analytics, Resource Planning, and Operational Intelligence platform. It provides a multi-tenant capability (by Company), designed to centralize and visualize critical business metrics across varying departments: Finance, Sales, Manufacturing, HR, Supply Chain, and Field Support. 

Beyond passive metric tracking, InSight integrates **Active Workflows** (Task Delegation, Opportunity scaling, Order Tracking, Ticketing) and an **AI-driven Document Vault** that utilizes LLMs to parse, summarize, and extract actionable insights contextually from business documents.

---

## 2. Technology Stack & Frameworks

### 2.1 Backend Architecture
*   **Framework:** Next.js 16.1 (App Router, Turbopack)
*   **Database:** PostgreSQL (Relational consistency).
*   **ORM:** Prisma Client (v5.10.0+). Schema-driven migrations tightly coupled with TypeScript.
*   **Security & Auth:** 
    *   Stateless, secure HTTP-only Cookies via Custom JWT `jose` implementations.
    *   Password Hashing via `bcryptjs`.
    *   RBAC (Role-Based Access Control) defined via Database schemas mapping Roles to Dynamic `AppPage` accesses.
*   **AI Engine Component:** Groq SDK utilizing `llama-3.3-70b-versatile` for high-speed deterministic LLM completions.
*   **Deployment:** PM2 managed Node cluster driven by `ecosystem.config.js`.

### 2.2 Frontend Architecture
*   **Framework:** React 19 / Next.js (Server & Client Components)
*   **Styling:** Tailwind CSS (v4) + `tailwindcss-animate`
*   **Component Library:** Radix UI primitives integrated with Shadcn UI aesthetics (Glassmorphism, custom color scales).
*   **Data Visualization:** `recharts` for charting and `reactflow` / `dagre` for directed acyclic graph layouts (Workflow rendering).
*   **Data Tables:** `@tanstack/react-table` for highly robust pagination, sorting, and filtering matrices.

---

## 3. Data Domain & Master Structure

InSight relies heavily on a highly normalized relational DB structure. 

### 3.1 Multi-Tenancy & Authorization Models
*   **`Company`**: Represents an isolated tenant workspace. All metrics and operational data resolve to a `companyId`.
*   **`User`**: Linked to specific companies. Validated via `isBlocked` boolean.
*   **`Role` & `RoleAccess`**: Mapped dynamically against `AppPage`. Facilitates dynamic NavBar rendering and UI restrictions (`canView`, `canAdd`, `canEdit`, `canDelete`).

### 3.2 Master Configuration Tables
Robust lookup tables exist to standardize user-input.
*   **Business Configurations:** `CategoryMaster`, `CustomerMaster`, `SupplierMaster`, `PaymentTypeMaster`, `ZoneMaster`.
*   **Pipeline Tracking:** `StatusMaster`, `StageMaster`, `RequestStageMaster`.

---

## 4. Core Functional Modules

### 4.1 Finance Metrics (CFO Dashboard)
Tracks top-level company liquidity and profitability.
*   **Entities:** `FinanceMetrics`, `FinanceFundValue`.
*   **Key Tracking:** Cash Flow (Inflows/Outflows), Profit Margins, Account Receivables (AR) / Account Payables (AP) distributed across 30/60/90+ day aging buckets.

### 4.2 Sales & Order Management
Tracks the complete sales pipeline from Lead to Fulfilled Order.
*   **Metric Layer:** `SalesMetrics` tracking aggregate leads, RFQs, Quotes, Negotiations, Win/Loss total values.
*   **Operational Layer:** 
    *   **Opportunities**: Links Customers, Business Zones, and Payment Types. Logs dynamic Status Histories as opportunities progress.
    *   **Orders**: Successfully converted opportunities. Tied dynamically to Stage tracking.

### 4.3 Supply Chain & Inventory
Tracks outbound spending and procurement.
*   **Metric Layer:** `SupplyChainMetrics` tracks outstanding payments, supplier geolocation splits, and payment aging dependencies.
*   **Operational Layer:** 
    *   **`InventoryOrder`**: Logs items, quantities, taxes, conditions, and payment types against a supplier. 
    *   **`SupplyRequest`**: Internal tracking pipeline to authorize purchasing dependencies.

### 4.4 Manufacturing Metrics
Yield and production oversight.
*   **Metric Layer:** `ManufacturingMetrics`.
*   **KPIs:** Efficiencies, Project Health (On Track, Delayed, Critical), and RFQ conversion logic. Integrates seamlessly with Sales metrics to balance load.

### 4.5 Support Ticketing
Tracks field/internal application issues.
*   **Operational Layer:** `SupportTicket`. Tickets track age, target resolution times, and assigned internal team members.
*   **Aggregated Metrics:** `SupportMetrics` dynamically summarizes pending backlogs, resolution speeds, and identifies critical blockers.

### 4.6 HR Metrics & Team Management
Pipeline for organization strength.
*   **Entities:** `HrMetrics`. Tracks funnel from Candidate Application -> Screening -> Interview -> Offer -> Hired.
*   **`HierarchyNode`**: Models the internal reporting structure (Tree representation) for visual rendering and contextual approvals context.

---

## 5. Active Communication & Workflows

### 5.1 Task Delegation
*   **`Task` Model**: Permits assignment between `assignedById` to `assignedToId`. Includes Priorities, Due Dates, and Project associations.
*   **`TaskComment`**: Historical chronologial activity feed tied to specific tasks allowing team chat within contexts.

### 5.2 Enterprise Messaging
*   **`Message` Model**: Native peer-to-peer enterprise chat storing textual exchanges with tracking for read-receipts.

### 5.3 Audit Trail
*   **`AuditLog`**: Highly secure automated tracking system triggered via API endpoints tracking `LOGIN_SUCCESS`, `LOGIN_FAILED`, CRUD actions on master tables, providing immutable JSON accountability per User/IP.

---

## 6. Secure AI Vault Module

**Purpose:** Allows organizations to upload opaque enterprise PDFs and query them conversationally using Large Language Models without destroying token limits.

### 6.1 Architectural Flow
1.  **Ingestion:** Uploaded files stored inside Postgres as Base64/Secure BLOB strings mapped to a `VaultDocument` row and a specific `Company`.
2.  **Conversion:** Uses Node's native `pdf-parse@1.1.1` binary (marked precisely as a `serverExternalPackage` to skip Webpack compilation corruption) to natively extract raw strings.
3.  **Context Window Protection:** Implements truncation limiters (~`24,000` text characters max) to ensure context windows fit snugly within the LLaMA `8192` token frame size.
4.  **AI Invocation:** Submits the context string combined with the user's explicit query to `Groq` API inside a single bounded "User Role" payload to avoid role-oscillation rejection.
5.  **Output:** Streams intelligence responses back to the local UI.

---

## 7. Operational & DevOps Specifications

*   **Next.js Server Externalization:** Specific Native Binaries (`bcrypt`, `@prisma/client`, and `pdf-parse`) MUST explicitly be listed in `next.config.ts` under `serverExternalPackages`. Next.js web-bundlers will inherently crash if attempting to process C++ abstractions.
*   **Prisma Client Regeneration:** If node modules change across physical host operating systems (e.g., migrating from Mac Development to Windows Deployment), `npx prisma generate` **must** proactively be executed on the host node to remap PostgreSQL binary engine requirements.
*   **Process Hosting:** The compiled `.next` package is run synchronously via `PM2` wrapped using an `ecosystem.config.js` to explicitly enforce `PORT` declarations, Memory Limits, and Environment Production boundaries.
