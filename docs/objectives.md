# Chapter 2 — Project Objectives

The primary objectives of the **GarageFlow** project are:

1. **Role-Based Workflows**: Deliver separate Customer and Admin portals with JWT authentication and route authorization.
2. **Vehicle Fleet Tracking**: Support multi-vehicle management with support for Petrol, Diesel, Electric, Hybrid, and CNG fuel types across Cars, SUVs, Bikes, Scooters, and Vans.
3. **Appointment State Machine**: Implement a strict state transition workflow: `Requested` -> `Confirmed` -> `In Service` -> `Ready` -> `Completed` / `Cancelled`.
4. **Automated Inventory Control**: Implement real-time stock deduction and low-stock alerts (`quantity <= minimum_stock`).
5. **Itemized Billing Engine**: Automatically calculate subtotals (`Labour + Parts`), 18% sales tax, and grand totals with printable invoice generation.
6. **Academic & Internship QA Compliance**: Deliver full software testing documentation, 62 executed test cases, bug reports, and a Postman collection.
