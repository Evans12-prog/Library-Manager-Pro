import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(__dirname, "../../smartlib-pro-guide.pdf");

const doc = new PDFDocument({ size: "A4", margin: 50, info: { Title: "SmartLib Pro – System Guide", Author: "SmartLib Pro" } });
doc.pipe(fs.createWriteStream(outPath));

// ─── Colours & helpers ───────────────────────────────────────────────────────
const NAVY   = "#0F172A";
const BLUE   = "#1D4ED8";
const TEAL   = "#0D9488";
const GRAY   = "#64748B";
const LGRAY  = "#F1F5F9";
const WHITE  = "#FFFFFF";
const RED    = "#DC2626";
const GREEN  = "#16A34A";
const ORANGE = "#D97706";

const PW = doc.page.width  - 100; // printable width
const PH = doc.page.height - 100; // printable height

function heading1(text) {
  doc.moveDown(0.5)
     .font("Helvetica-Bold").fontSize(22).fillColor(NAVY)
     .text(text)
     .moveDown(0.3);
}

function heading2(text) {
  doc.moveDown(0.6)
     .font("Helvetica-Bold").fontSize(14).fillColor(BLUE)
     .text(text)
     .moveDown(0.2);
}

function heading3(text) {
  doc.moveDown(0.4)
     .font("Helvetica-Bold").fontSize(11).fillColor(NAVY)
     .text(text)
     .moveDown(0.15);
}

function body(text, opts = {}) {
  doc.font("Helvetica").fontSize(10).fillColor(NAVY)
     .text(text, { lineGap: 3, ...opts });
}

function bullet(items, indent = 20) {
  items.forEach(item => {
    doc.font("Helvetica").fontSize(10).fillColor(NAVY)
       .text(`•  ${item}`, { indent, lineGap: 3 });
  });
  doc.moveDown(0.3);
}

function tag(label, color, x, y) {
  const tw = doc.widthOfString(label, { fontSize: 9 }) + 14;
  doc.roundedRect(x, y, tw, 16, 4).fill(color + "22");
  doc.font("Helvetica-Bold").fontSize(9).fillColor(color)
     .text(label, x + 7, y + 3.5, { lineBreak: false });
  return tw + 6;
}

function divider() {
  doc.moveDown(0.4);
  doc.moveTo(50, doc.y).lineTo(50 + PW, doc.y).strokeColor("#E2E8F0").lineWidth(1).stroke();
  doc.moveDown(0.4);
}

function infoBox(title, content, color = BLUE) {
  const startY = doc.y;
  doc.roundedRect(50, startY, PW, 0, 6).stroke("transparent"); // placeholder
  doc.rect(50, startY, 4, 999).fill(color); // will trim after text
  const textX = 62;
  const textW = PW - 18;
  doc.font("Helvetica-Bold").fontSize(10).fillColor(color)
     .text(title, textX, startY + 6, { width: textW });
  doc.font("Helvetica").fontSize(10).fillColor(NAVY)
     .text(content, textX, doc.y + 2, { width: textW, lineGap: 3 });
  const endY = doc.y + 8;
  const boxH = endY - startY;
  doc.rect(50, startY, PW, boxH).fillOpacity(0.04).fill(color);
  doc.fillOpacity(1);
  doc.rect(50, startY, 4, boxH).fillOpacity(1).fill(color);
  doc.fillOpacity(1);
  doc.y = endY;
  doc.moveDown(0.5);
}

// ─── Table helper ────────────────────────────────────────────────────────────
function table(headers, rows, colWidths) {
  const rowH = 22;
  const startX = 50;
  let y = doc.y;

  // Header row
  doc.rect(startX, y, PW, rowH).fill(NAVY);
  let x = startX;
  headers.forEach((h, i) => {
    doc.font("Helvetica-Bold").fontSize(9).fillColor(WHITE)
       .text(h, x + 6, y + 7, { width: colWidths[i] - 8, lineBreak: false });
    x += colWidths[i];
  });
  y += rowH;

  // Data rows
  rows.forEach((row, ri) => {
    if (y + rowH > PH + 50) { doc.addPage(); y = 50; }
    doc.rect(startX, y, PW, rowH).fill(ri % 2 === 0 ? WHITE : LGRAY);
    doc.rect(startX, y, PW, rowH).strokeColor("#E2E8F0").lineWidth(0.5).stroke();
    x = startX;
    row.forEach((cell, ci) => {
      doc.font("Helvetica").fontSize(9).fillColor(NAVY)
         .text(String(cell), x + 6, y + 7, { width: colWidths[ci] - 10, lineBreak: false });
      x += colWidths[ci];
    });
    y += rowH;
  });
  doc.y = y + 6;
  doc.moveDown(0.5);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  COVER PAGE
// ═══════════════════════════════════════════════════════════════════════════════
doc.rect(0, 0, doc.page.width, doc.page.height).fill(NAVY);

// Decorative top stripe
doc.rect(0, 0, doc.page.width, 8).fill(BLUE);

// Icon-like book symbol
doc.roundedRect(220, 140, 160, 160, 20).fill(BLUE);
doc.font("Helvetica-Bold").fontSize(80).fillColor(WHITE)
   .text("📚", 220, 160, { width: 160, align: "center", lineBreak: false });

doc.font("Helvetica-Bold").fontSize(38).fillColor(WHITE)
   .text("SmartLib Pro", 0, 330, { width: doc.page.width, align: "center" });

doc.font("Helvetica").fontSize(16).fillColor("#94A3B8")
   .text("Automated Library Management System", 0, 382, { width: doc.page.width, align: "center" });

doc.moveDown(3);
doc.font("Helvetica").fontSize(11).fillColor("#64748B")
   .text("System Guide & Technical Reference", 0, 440, { width: doc.page.width, align: "center" });

doc.font("Helvetica").fontSize(10).fillColor("#475569")
   .text("Version 1.0  ·  July 2026", 0, 465, { width: doc.page.width, align: "center" });

// Bottom bar
doc.rect(0, doc.page.height - 50, doc.page.width, 50).fill("#0F172A");
doc.rect(0, doc.page.height - 52, doc.page.width, 2).fill(BLUE);
doc.font("Helvetica").fontSize(9).fillColor("#475569")
   .text("For internal use · University / School / Public Library Edition", 0, doc.page.height - 34, { width: doc.page.width, align: "center" });

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE 2 – TABLE OF CONTENTS
// ═══════════════════════════════════════════════════════════════════════════════
doc.addPage();

// Header bar
doc.rect(50, 40, PW, 36).fill(NAVY);
doc.font("Helvetica-Bold").fontSize(16).fillColor(WHITE)
   .text("Table of Contents", 62, 51);

doc.moveDown(1.5);

const toc = [
  ["1", "System Overview",               "3"],
  ["2", "Architecture & Tech Stack",      "4"],
  ["3", "Database Schema",               "5"],
  ["4", "API Endpoints Reference",        "6"],
  ["5", "User Roles & Permissions",       "7"],
  ["6", "Feature Walkthrough",            "8"],
  ["7", "Authentication Flow",            "11"],
  ["8", "Demo Accounts & Quick Start",    "12"],
  ["9", "Deployment & Configuration",     "13"],
];

toc.forEach(([num, title, pg]) => {
  const y = doc.y;
  doc.font("Helvetica-Bold").fontSize(11).fillColor(BLUE)
     .text(num + ".", 50, y, { continued: false, lineBreak: false, width: 20 });
  doc.font("Helvetica").fontSize(11).fillColor(NAVY)
     .text(title, 72, y, { lineBreak: false });
  doc.font("Helvetica").fontSize(11).fillColor(GRAY)
     .text(pg, 0, y, { align: "right", lineBreak: false });

  // dotted line
  const textEnd = 72 + doc.widthOfString(title, { fontSize: 11 }) + 8;
  const lineEnd = PW + 50 - doc.widthOfString(pg, { fontSize: 11 }) - 8;
  let dx = textEnd;
  while (dx < lineEnd) {
    doc.circle(dx, y + 8, 1).fill("#CBD5E1");
    dx += 8;
  }
  doc.moveDown(0.7);
});

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE 3 – SYSTEM OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════
doc.addPage();
doc.rect(50, 40, PW, 36).fill(NAVY);
doc.font("Helvetica-Bold").fontSize(16).fillColor(WHITE).text("1.  System Overview", 62, 51);
doc.y = 92;

body("SmartLib Pro is a full-stack automated library management system built for universities, schools, and public libraries. It replaces manual record-keeping with a real-time web application that handles every aspect of library operations — from book cataloguing to fine collection — through a clean, role-aware interface.");

doc.moveDown(0.6);
heading2("What the System Provides");
bullet([
  "Centralised catalogue of books with author, category, publisher, and availability data",
  "Member management with role-based access (Admin · Librarian · Student)",
  "Full borrowing lifecycle: issue, return, renew, and automatic overdue detection",
  "Hold / reservation queue for unavailable books",
  "Automatic fine calculation for overdue items with a pay-off workflow",
  "Per-user notification feed (overdue alerts, due reminders, reservation ready, etc.)",
  "Admin analytics dashboard: live stats, borrowing trends, category distribution",
  "Immutable activity log for compliance and audit purposes",
  "System setup screens to manage authors, categories, and publishers",
]);

divider();
heading2("High-Level System Diagram");

// Simple architecture box diagram
const bx = 50, by = doc.y;
const bw = PW / 3 - 8;
const bh = 54;

const boxes = [
  { label: "Browser", sub: "React + Vite\nTailwind CSS v4\nTanStack Query", color: TEAL },
  { label: "API Server", sub: "Express 5\nNode.js 24\nCookie Sessions", color: BLUE },
  { label: "Database", sub: "PostgreSQL\nDrizzle ORM\n10 Tables", color: NAVY },
];
boxes.forEach((b, i) => {
  const bxOff = bx + i * (bw + 12);
  doc.roundedRect(bxOff, by, bw, bh, 8).fill(b.color);
  doc.font("Helvetica-Bold").fontSize(12).fillColor(WHITE)
     .text(b.label, bxOff, by + 9, { width: bw, align: "center" });
  doc.font("Helvetica").fontSize(8).fillColor(WHITE + "CC")
     .text(b.sub, bxOff, by + 26, { width: bw, align: "center" });

  // Arrow between boxes
  if (i < 2) {
    const ax = bxOff + bw + 2;
    const ay = by + bh / 2;
    doc.moveTo(ax, ay).lineTo(ax + 8, ay).strokeColor(GRAY).lineWidth(1.5).stroke();
    doc.moveTo(ax + 8, ay - 4).lineTo(ax + 12, ay).lineTo(ax + 8, ay + 4).fill(GRAY);
  }
});

doc.y = by + bh + 14;

// Shared proxy annotation
doc.font("Helvetica").fontSize(9).fillColor(GRAY)
   .text("All traffic is routed through a shared reverse proxy — the browser never contacts service ports directly.", { align: "center" });

doc.moveDown(0.8);
divider();
heading2("Key Design Choices");
bullet([
  "Contract-first API: OpenAPI spec → Orval generates typed React Query hooks + Zod validators",
  "Cookie-based sessions (httpOnly) — no JWT tokens exposed to JavaScript",
  "Monorepo (pnpm workspaces) with shared lib packages for DB schema, API spec, and generated clients",
  "Role enforcement at both route level (Express middleware) and UI level (React protected routes)",
]);

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE 4 – ARCHITECTURE & TECH STACK
// ═══════════════════════════════════════════════════════════════════════════════
doc.addPage();
doc.rect(50, 40, PW, 36).fill(NAVY);
doc.font("Helvetica-Bold").fontSize(16).fillColor(WHITE).text("2.  Architecture & Tech Stack", 62, 51);
doc.y = 92;

heading2("Monorepo Structure");
body("The project uses pnpm workspaces with a clear separation of concerns:");

// Directory tree
doc.font("Courier").fontSize(9).fillColor(NAVY);
const tree = [
  "artifacts-monorepo/",
  "├── artifacts/",
  "│   ├── api-server/          Express 5 backend (port 8080 → proxied at /api)",
  "│   └── smartlib-pro/        React + Vite frontend (port 23393 → proxied at /)",
  "├── lib/",
  "│   ├── api-spec/            openapi.yaml  +  Orval codegen config",
  "│   ├── api-client-react/    Generated React Query hooks + custom fetch",
  "│   ├── api-zod/             Generated Zod request/response validators",
  "│   └── db/                  Drizzle ORM schema + migration config",
  "├── scripts/                 Utility scripts (e.g. PDF generation)",
  "├── pnpm-workspace.yaml",
  "└── tsconfig.base.json",
];
tree.forEach(line => doc.text(line, { lineGap: 2 }));
doc.font("Helvetica").fontSize(10);

doc.moveDown(0.5);
divider();
heading2("Technology Stack");

table(
  ["Layer", "Technology", "Purpose"],
  [
    ["Frontend",    "React 18 + Vite 7",          "Component rendering, HMR dev server"],
    ["UI Library",  "shadcn/ui + Tailwind v4",    "Pre-built accessible components + utility CSS"],
    ["Routing",     "Wouter",                     "Lightweight client-side routing"],
    ["Data Fetching","TanStack Query v5",          "Server state, caching, background refetch"],
    ["API Client",  "Orval (generated)",           "Typed hooks from OpenAPI spec"],
    ["Backend",     "Express 5 + Node.js 24",      "REST API server"],
    ["Database",    "PostgreSQL + Drizzle ORM",    "Relational data, type-safe queries"],
    ["Validation",  "Zod v4 (generated)",          "Runtime request/response validation"],
    ["Auth",        "PBKDF2 + httpOnly cookie",    "Secure password hashing, session cookies"],
    ["Build",       "esbuild (CJS bundle)",        "Fast backend bundling"],
    ["Typecheck",   "TypeScript 5.9 strict",       "End-to-end type safety"],
  ],
  [90, 170, PW - 260]
);

divider();
heading2("Codegen Workflow");
body("When the API contract changes, a single command regenerates all client code:");
doc.moveDown(0.2);
doc.roundedRect(50, doc.y, PW, 28, 6).fill(LGRAY);
doc.font("Courier").fontSize(10).fillColor(BLUE)
   .text("pnpm --filter @workspace/api-spec run codegen", 60, doc.y + 9);
doc.font("Helvetica").fontSize(10).fillColor(NAVY);
doc.moveDown(1.5);
bullet([
  "Reads lib/api-spec/openapi.yaml",
  "Writes typed React Query hooks to lib/api-client-react/src/generated/",
  "Writes Zod schemas to lib/api-zod/src/generated/",
  "Run pnpm run typecheck:libs after to rebuild declaration files",
]);

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE 5 – DATABASE SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════
doc.addPage();
doc.rect(50, 40, PW, 36).fill(NAVY);
doc.font("Helvetica-Bold").fontSize(16).fillColor(WHITE).text("3.  Database Schema", 62, 51);
doc.y = 92;

body("All tables live in the default PostgreSQL schema. Drizzle ORM provides type-safe queries. Run pnpm --filter @workspace/db run push to sync schema changes to the database.");
doc.moveDown(0.4);

const tables = [
  {
    name: "users",
    desc: "Stores all system users — admins, librarians, and students.",
    cols: [
      ["id", "serial PK", "Auto-incrementing primary key"],
      ["email", "text UNIQUE", "Login identifier"],
      ["password_hash", "text", "PBKDF2 hash (salt:hash format)"],
      ["name", "text", "Display name"],
      ["role", "enum", "admin | librarian | student"],
      ["phone / student_id", "text?", "Optional contact / institutional ID"],
      ["is_active", "boolean", "Soft-disable accounts without deletion"],
      ["created_at", "timestamp", "Account creation time"],
    ],
  },
  {
    name: "books",
    desc: "Core inventory. Each row is a title; copies count tracked in place.",
    cols: [
      ["id", "serial PK", ""],
      ["title / isbn", "text", "Book identity"],
      ["author_id / category_id / publisher_id", "FK", "Relations to lookup tables"],
      ["total_copies / available_copies", "integer", "Inventory counters"],
      ["shelf_location", "text?", "Physical location code (e.g. A-01)"],
      ["published_year / language / description", "various", "Metadata fields"],
    ],
  },
  {
    name: "borrow_records",
    desc: "Tracks every loan. Status transitions: active → returned | overdue.",
    cols: [
      ["id", "serial PK", ""],
      ["user_id / book_id", "FK", "Who borrowed which book"],
      ["borrowed_at / due_date / returned_at", "timestamp", "Lifecycle dates"],
      ["status", "enum", "active | overdue | returned"],
      ["renew_count", "integer", "Max 2 renewals per loan"],
    ],
  },
  {
    name: "reservations",
    desc: "Queue for unavailable books.",
    cols: [
      ["status", "enum", "pending | fulfilled | cancelled | expired"],
      ["expires_at", "timestamp?", "Auto-expiry date for pending holds"],
    ],
  },
  {
    name: "fines",
    desc: "One row per overdue loan. Amount in USD.",
    cols: [
      ["amount", "numeric", "Calculated at issue time ($0.50/day default)"],
      ["status", "enum", "unpaid | paid"],
      ["paid_at", "timestamp?", "Set when librarian marks paid"],
    ],
  },
  {
    name: "notifications",
    desc: "Per-user notification feed.",
    cols: [
      ["type", "enum", "overdue_alert | fine_issued | reservation_ready | due_reminder | general"],
      ["is_read", "boolean", "Dismissed via UI"],
    ],
  },
  {
    name: "activity_logs",
    desc: "Immutable audit trail. Never deleted.",
    cols: [
      ["action", "text", "e.g. book_borrowed, user_created, fine_paid"],
      ["entity_type / entity_id", "text / int", "What was acted upon"],
      ["details", "text?", "Human-readable description"],
    ],
  },
];

tables.forEach(t => {
  if (doc.y > PH - 80) doc.addPage();
  heading3(`${t.name}`);
  body(t.desc);
  t.cols.forEach(([col, type, note]) => {
    doc.font("Courier").fontSize(9).fillColor(TEAL)
       .text(col.padEnd(38) , 60, doc.y, { continued: true, lineBreak: false, width: 190 });
    doc.font("Courier").fontSize(9).fillColor(BLUE)
       .text(type.padEnd(22), { continued: true, lineBreak: false, width: 110 });
    doc.font("Helvetica").fontSize(9).fillColor(GRAY)
       .text(note, { lineBreak: false });
    doc.moveDown(0.2);
  });
  doc.moveDown(0.3);
});

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE 6 – API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════
doc.addPage();
doc.rect(50, 40, PW, 36).fill(NAVY);
doc.font("Helvetica-Bold").fontSize(16).fillColor(WHITE).text("4.  API Endpoints Reference", 62, 51);
doc.y = 92;

body("All endpoints are prefixed with /api. The base URL in development is http://localhost:80/api (via the shared proxy). Authentication is enforced on every endpoint except POST /auth/login.");

doc.moveDown(0.4);

const groups = [
  {
    name: "Authentication", color: TEAL,
    routes: [
      ["POST", "/auth/login",  "Public", "Login with email + password. Sets session cookie."],
      ["POST", "/auth/logout", "Any",    "Destroys session. Clears cookie."],
      ["GET",  "/auth/me",     "Any",    "Returns current user profile."],
    ],
  },
  {
    name: "Books", color: BLUE,
    routes: [
      ["GET",    "/books",      "Any",             "List books with search, category, pagination"],
      ["POST",   "/books",      "Admin/Librarian", "Create a new book record"],
      ["GET",    "/books/:id",  "Any",             "Get a single book by ID"],
      ["PUT",    "/books/:id",  "Admin/Librarian", "Update book details"],
      ["DELETE", "/books/:id",  "Admin",           "Remove book from catalogue"],
    ],
  },
  {
    name: "Catalog (Authors / Categories / Publishers)", color: NAVY,
    routes: [
      ["GET/POST",        "/authors",       "Mixed", "List or create authors"],
      ["PUT/DELETE",      "/authors/:id",   "Admin/Librarian", "Update or delete"],
      ["GET/POST",        "/categories",    "Mixed", "List or create categories"],
      ["GET/POST",        "/publishers",    "Mixed", "List or create publishers"],
    ],
  },
  {
    name: "Users", color: "#7C3AED",
    routes: [
      ["GET",    "/users",           "Admin",    "List all members with search + role filter"],
      ["POST",   "/users",           "Admin",    "Create a new member account"],
      ["GET",    "/users/:id",       "Admin",    "Get member profile"],
      ["PUT",    "/users/:id",       "Admin",    "Update member details"],
      ["DELETE", "/users/:id",       "Admin",    "Deactivate member"],
      ["GET",    "/users/:id/borrows","Admin",   "Member's full borrow history"],
    ],
  },
  {
    name: "Borrowing", color: ORANGE,
    routes: [
      ["GET",  "/borrow",            "Any",             "List borrow records (filter by status)"],
      ["POST", "/borrow",            "Admin/Librarian", "Issue a book to a member"],
      ["POST", "/borrow/:id/return", "Admin/Librarian", "Record a return. Decrements fine if overdue."],
      ["POST", "/borrow/:id/renew",  "Any",             "Extend due date by 14 days (max 2 renewals)"],
    ],
  },
  {
    name: "Reservations", color: TEAL,
    routes: [
      ["GET",    "/reservations",          "Any",             "List reservations"],
      ["POST",   "/reservations",          "Any",             "Create a hold request"],
      ["DELETE", "/reservations/:id",      "Admin/Librarian", "Cancel a reservation"],
    ],
  },
  {
    name: "Fines", color: RED,
    routes: [
      ["GET",  "/fines",          "Any",             "List fines (filter by status)"],
      ["POST", "/fines/:id/pay",  "Admin/Librarian", "Mark a fine as paid"],
    ],
  },
  {
    name: "Notifications", color: ORANGE,
    routes: [
      ["GET",  "/notifications",           "Any", "List notifications for current user"],
      ["POST", "/notifications/:id/read",  "Any", "Mark a notification as read"],
      ["POST", "/notifications/read-all",  "Any", "Mark all notifications read"],
    ],
  },
  {
    name: "Dashboard & Analytics", color: BLUE,
    routes: [
      ["GET", "/dashboard/stats",          "Any", "Counts: totalBooks, totalUsers, activeBorrows, overdueBooks, totalFines"],
      ["GET", "/dashboard/overdue",        "Any", "List overdue loans"],
      ["GET", "/dashboard/popular-books",  "Any", "Top borrowed books"],
      ["GET", "/dashboard/recent-activity","Any", "Latest activity log entries"],
      ["GET", "/dashboard/borrow-trend",   "Any", "Daily borrow counts for last 7 days"],
      ["GET", "/dashboard/category-dist",  "Any", "Category distribution for charts"],
    ],
  },
  {
    name: "Activity Log", color: GRAY,
    routes: [
      ["GET", "/activity", "Admin", "Full paginated audit log"],
    ],
  },
];

const methodColors = { GET: GREEN, POST: BLUE, PUT: ORANGE, DELETE: RED, "GET/POST": TEAL, "PUT/DELETE": ORANGE, "DELETE": RED };

groups.forEach(g => {
  if (doc.y > PH - 60) doc.addPage();
  doc.moveDown(0.3);
  doc.roundedRect(50, doc.y, PW, 18, 4).fill(g.color + "18");
  doc.font("Helvetica-Bold").fontSize(10).fillColor(g.color)
     .text(g.name, 58, doc.y + 4);
  doc.moveDown(0.85);

  g.routes.forEach(([method, path, role, desc]) => {
    if (doc.y > PH - 20) doc.addPage();
    const y = doc.y;
    const mc = methodColors[method] ?? GRAY;
    const mw = 52;
    doc.roundedRect(50, y, mw, 16, 3).fill(mc + "22");
    doc.font("Helvetica-Bold").fontSize(8).fillColor(mc)
       .text(method, 50, y + 4, { width: mw, align: "center", lineBreak: false });
    doc.font("Courier").fontSize(9).fillColor(NAVY)
       .text(path, 108, y + 4, { lineBreak: false, width: 170 });
    doc.font("Helvetica").fontSize(8).fillColor(GRAY)
       .text(`[${role}]`, 282, y + 4, { lineBreak: false, width: 90 });
    doc.font("Helvetica").fontSize(9).fillColor(NAVY)
       .text(desc, 376, y + 4, { lineBreak: false, width: PW - 326 });
    doc.moveDown(0.75);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE 7 – ROLES & PERMISSIONS
// ═══════════════════════════════════════════════════════════════════════════════
doc.addPage();
doc.rect(50, 40, PW, 36).fill(NAVY);
doc.font("Helvetica-Bold").fontSize(16).fillColor(WHITE).text("5.  User Roles & Permissions", 62, 51);
doc.y = 92;

body("SmartLib Pro enforces role-based access at two layers: the Express API (route middleware) and the React UI (ProtectedRoute component + sidebar filtering). There are three roles:");

doc.moveDown(0.6);

const roles = [
  {
    role: "Admin", color: "#7C3AED", icon: "A",
    can: [
      "Everything a Librarian can do",
      "Create, edit, and deactivate any user account",
      "Delete books from the catalogue",
      "View the full activity audit log",
      "Access all system setup screens (authors, categories, publishers)",
    ],
    cannot: [],
  },
  {
    role: "Librarian", color: BLUE, icon: "L",
    can: [
      "Add and edit books (not delete)",
      "Issue and process returns/renewals for any member",
      "Mark fines as paid",
      "Cancel reservations",
      "Manage authors, categories, and publishers",
      "View all borrowing records, reservations, and fines",
    ],
    cannot: ["Create/edit/delete users", "View activity log"],
  },
  {
    role: "Student", color: TEAL, icon: "S",
    can: [
      "Browse the books catalogue (read-only)",
      "View their own borrowing history",
      "View their own reservations",
      "View their own fines",
      "View their own notifications",
    ],
    cannot: ["Manage any records", "View other members' data", "Access admin/setup pages"],
  },
];

roles.forEach(r => {
  const startY = doc.y;
  doc.roundedRect(50, startY, PW, 0, 8).stroke("transparent");

  // Coloured left bar and role badge
  doc.roundedRect(50, startY, PW, 108, 8).fill(r.color + "0A");
  doc.rect(50, startY, 4, 108).fill(r.color);
  doc.circle(72, startY + 18, 14).fill(r.color);
  doc.font("Helvetica-Bold").fontSize(14).fillColor(WHITE)
     .text(r.icon, 66, startY + 10, { lineBreak: false });
  doc.font("Helvetica-Bold").fontSize(14).fillColor(r.color)
     .text(r.role, 92, startY + 10, { lineBreak: false });

  let ty = startY + 32;
  doc.font("Helvetica-Bold").fontSize(9).fillColor(GREEN)
     .text("✓  Can:", 64, ty);
  ty += 14;
  r.can.forEach(item => {
    doc.font("Helvetica").fontSize(9).fillColor(NAVY)
       .text(`    ${item}`, 64, ty, { width: (PW / 2) - 20, lineBreak: false });
    ty += 13;
  });

  if (r.cannot.length > 0) {
    let ty2 = startY + 32;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(RED)
       .text("✗  Cannot:", 50 + PW / 2 + 10, ty2);
    ty2 += 14;
    r.cannot.forEach(item => {
      doc.font("Helvetica").fontSize(9).fillColor(GRAY)
         .text(`    ${item}`, 50 + PW / 2 + 10, ty2, { width: PW / 2 - 20, lineBreak: false });
      ty2 += 13;
    });
  }

  doc.y = startY + 112;
  doc.moveDown(0.3);
});

divider();
heading2("Permission Matrix");
table(
  ["Feature", "Admin", "Librarian", "Student"],
  [
    ["View book catalogue",          "✓", "✓", "✓"],
    ["Add / edit books",             "✓", "✓", "✗"],
    ["Delete books",                 "✓", "✗", "✗"],
    ["Issue / return / renew loans", "✓", "✓", "✗"],
    ["View all borrow records",      "✓", "✓", "Own only"],
    ["Create / edit users",          "✓", "✗", "✗"],
    ["Manage fines (mark paid)",     "✓", "✓", "View own"],
    ["Cancel reservations",          "✓", "✓", "Own only"],
    ["System setup (authors etc.)",  "✓", "✓", "✗"],
    ["Activity log",                 "✓", "✗", "✗"],
    ["Notifications",                "✓", "✓", "Own only"],
  ],
  [190, 90, 90, 90]
);

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE 8-10 – FEATURE WALKTHROUGH
// ═══════════════════════════════════════════════════════════════════════════════
doc.addPage();
doc.rect(50, 40, PW, 36).fill(NAVY);
doc.font("Helvetica-Bold").fontSize(16).fillColor(WHITE).text("6.  Feature Walkthrough", 62, 51);
doc.y = 92;

const features = [
  {
    title: "Login Page",
    color: NAVY,
    desc: "The entry point for all users. A bookshelf background image provides visual context. The form accepts email and password. On success, the user object is stored in localStorage and the session cookie is set by the API.",
    bullets: [
      "Validates non-empty fields before calling the API",
      "Shows a toast notification on login failure with the error message",
      "Automatically redirects to the Dashboard after login",
      "Redirects to /login if a protected route is accessed while unauthenticated",
    ],
  },
  {
    title: "Dashboard",
    color: BLUE,
    desc: "Gives at-a-glance visibility into library health. Stat cards pull live data from GET /api/dashboard/stats, with skeleton loaders shown during fetch.",
    bullets: [
      "Stat cards: Total Books, Active Members, Active Borrows, Overdue Books",
      "Borrowing Trends area chart (live data from /dashboard/borrow-trend)",
      "Category Distribution pie chart (live from /dashboard/category-dist)",
      "Overdue Books count badge highlights red when > 0",
    ],
  },
  {
    title: "Books Catalog",
    color: TEAL,
    desc: "Full searchable inventory table. All roles can view; only Admin/Librarian see the Add New Book button.",
    bullets: [
      "Live search by title, author, or ISBN (debounced via React Query)",
      "Availability badge shows X / Y copies remaining, turns red when 0",
      "Category badge styled with the category's custom colour",
      "Add New Book button opens a form for Admin/Librarian",
    ],
  },
  {
    title: "Borrowing Records",
    color: ORANGE,
    desc: "Central hub for all loan management. Colour-coded status badges make the state of each loan immediately clear.",
    bullets: [
      "Tab filters: All | Active | Overdue | Returned",
      "Due date column shows 'X days left', 'Due today', or 'X days overdue' in red",
      "Return button: records return, updates available_copies, creates activity log entry",
      "Renew button: extends due_date by 14 days; disabled after 2 renewals or if overdue",
      "Students can only view their own records",
    ],
  },
  {
    title: "Reservations",
    color: TEAL,
    desc: "Manages book hold requests. When a reserved book becomes available, the librarian can fulfil the hold.",
    bullets: [
      "Filter by status: All | Pending | Fulfilled | Cancelled",
      "Client-side search filters by book title or member name",
      "Cancel button visible to Admin/Librarian for pending reservations",
      "Expiry date shown — reservations auto-expire if unclaimed",
    ],
  },
  {
    title: "Fines Management",
    color: RED,
    desc: "Tracks financial obligations for overdue books. Summary cards give a financial overview at a glance.",
    bullets: [
      "Summary cards: Outstanding Fines total, Collected total, Total issued",
      "Filter by status: All | Unpaid | Paid",
      "Mark Paid button for Admin/Librarian records the payment timestamp",
      "Amount displayed in USD with two decimal places",
    ],
  },
  {
    title: "Notifications",
    color: ORANGE,
    desc: "Per-user alert feed. Unread notifications are highlighted with a blue tint and a dot indicator.",
    bullets: [
      "Types: Overdue Alert, Fine Issued, Reservation Ready, Due Reminder, General",
      "Dismiss button marks a single notification read",
      "Mark All Read button batch-dismisses all with a single API call",
      "Unread count shown in the page subtitle",
    ],
  },
  {
    title: "Members (Admin only)",
    color: "#7C3AED",
    desc: "User management table. Only admins can access this page — Librarians and Students are redirected.",
    bullets: [
      "Search by name or email",
      "Role badge colour-coded: Admin (purple), Librarian (blue), Student (grey)",
      "Add Member dialog collects name, email, password, role, phone, student ID",
      "Active/Inactive status badge for account state",
    ],
  },
  {
    title: "Activity Log (Admin only)",
    color: GRAY,
    desc: "Immutable chronological feed of all system events for compliance and auditing.",
    bullets: [
      "Shows actor name, action type badge, entity type badge, and description",
      "Colour-coded action icons: blue (borrow), green (return), yellow (renew), purple (user ops)",
      "Paginated — 100 records per page by default",
    ],
  },
  {
    title: "System Setup (Admin / Librarian)",
    color: BLUE,
    desc: "Three-tab screen for managing the reference data used throughout the system.",
    bullets: [
      "Authors tab: grid of author cards with name/bio, Add Author dialog",
      "Categories tab: colour pill badges, Add Category dialog with colour picker",
      "Publishers tab: grid with name/website, Add Publisher dialog",
    ],
  },
];

features.forEach(f => {
  if (doc.y > PH - 100) doc.addPage();
  const sy = doc.y;
  doc.roundedRect(50, sy, PW, 20, 0).fill(f.color + "18");
  doc.rect(50, sy, 4, 20).fill(f.color);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(f.color)
     .text(f.title, 60, sy + 5);
  doc.y = sy + 22;
  body(f.desc);
  bullet(f.bullets);
  doc.moveDown(0.2);
});

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE 11 – AUTHENTICATION FLOW
// ═══════════════════════════════════════════════════════════════════════════════
doc.addPage();
doc.rect(50, 40, PW, 36).fill(NAVY);
doc.font("Helvetica-Bold").fontSize(16).fillColor(WHITE).text("7.  Authentication Flow", 62, 51);
doc.y = 92;

heading2("Login Sequence");
const steps = [
  ["1", "User submits email + password via the Login page form"],
  ["2", "React calls POST /api/auth/login via the generated useLogin() mutation hook"],
  ["3", "Express looks up the user by email in the users table"],
  ["4", "PBKDF2 verification: extracts stored salt, re-hashes the submitted password, compares"],
  ["5", "On match: generates a 64-char random session token, stores userId → token in the in-memory Map"],
  ["6", "Sets an httpOnly cookie named session_token (7-day max age) on the response"],
  ["7", "Returns the user object (id, email, name, role) — NO password fields ever returned"],
  ["8", "Frontend stores user object in localStorage and AuthContext"],
  ["9", "Wouter router redirects to /"],
];
steps.forEach(([n, s]) => {
  const y = doc.y;
  doc.circle(62, y + 7, 9).fill(BLUE);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(WHITE)
     .text(n, 58, y + 3, { lineBreak: false });
  doc.font("Helvetica").fontSize(10).fillColor(NAVY)
     .text(s, 76, y, { width: PW - 30 });
  doc.moveDown(0.15);
});

doc.moveDown(0.4);
divider();
heading2("Subsequent Authenticated Requests");
body("After login, every API call made by the React frontend automatically includes the session cookie because the custom fetch wrapper sets credentials: \"include\" on all fetch requests. The shared reverse proxy routes /api/* calls to the Express backend, which reads the session_token cookie, looks up the user ID in the sessions Map, and attaches the user to the request for route handlers to use.");

doc.moveDown(0.5);
divider();
heading2("Logout");
body("POST /api/auth/logout deletes the token from the sessions Map and clears the cookie. The frontend removes the user from localStorage and AuthContext, then redirects to /login.");

doc.moveDown(0.5);
divider();
heading2("Session Persistence Note");
infoBox(
  "⚠  In-Memory Sessions",
  "Sessions are stored in a JavaScript Map inside the API server process. This means all sessions are lost when the server restarts. For production deployments requiring persistent sessions, replace the Map with a Redis store or a database-backed session table.",
  ORANGE
);

heading2("Password Hashing Detail");
body("SmartLib Pro uses Node.js's built-in crypto.pbkdf2Sync with the following parameters:");
table(
  ["Parameter", "Value"],
  [
    ["Algorithm", "PBKDF2-SHA512"],
    ["Iterations", "1000"],
    ["Key length", "64 bytes (128 hex chars)"],
    ["Salt", "16 random bytes per password (32 hex chars)"],
    ["Storage format", "salt:hash  (separated by colon)"],
  ],
  [140, PW - 140]
);

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE 12 – DEMO ACCOUNTS
// ═══════════════════════════════════════════════════════════════════════════════
doc.addPage();
doc.rect(50, 40, PW, 36).fill(NAVY);
doc.font("Helvetica-Bold").fontSize(16).fillColor(WHITE).text("8.  Demo Accounts & Quick Start", 62, 51);
doc.y = 92;

heading2("Seeded Demo Accounts");
table(
  ["Role", "Name", "Email", "Password"],
  [
    ["Admin",     "Dr. Sarah Mitchell",  "admin@smartlib.edu",          "admin123"],
    ["Librarian", "James Rodriguez",     "librarian@smartlib.edu",      "librarian123"],
    ["Student",   "Alice Chen",          "alice.chen@student.edu",      "student123"],
    ["Student",   "Bob Johnson",         "bob.johnson@student.edu",     "student123"],
    ["Student",   "Carol Smith",         "carol.smith@student.edu",     "student123"],
    ["Student",   "David Lee",           "david.lee@student.edu",       "student123"],
  ],
  [80, 120, 175, PW - 375]
);

divider();
heading2("Pre-loaded Seed Data");
bullet([
  "12 books across 8 categories (Fiction, Science, History, Technology, Mathematics, Literature, Biography, Philosophy)",
  "8 authors (Orwell, Rowling, Hawking, Harari, Sagan, Huxley, Gladwell, Feynman)",
  "5 publishers (Penguin Random House, HarperCollins, OUP, MIT Press, Cambridge)",
  "8 borrow records — 2 overdue, 4 active, 2 returned",
  "3 fines — 2 unpaid (Alice: $3.50 total), 1 paid (David: $8.00)",
  "4 reservations — 3 pending, 1 fulfilled",
  "6 notifications across different types",
  "8 activity log entries",
]);

divider();
heading2("Quick Start Steps");
const qs = [
  "Open the app in the preview pane (it loads the Login page).",
  "Enter admin@smartlib.edu and password admin123, then click Sign In.",
  "You are taken to the Dashboard — review the live stats cards and charts.",
  "Click Books Catalog in the sidebar to browse the 12 pre-loaded books.",
  "Click Borrowing in the sidebar to see the 8 borrow records. Notice the 2 overdue rows in red.",
  "Click Fines to see the outstanding $3.50 owed by Alice. Use Mark Paid to clear one.",
  "Click Notifications to see the 6 seeded alerts. Dismiss one or mark all read.",
  "Click Members (admin-only) to see the 6 user accounts. Add a new student account.",
  "Click Activity Log to see the full audit trail of seeded events.",
  "Log out, log back in as alice.chen@student.edu (password: student123). Notice the restricted sidebar.",
];
qs.forEach((s, i) => {
  const y = doc.y;
  doc.roundedRect(50, y, 22, 16, 4).fill(BLUE + "22");
  doc.font("Helvetica-Bold").fontSize(9).fillColor(BLUE)
     .text(String(i + 1), 50, y + 3, { width: 22, align: "center", lineBreak: false });
  doc.font("Helvetica").fontSize(10).fillColor(NAVY)
     .text(s, 78, y, { width: PW - 30 });
  doc.moveDown(0.25);
});

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE 13 – DEPLOYMENT & CONFIG
// ═══════════════════════════════════════════════════════════════════════════════
doc.addPage();
doc.rect(50, 40, PW, 36).fill(NAVY);
doc.font("Helvetica-Bold").fontSize(16).fillColor(WHITE).text("9.  Deployment & Configuration", 62, 51);
doc.y = 92;

heading2("Development Commands");
table(
  ["Command", "Purpose"],
  [
    ["pnpm --filter @workspace/api-server run dev", "Start API server (builds then runs on port 8080)"],
    ["pnpm --filter @workspace/smartlib-pro run dev", "Start React dev server (port 23393 with HMR)"],
    ["pnpm run typecheck", "Full end-to-end TypeScript check across all packages"],
    ["pnpm --filter @workspace/api-spec run codegen", "Regenerate API hooks + Zod schemas from OpenAPI"],
    ["pnpm --filter @workspace/db run push", "Push Drizzle schema to the database (dev only)"],
  ],
  [230, PW - 230]
);

divider();
heading2("Environment Variables");
table(
  ["Variable", "Required", "Description"],
  [
    ["DATABASE_URL", "Yes", "PostgreSQL connection string (Replit provides this automatically)"],
    ["SESSION_SECRET", "Yes", "Secret used for session signing (set in Replit Secrets)"],
    ["PORT", "Yes (auto)", "Service port — injected by the Replit workflow runner"],
    ["BASE_PATH", "Yes (auto)", "URL prefix for the frontend — injected by Replit artifact routing"],
  ],
  [120, 60, PW - 180]
);

divider();
heading2("Publishing to Production (Replit)");
bullet([
  "Click the Deploy button in the Replit workspace (or use the suggest_deploy tool).",
  "Replit builds and bundles both the API server and the React frontend.",
  "The app becomes available on a .replit.app subdomain over HTTPS.",
  "Production DATABASE_URL is automatically provisioned — separate from the dev database.",
  "To apply schema changes in production: run pnpm --filter @workspace/db run push with the production DATABASE_URL.",
]);

divider();
heading2("Scaling Considerations");
infoBox(
  "Session Storage",
  "The current in-memory session store works for a single server instance. For horizontal scaling or restarts, replace it with a Redis-backed or PostgreSQL-backed session store.",
  ORANGE
);
infoBox(
  "Fine Calculation",
  "Fines are currently created manually by librarians. To automate, add a scheduled job (e.g. node-cron) that queries overdue borrow records nightly and inserts fine rows.",
  BLUE
);
infoBox(
  "File Uploads",
  "Book cover images are currently stored as URLs (coverUrl field). To support actual file uploads, integrate Replit Object Storage or an external CDN.",
  TEAL
);

divider();
heading2("Project File Pointers");
table(
  ["File / Directory", "Purpose"],
  [
    ["lib/api-spec/openapi.yaml",               "Single source of truth for the API contract"],
    ["lib/db/src/schema/",                       "One file per Drizzle table definition"],
    ["artifacts/api-server/src/routes/",         "One Express router file per feature area"],
    ["artifacts/api-server/src/lib/auth.ts",     "PBKDF2 hash + verify + session token helpers"],
    ["artifacts/smartlib-pro/src/pages/",        "One React component file per page"],
    ["artifacts/smartlib-pro/src/hooks/use-auth.tsx", "Auth context, localStorage persistence"],
    ["artifacts/smartlib-pro/src/components/layout.tsx", "Sidebar + mobile nav + role-filtered menu"],
    ["lib/api-client-react/src/custom-fetch.ts", "Base fetch wrapper (credentials: include)"],
  ],
  [240, PW - 240]
);

// ─── Footer on every page ───────────────────────────────────────────────────
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  if (i === range.start) continue; // skip cover
  doc.moveTo(50, doc.page.height - 40)
     .lineTo(50 + PW, doc.page.height - 40)
     .strokeColor("#E2E8F0").lineWidth(0.5).stroke();
  doc.font("Helvetica").fontSize(8).fillColor(GRAY)
     .text("SmartLib Pro  ·  System Guide  ·  v1.0  ·  July 2026",
           50, doc.page.height - 32, { lineBreak: false });
  doc.font("Helvetica").fontSize(8).fillColor(GRAY)
     .text(`Page ${i}`, 50, doc.page.height - 32, { align: "right", lineBreak: false });
}

doc.end();
console.log("PDF written to:", outPath);
