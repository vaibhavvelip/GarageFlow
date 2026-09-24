# Chapter 5 — System Implementation

## 5.1 Project Architecture & Directory Layout

```text
GarageFlow/
├── server/
│   ├── config/ (Database connectivity & health monitoring)
│   ├── services/insforge/ (InsForge BaaS client, data access layer & services)
│   ├── controllers/ (Auth, Vehicle, Appt, ServiceRecord, Part, Bill, Admin)
│   ├── middleware/ (JWT Auth & Role Authorization Guards)
│   ├── routes/ (Express REST API Routers)
│   ├── database/ (Schema definition, migration scripts, and seed data)
│   └── server.js (Express server entry point)
├── client/
│   ├── css/ (Stitch-inspired Design System CSS tokens)
│   ├── js/ (API fetch helper & Auth Session scripts)
│   ├── customer/ (Customer Dashboard, Vehicles, Appointments, Service History, Bills, Profile)
│   ├── admin/ (Admin Operations Dashboard, Customers, Vehicles, Appointments, Create Service, Parts, Billing, History)
│   ├── index.html, login.html, register.html
├── qa/ (7 Quality Assurance Markdown Documents & Test Suites)
├── docs/ (Complete Internship Report Chapters)
└── GarageFlow.postman_collection.json
```

## 5.2 Module Technical Breakdown

1. **Authentication & Authorization**: `authController.js` hashes passwords via `bcryptjs` (salt factor 10) and signs stateless JWT tokens containing user ID, email, name, and role (`ADMIN` or `CUSTOMER`).
2. **Vehicle Management**: `vehicleController.js` validates vehicle registration uniqueness, fuel type enum, vehicle category, and mileage constraints.
3. **Service Appointments**: `appointmentController.js` enforces the appointment state machine map `VALID_TRANSITIONS` to prevent illegal state jumps.
4. **Service Records & Inventory**: `serviceRecordController.js` executes multi-table operations (verifies part stock, creates service record, deducts stock, updates vehicle mileage, auto-generates bill invoice, and sets appointment status to `Completed`).
5. **Billing & Invoices**: `billController.js` calculates subtotal, 18% sales tax, and total, rendering a printable invoice via `@media print`.
