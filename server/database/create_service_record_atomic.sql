-- ==============================================================================
-- Secure Atomic Transaction Function for GarageFlow Service Records
-- Ensures ACID atomicity across service_records, service_parts, inventory deduction,
-- vehicle mileage update, bill invoice generation, and appointment status update.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.create_service_record_atomic(
    p_appointment_id UUID,
    p_service_date DATE,
    p_mileage INTEGER,
    p_service_description TEXT,
    p_technician_notes TEXT,
    p_labour_cost NUMERIC,
    p_parts JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_appt RECORD;
    v_record_id UUID;
    v_bill_id UUID;
    v_part_item JSONB;
    v_part_id UUID;
    v_part_qty INTEGER;
    v_part_price NUMERIC;
    v_part_row RECORD;
    v_parts_total NUMERIC := 0.00;
    v_subtotal NUMERIC := 0.00;
    v_tax NUMERIC := 0.00;
    v_grand_total NUMERIC := 0.00;
BEGIN
    -- 1. Fetch and validate appointment
    SELECT * INTO v_appt
    FROM public.service_appointments
    WHERE id = p_appointment_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Associated appointment not found';
    END IF;

    IF v_appt.status = 'Completed' THEN
        RAISE EXCEPTION 'This appointment has already been completed.';
    END IF;

    IF v_appt.status = 'Cancelled' THEN
        RAISE EXCEPTION 'Cannot create a service record for a cancelled appointment.';
    END IF;

    -- 2. Verify no existing service record for this appointment (idempotency guard)
    IF EXISTS (SELECT 1 FROM public.service_records WHERE appointment_id = p_appointment_id) THEN
        RAISE EXCEPTION 'A service record has already been logged for this appointment.';
    END IF;

    -- 3. Validate inventory stock for all parts before making any deductions
    IF p_parts IS NOT NULL AND jsonb_array_length(p_parts) > 0 THEN
        FOR v_part_item IN SELECT * FROM jsonb_array_elements(p_parts)
        LOOP
            v_part_id := (v_part_item->>'part_id')::UUID;
            v_part_qty := COALESCE((v_part_item->>'quantity_used')::INTEGER, 1);

            SELECT quantity, unit_price, part_name INTO v_part_row
            FROM public.parts
            WHERE id = v_part_id
            FOR UPDATE;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Part not found';
            END IF;

            IF v_part_row.quantity < v_part_qty THEN
                RAISE EXCEPTION 'Insufficient inventory stock for ''%''. Available: %, Requested: %.', 
                    v_part_row.part_name, v_part_row.quantity, v_part_qty;
            END IF;

            v_part_price := COALESCE((v_part_item->>'unit_price')::NUMERIC, v_part_row.unit_price);
            v_parts_total := v_parts_total + (v_part_price * v_part_qty);
        END LOOP;
    END IF;

    -- 4. Calculate financial totals
    v_subtotal := COALESCE(p_labour_cost, 0.00) + v_parts_total;
    v_tax := ROUND(v_subtotal * 0.18, 2);
    v_grand_total := ROUND(v_subtotal + v_tax, 2);

    -- 5. Insert service record
    INSERT INTO public.service_records (
        appointment_id,
        vehicle_id,
        service_date,
        mileage,
        service_description,
        technician_notes,
        labour_cost,
        total_cost
    ) VALUES (
        p_appointment_id,
        v_appt.vehicle_id,
        p_service_date,
        p_mileage,
        p_service_description,
        COALESCE(p_technician_notes, ''),
        COALESCE(p_labour_cost, 0.00),
        v_subtotal
    ) RETURNING id INTO v_record_id;

    -- 6. Insert service_parts and deduct inventory
    IF p_parts IS NOT NULL AND jsonb_array_length(p_parts) > 0 THEN
        FOR v_part_item IN SELECT * FROM jsonb_array_elements(p_parts)
        LOOP
            v_part_id := (v_part_item->>'part_id')::UUID;
            v_part_qty := COALESCE((v_part_item->>'quantity_used')::INTEGER, 1);

            SELECT unit_price INTO v_part_row
            FROM public.parts
            WHERE id = v_part_id;

            v_part_price := COALESCE((v_part_item->>'unit_price')::NUMERIC, v_part_row.unit_price);

            INSERT INTO public.service_parts (
                service_record_id,
                part_id,
                quantity_used,
                unit_price
            ) VALUES (
                v_record_id,
                v_part_id,
                v_part_qty,
                v_part_price
            );

            UPDATE public.parts
            SET quantity = quantity - v_part_qty
            WHERE id = v_part_id;
        END LOOP;
    END IF;

    -- 7. Update vehicle mileage
    UPDATE public.vehicles
    SET mileage = p_mileage
    WHERE id = v_appt.vehicle_id;

    -- 8. Auto-generate Bill Invoice
    INSERT INTO public.bills (
        service_record_id,
        customer_id,
        subtotal,
        tax,
        total,
        payment_status
    ) VALUES (
        v_record_id,
        v_appt.user_id,
        v_subtotal,
        v_tax,
        v_grand_total,
        'Pending'
    ) RETURNING id INTO v_bill_id;

    -- 9. Update Appointment status to 'Completed'
    UPDATE public.service_appointments
    SET status = 'Completed'
    WHERE id = p_appointment_id;

    -- 10. Return result envelope
    RETURN jsonb_build_object(
        'success', true,
        'service_record_id', v_record_id,
        'bill_id', v_bill_id,
        'total_cost', v_grand_total,
        'subtotal', v_subtotal,
        'tax', v_tax
    );
END;
$$;

-- Grant execution permissions to authenticated roles and backend service role
GRANT EXECUTE ON FUNCTION public.create_service_record_atomic TO authenticated, service_role;
