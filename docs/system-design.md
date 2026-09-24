# Chapter 4 — System Design & Diagrams

## 4.1 System Architecture Diagram

```mermaid
graph TD
    Client["Browser (Vanilla JS + Bootstrap 5)"] -->|REST JSON API| ExpressServer["Express.js Web & API Server"]
    ExpressServer --> AuthMW["JWT & Role Authorization Middleware"]
    Controllers --> Services["InsForge Data Access & Service Layer"]
    Services --> DB["InsForge Managed PostgreSQL Backend"]
```

---

## 4.2 Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ VEHICLES : owns
    USERS ||--o{ SERVICE_APPOINTMENTS : books
    USERS ||--o{ BILLS : billed_to
    VEHICLES ||--o{ SERVICE_APPOINTMENTS : assigned_to
    VEHICLES ||--o{ SERVICE_RECORDS : serviced_in
    SERVICE_APPOINTMENTS ||--|| SERVICE_RECORDS : completes
    SERVICE_RECORDS ||--|| BILLS : generates
    SERVICE_RECORDS ||--o{ SERVICE_PARTS : includes
    PARTS ||--o{ SERVICE_PARTS : used_in

    USERS {
        int id PK
        string name
        string email UK
        string phone
        string password_hash
        string role
    }

    VEHICLES {
        int id PK
        int user_id FK
        string registration_number UK
        string brand
        string model
        int year
        string fuel_type
        string vehicle_type
        int mileage
    }

    SERVICE_APPOINTMENTS {
        int id PK
        int vehicle_id FK
        int user_id FK
        string service_type
        date appointment_date
        string appointment_time
        string status
    }

    SERVICE_RECORDS {
        int id PK
        int appointment_id FK
        int vehicle_id FK
        date service_date
        decimal labour_cost
        decimal total_cost
    }

    PARTS {
        int id PK
        string part_name
        string part_number UK
        int quantity
        decimal unit_price
        int minimum_stock
    }

    SERVICE_PARTS {
        int id PK
        int service_record_id FK
        int part_id FK
        int quantity_used
        decimal unit_price
    }

    BILLS {
        int id PK
        int service_record_id FK
        int customer_id FK
        decimal subtotal
        decimal tax
        decimal total
        string payment_status
    }
```

---

## 4.3 Data Flow Diagram (DFD Level 1)

```mermaid
graph LR
    Customer(("Customer")) -->|Book Service Request| ApptProcess["Process 1.0: Service Appointment Booking"]
    ApptProcess -->|Insert Appt| ApptStore[("Appointments Store")]
    
    Admin(("Admin / Staff")) -->|Advance Status / Log Service| ServiceProcess["Process 2.0: Service Record & Parts"]
    ServiceProcess -->|Deduct Stock| PartsStore[("Parts Inventory Store")]
    ServiceProcess -->|Write Service Log| ServiceStore[("Service Records Store")]
    
    ServiceProcess -->|Trigger Auto-Invoice| BillProcess["Process 3.0: Invoice Generation"]
    BillProcess -->|Write Bill| BillStore[("Bills Store")]
    BillStore -->|Display Invoice| Customer
```

---

## 4.4 Use Case Diagram

```mermaid
graph TD
    subgraph Customer Use Cases
        UC1["Register / Login Account"]
        UC2["Manage Vehicle Fleet"]
        UC3["Book Service Appointment"]
        UC4["Track Live Bay Status"]
        UC5["View & Print Invoices"]
    end

    subgraph Admin Use Cases
        UC6["View Workshop KPIs & Low Stock Alerts"]
        UC7["Manage Customer Accounts"]
        UC8["Advance Appointment State Machine"]
        UC9["Create Service Record & Auto-Deduct Inventory"]
        UC10["Manage Parts Catalog & Restock"]
        UC11["Manage Payment Status Ledger"]
    end

    CustomerUser(("Customer User")) --> UC1
    CustomerUser --> UC2
    CustomerUser --> UC3
    CustomerUser --> UC4
    CustomerUser --> UC5

    AdminUser(("Admin / Staff")) --> UC6
    AdminUser --> UC7
    AdminUser --> UC8
    AdminUser --> UC9
    AdminUser --> UC10
    AdminUser --> UC11
```

---

## 4.5 Appointment State Machine Workflow

```mermaid
stateDiagram-v2
    [*] --> Requested: Customer Books Service
    Requested --> Confirmed: Admin Confirms Slot
    Requested --> Cancelled: Customer/Admin Cancels
    Confirmed --> InService: Bay Mechanic Commences Work
    Confirmed --> Cancelled: Admin Cancels
    InService --> Ready: Work Completed & Inspected
    Ready --> Completed: Service Record Logged & Invoiced
    Completed --> [*]
    Cancelled --> [*]
```
