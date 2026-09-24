# Chapter 7 — Technical Challenges Faced & Solutions

During the engineering and quality assurance phases of **GarageFlow**, several technical challenges were encountered and resolved:

### Challenge 1: Inventory Stock Overselling
- **Problem**: Simultaneously creating a service record requesting more spare parts than currently available in stock resulted in negative inventory quantities.
- **Solution**: Implemented pre-transaction stock validation in `serviceRecordController.js`. If `part.quantity < quantity_used`, the API aborts with HTTP 400 "Insufficient inventory stock".

### Challenge 2: State Machine Status Skipping
- **Problem**: Admin users could inadvertently skip intermediate workshop steps (e.g. jumping from `Requested` directly to `Completed` without bay assignment or service logging).
- **Solution**: Defined `VALID_TRANSITIONS` lookup dictionary in `appointmentController.js` restricting status changes to valid sequential states.

### Challenge 3: Modernization & Cloud Production Migration (InsForge PostgreSQL)
- **Problem**: Local embedded SQLite and local MySQL presented deployment, concurrent connection, and multi-tenant security limitations for cloud production.
- **Solution**: Migrated the entire architecture to an InsForge managed PostgreSQL BaaS with Row-Level Security (RLS) policies, server-side data access layer, strict data isolation, and unified cloud infrastructure.
