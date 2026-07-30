
-- Realtime
ALTER TABLE public.attendance REPLICA IDENTITY FULL;
ALTER TABLE public.leads REPLICA IDENTITY FULL;
ALTER TABLE public.invoices REPLICA IDENTITY FULL;
ALTER TABLE public.payments REPLICA IDENTITY FULL;
ALTER TABLE public.academy_notifications REPLICA IDENTITY FULL;

DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.leads; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.payments; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.academy_notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Lead conversion helper
CREATE OR REPLACE FUNCTION public.convert_lead_to_client(_lead_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _lead public.leads%ROWTYPE;
  _client_id uuid;
BEGIN
  SELECT * INTO _lead FROM public.leads WHERE id = _lead_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found'; END IF;
  IF _lead.converted_client_id IS NOT NULL THEN
    RETURN _lead.converted_client_id;
  END IF;
  INSERT INTO public.clients (branch_id, client_code, full_name, phone, email, notes, active)
  VALUES (_lead.branch_id, public.gen_client_code(), _lead.full_name, _lead.phone, _lead.email, _lead.notes, true)
  RETURNING id INTO _client_id;
  UPDATE public.leads SET converted_client_id = _client_id, status = 'converted', updated_at = now() WHERE id = _lead_id;
  RETURN _client_id;
END $$;

GRANT EXECUTE ON FUNCTION public.convert_lead_to_client(uuid) TO authenticated;
