-- GarageFlow Database Seed Data
-- Pre-populated data for Admin, Customers, Vehicles, Appointments, Service Records, Inventory Parts, and Bills

USE garageflow;

-- 1. Insert Users
INSERT INTO users (id, name, email, phone, password_hash, role) VALUES
(1, 'System Administrator', 'admin@garageflow.com', '+1 555-0192', '$2a$10$izOrQEW4GiOhzqwhpNXbbedBFTfCU7vJ5dJNnvApFUuqX6y8ONSg6', 'ADMIN'),
(2, 'John Doe', 'john.doe@example.com', '+1 555-0143', '$2a$10$EmSjTlCqqxK4zWvJFKKuk.V.MayYRkjVhfCm186v.EYbVrxX5Wev.', 'CUSTOMER'),
(3, 'Sarah Smith', 'sarah.smith@example.com', '+1 555-0178', '$2a$10$EmSjTlCqqxK4zWvJFKKuk.V.MayYRkjVhfCm186v.EYbVrxX5Wev.', 'CUSTOMER'),
(4, 'Michael Brown', 'michael.b@example.com', '+1 555-0189', '$2a$10$EmSjTlCqqxK4zWvJFKKuk.V.MayYRkjVhfCm186v.EYbVrxX5Wev.', 'CUSTOMER');

-- 2. Insert Vehicles
INSERT INTO vehicles (id, user_id, registration_number, brand, model, year, fuel_type, vehicle_type, mileage) VALUES
(1, 2, 'MH-12-AB-1234', 'BMW', '3 Series 330i', 2022, 'Petrol', 'Car', 24500),
(2, 2, 'MH-12-XY-9876', 'Honda', 'CB350', 2021, 'Petrol', 'Bike', 12000),
(3, 3, 'KA-01-EQ-5544', 'Tesla', 'Model 3 Dual Motor', 2023, 'Electric', 'Car', 18200),
(4, 4, 'DL-03-CC-7788', 'Toyota', 'Fortuner 4x4', 2020, 'Diesel', 'SUV', 45000);

-- 3. Insert Parts Inventory
INSERT INTO parts (id, part_name, part_number, category, quantity, unit_price, minimum_stock) VALUES
(1, 'Synthetic Engine Oil 5W-30 (4L)', 'OIL-SYN-5W30', 'Lubricants', 25, 45.00, 5),
(2, 'Premium Ceramic Brake Pad Set', 'BRK-PAD-CRM', 'Brakes', 4, 85.00, 8), -- Low Stock
(3, 'High-Flow Engine Air Filter', 'FLT-AIR-HF', 'Filters', 18, 24.50, 6),
(4, 'Heavy-Duty 12V AGM Battery', 'BAT-AGM-12V', 'Electrical', 2, 140.00, 4), -- Low Stock
(5, 'Cabin Air Filter Carbon', 'FLT-CAB-CAR', 'Filters', 15, 30.00, 5),
(6, 'All-Season Performance Tyre 225/45R17', 'TYR-AS-225', 'Tyres', 12, 120.00, 4),
(7, 'Spark Plug Iridium Pack of 4', 'SPK-IRD-P4', 'Engine', 3, 48.00, 5); -- Low Stock

-- 4. Insert Appointments
INSERT INTO service_appointments (id, vehicle_id, user_id, service_type, appointment_date, appointment_time, mileage, description, status) VALUES
(1, 1, 2, 'General Service', CURRENT_DATE(), '10:00 AM', 24500, 'Routine 25k km inspection, oil change and brake fluid check.', 'In Service'),
(2, 2, 2, 'Chain & Oil Service', CURRENT_DATE() - INTERVAL 2 DAY, '11:30 AM', 12000, 'Chain lube, oil filter change and clutch adjustment.', 'Completed'),
(3, 3, 3, 'Brake Service', CURRENT_DATE() + INTERVAL 1 DAY, '02:00 PM', 18200, 'Check regenerative braking pads and tire rotation.', 'Confirmed'),
(4, 4, 4, 'Engine Repair', CURRENT_DATE() + INTERVAL 3 DAY, '09:00 AM', 45000, 'Check engine warning light illuminated and rough idling.', 'Requested');

-- 5. Insert Service Records
INSERT INTO service_records (id, appointment_id, vehicle_id, service_date, mileage, service_description, technician_notes, labour_cost, total_cost) VALUES
(1, 2, 2, CURRENT_DATE() - INTERVAL 2 DAY, 12000, 'Full synthetic oil replacement, oil filter swap, drive chain cleaning & tensioning.', 'Technician inspected clutch plates; nominal wear. Drive chain lubricated with synthetic lube.', 60.00, 105.00);

-- 6. Insert Service Parts Link
INSERT INTO service_parts (id, service_record_id, part_id, quantity_used, unit_price) VALUES
(1, 1, 1, 1, 45.00);

-- 7. Insert Bills
INSERT INTO bills (id, service_record_id, customer_id, subtotal, tax, total, payment_status) VALUES
(1, 1, 2, 105.00, 18.90, 123.90, 'Paid');
