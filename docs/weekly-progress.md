# Chapter 9 — Weekly Internship Progress Log

The following progress log outlines the 8-week engineering and quality assurance progression for **GarageFlow**:

| Week | Phase | Milestones & Activities Completed | Output Deliverables |
| :--- | :--- | :--- | :--- |
| **Week 1** | Requirement Analysis & Architecture | Conducted workshop management problem research, defined system scope, user roles (Customer, Admin), tech stack selection (Node, Express, MySQL, Vanilla JS, Bootstrap 5), and designed initial database schema. | Problem Statement, Requirements Spec |
| **Week 2** | UI/UX & Design Tokens | Extracted design tokens (`#0284c7` primary blue, `#0f172a` navy, `#f8fafc` canvas, soft geometry) from Stitch UI assets; created global CSS stylesheet (`client/css/style.css`) and brand logo assets. | Stitch Design Tokens, CSS Tokens |
| **Week 3** | Database Architecture | Developed MySQL DDL script (`server/database/schema.sql`) for `users`, `vehicles`, `service_appointments`, `service_records`, `parts`, `service_parts`, and `bills` tables with foreign keys and seed data (`seed.sql`). Architected SQLite fallback connector. | `schema.sql`, `seed.sql`, `db.js` |
| **Week 4** | Backend REST API Development | Built Express server (`server/server.js`), JWT authentication middleware (`auth.js`), and REST controllers for Auth, Vehicles, Appointments, Service Records, Inventory Parts, Billing, and Admin KPIs. | Express Controllers & API Routers |
| **Week 5** | Customer Portal Frontend | Created HTML5 & Vanilla JS pages for Customer Dashboard (`dashboard.html`), Vehicle Management (`vehicles.html`, `add-vehicle.html`), Service Booking (`book-service.html`), History, and Profile Settings. | Customer Portal Client Pages |
| **Week 6** | Admin Portal Frontend | Implemented Admin Operations Dashboard (`admin/dashboard.html`), Customer Directory, Master Vehicle Fleet, Appointment Dispatch Queue (`appointments.html`), Service Logging with Inventory Deduction, and Billing Ledger. | Admin Portal Client Pages |
| **Week 7** | Quality Assurance & API Testing | Formulated Test Plan (`qa/test-plan.md`), executed 62 detailed test cases (`qa/test-cases.md`), documented defects (`qa/bug-report.md`), constructed Postman API collection (`GarageFlow.postman_collection.json`), and verified bug fixes. | QA Test Suite & Postman Collection |
| **Week 8** | Documentation & Final Evaluation | Authored project documentation chapters (Introduction, System Design, ER & DFD Diagrams, Challenges, Conclusion), created `README.md`, verified server execution, and conducted final QA sign-off. | Complete Internship Project Report |
