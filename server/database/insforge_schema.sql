-- InsForge PostgreSQL Schema for GarageFlow

-- Enable pgcrypto extension for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'ADMIN')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Helper Function for Admin Check (Recursion Safe)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'ADMIN'
  );
$$;

-- 2. Vehicles Table
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    registration_number TEXT NOT NULL UNIQUE,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    fuel_type TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    mileage INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Service Appointments Table
CREATE TABLE IF NOT EXISTS public.service_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TEXT NOT NULL,
    mileage INTEGER NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Requested',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Service Records Table
CREATE TABLE IF NOT EXISTS public.service_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES public.service_appointments(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    mileage INTEGER NOT NULL,
    service_description TEXT NOT NULL,
    technician_notes TEXT,
    labour_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Parts Table
CREATE TABLE IF NOT EXISTS public.parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_name TEXT NOT NULL,
    part_number TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    minimum_stock INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Service Parts Table
CREATE TABLE IF NOT EXISTS public.service_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_record_id UUID NOT NULL REFERENCES public.service_records(id) ON DELETE CASCADE,
    part_id UUID NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
    quantity_used INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL
);

-- 7. Bills Table
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_record_id UUID NOT NULL REFERENCES public.service_records(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subtotal NUMERIC(10, 2) NOT NULL,
    tax NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile on register" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

DROP POLICY IF EXISTS "Customers can manage their own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can manage all vehicles" ON public.vehicles;

DROP POLICY IF EXISTS "Customers can manage their own appointments" ON public.service_appointments;
DROP POLICY IF EXISTS "Admins can manage all appointments" ON public.service_appointments;

DROP POLICY IF EXISTS "Customers can view their service records" ON public.service_records;
DROP POLICY IF EXISTS "Admins can manage all service records" ON public.service_records;

DROP POLICY IF EXISTS "Authenticated users can view parts" ON public.parts;
DROP POLICY IF EXISTS "Admins can manage parts" ON public.parts;

DROP POLICY IF EXISTS "Customers can view their service parts" ON public.service_parts;
DROP POLICY IF EXISTS "Admins can manage all service parts" ON public.service_parts;

DROP POLICY IF EXISTS "Customers can view their own bills" ON public.bills;
DROP POLICY IF EXISTS "Admins can manage all bills" ON public.bills;

-- RLS Policies: Profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert their own profile on register" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid() OR public.is_admin(auth.uid()));

-- RLS Policies: Vehicles
CREATE POLICY "Customers can manage their own vehicles" ON public.vehicles FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all vehicles" ON public.vehicles FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies: Appointments
CREATE POLICY "Customers can manage their own appointments" ON public.service_appointments FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all appointments" ON public.service_appointments FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies: Service Records
CREATE POLICY "Customers can view their service records" ON public.service_records FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = service_records.vehicle_id AND v.user_id = auth.uid())
);
CREATE POLICY "Admins can manage all service records" ON public.service_records FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies: Parts
CREATE POLICY "Authenticated users can view parts" ON public.parts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage parts" ON public.parts FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies: Service Parts
CREATE POLICY "Customers can view their service parts" ON public.service_parts FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.service_records sr 
        JOIN public.vehicles v ON v.id = sr.vehicle_id 
        WHERE sr.id = service_parts.service_record_id AND v.user_id = auth.uid()
    )
);
CREATE POLICY "Admins can manage all service parts" ON public.service_parts FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies: Bills
CREATE POLICY "Customers can view their own bills" ON public.bills FOR SELECT USING (customer_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage all bills" ON public.bills FOR ALL USING (public.is_admin(auth.uid()));
