# GARAGEFLOW

### **Smart Vehicle Service Management**

![GarageFlow System](https://img.shields.io/badge/GarageFlow-v1.0.0-0284c7?style=for-the-badge&logo=garageband)
![Stack](https://img.shields.io/badge/Tech--Stack-Node.js%20|%20Express%20|%20InsForge%20PostgreSQL%20|%20Bootstrap--5-0f172a?style=for-the-badge)
![QA Status](https://img.shields.io/badge/QA--Suite-62%20Passed-059669?style=for-the-badge)

**GarageFlow** is a full-stack, production-style **Vehicle Service Management System** designed for automotive workshops, multi-brand service stations, and dealership service centers. Built as a comprehensive internship project, GarageFlow integrates role-based web portals, real-time bay telemetry, service appointment state machines, inventory stock auto-deduction, itemized tax invoicing, and a complete 62-test-case QA suite.

---

## 🚀 Key Features

### 👤 Customer Portal
- **Account Registration & Security**: Register customer account, JWT authentication, bcrypt password hashing.
- **Vehicle Fleet Management**: Register, view, edit, and delete vehicles. Supports Petrol, Diesel, Electric, Hybrid, and CNG across Cars, SUVs, Bikes, Scooters, Vans.
- **Service Appointment Booking**: Book services (General Service, Oil Change, Brake Service, Battery, AC, Tyres, Engine Repair) with preferred date & time slots.
- **Live Status Tracking**: Track real-time repair progress: `Requested` &rarr; `Confirmed` &rarr; `In Service` &rarr; `Ready` &rarr; `Completed`.
- **Service History & Invoices**: View historical work logs, technician notes, and printable tax invoices.

### 🛡️ Admin & Workshop Staff Portal
- **Executive Operations Dashboard**: Real-time KPI metrics (Total Customers, Vehicles, Today's Bay Appts, Vehicles In Service, Total Revenue, Low Stock Warning Banner).
- **Customer & Vehicle Directories**: Searchable master customer and vehicle directories across all workshop bays.
- **Appointment Dispatch Queue**: Advance appointment state machine transitions with strict validation preventing illegal state jumps.
- **Service Record Creation & Inventory Deduction**: Log completed services, labor charges, technician inspection notes, and select spare parts installed. Automatically deducts inventory stock and updates vehicle mileage.
- **Parts Catalog & Low Stock Alerting**: Monitor inventory stock levels, unit prices, minimum stock thresholds (`quantity <= minimum_stock`), add new parts, and restock.
- **Billing Ledger**: Itemized invoice breakdown (`Subtotal = Labour + Parts`, `Tax = Subtotal × 18%`, `Total`), payment status management (`Pending`, `Paid`, `Cancelled`), and printable invoices.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript, Bootstrap 5 |
| **Design System** | Stitch-inspired `GarageFlow Core` (`#0284c7` primary blue, `#0f172a` navy, `#f8fafc` canvas) |
| **Backend API** | Node.js, Express.js |
| **Database** | InsForge PostgreSQL (Managed Cloud BaaS with Row-Level Security) |
| **Security** | BcryptJS (salt factor 10), JSON Web Tokens (JWT) |
| **API Testing** | Postman v10.x Collection (`GarageFlow.postman_collection.json`) |

---

## 🔑 Demo Credentials (Pre-seeded)

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Admin / Workshop Staff** | `admin@garageflow.com` | `Admin@123` | Full Administrative & Workshop Control |
| **Customer 1** | `john.doe@example.com` | `Customer@123` | Customer Vehicles & Appointments |
| **Customer 2** | `sarah.smith@example.com` | `Customer@123` | Customer Vehicles & Appointments |

---

## 📂 Project Structure

```text
GarageFlow/
├── server/
│   ├── config/
│   │   └── db.js                  # InsForge Backend Health & Connection Verifier
│   ├── services/
│   │   └── insforge/              # InsForge BaaS Client & Data Service Layer
│   ├── controllers/
│   │   ├── authController.js       # Register, Login, Profile
│   │   ├── vehicleController.js    # Vehicle CRUD
│   │   ├── appointmentController.js# Appointment State Machine
│   │   ├── serviceRecordController.js # Service Creation & Auto-Deduct
│   │   ├── partController.js       # Inventory Catalog & Low Stock Alerts
│   │   ├── billController.js       # Invoices & Payment Status
│   │   └── adminController.js      # Executive KPI Metrics & Customer Directory
│   ├── middleware/
│   │   └── auth.js                 # JWT Verification & Role Authorization
│   ├── routes/                     # Express REST API Routes
│   ├── database/
│   │   ├── schema.sql              # Relational DDL Reference Schema
│   │   ├── migrate_to_insforge.js  # Migration Artifact
│   │   └── seed.sql                # Pre-seeded Demo Data Reference
│   └── server.js                   # Express Application Entry Point
│
├── client/
│   ├── css/
│   │   └── style.css               # GarageFlow Design Tokens & Print Stylesheet
│   ├── js/
│   │   ├── api.js                  # Centralized Fetch Helper & Toast Notifications
│   │   └── auth.js                 # Auth Session & Role Guards
│   ├── customer/                   # Customer Portal Client Pages
│   ├── admin/                      # Admin Operations Portal Client Pages
│   ├── index.html                  # Landing Page
│   ├── login.html                  # Login Page (with Demo Auto-Fill)
│   └── register.html               # Registration Page
│
├── qa/                             # Quality Assurance Suite (7 Markdown Reports)
│   ├── test-plan.md                # Strategy & Entry/Exit Criteria
│   ├── test-cases.md               # 62 Executed Test Cases
│   ├── bug-report.md               # Bug Reports & Retest Verification
│   ├── api-testing.md              # Postman API Testing Specification
│   ├── regression-testing.md       # Regression Matrix
│   ├── compatibility-testing.md    # Cross-Browser Compatibility Matrix
│   └── test-summary.md             # Final QA Sign-Off Report
│
├── docs/                           # Internship Report Chapters (10 Chapters)
│   ├── introduction.md, objectives.md, technology-stack.md, system-design.md,
│   ├── implementation.md, testing.md, challenges.md, conclusion.md, weekly-progress.md, references.md
│
├── GarageFlow.postman_collection.json # Exported Postman API Collection
├── .env.example                    # Environment Template
├── package.json                    # Node Dependencies
└── README.md                       # Documentation
```

---

## ⚙️ Installation & Running Locally

### Prerequisites
- **Node.js**: v18.0 or higher
- **InsForge Backend Project**: Configured InsForge cloud backend with PostgreSQL and Auth.

### 1. Clone & Install Dependencies
```bash
cd c:\Users\vaibh\Downloads\GarageFlow
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory (using `.env.example` as a template):
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here

# InsForge Cloud Backend Configuration
INSFORGE_URL=https://your-project.us-east.insforge.app
INSFORGE_ANON_KEY=your_insforge_anon_key_here
INSFORGE_API_KEY=your_insforge_service_role_key_here
```

### 3. Database Architecture & Health
GarageFlow connects to a managed InsForge PostgreSQL database with Row-Level Security. Database tables, foreign key constraints, indexes, and initial data are managed through InsForge migrations. Verify connection health at:
```text
http://localhost:5000/api/health
http://localhost:5000/api/insforge/health
```

### 4. Start Server & Open Web App
```bash
npm start
```
Open your browser and navigate to:
```text
http://localhost:5000
```

---

## 🧪 Quality Assurance & Testing Summary

GarageFlow underwent complete QA verification:
- **Total Test Cases Executed**: 62
- **Pass Rate**: 100% (62 Passed, 0 Failed)
- **Defects Discovered & Resolved**: 4 (BUG-001 to BUG-004)
- **Postman API Collection**: Included in `GarageFlow.postman_collection.json`
- **Browsers Verified**: Google Chrome, Microsoft Edge, Mozilla Firefox

---

## 📄 License & Academic Internship Project

This project was engineered for academic and internship evaluation under the title:  
**Design, Development and Quality Assurance of a Web-Based Vehicle Service Management System (GarageFlow)**.
