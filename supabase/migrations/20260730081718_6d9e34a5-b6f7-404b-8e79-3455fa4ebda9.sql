ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS assigned_staff text,
  ADD COLUMN IF NOT EXISTS subscription_type text,
  ADD COLUMN IF NOT EXISTS offer_label text;

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS membership_id text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS emergency_contact text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS level text,
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS assigned_staff text;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS service_name text,
  ADD COLUMN IF NOT EXISTS service_type text,
  ADD COLUMN IF NOT EXISTS total_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assigned_staff text;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS trainee_name text,
  ADD COLUMN IF NOT EXISTS client_code text,
  ADD COLUMN IF NOT EXISTS membership_id text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS emergency_contact text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS level text,
  ADD COLUMN IF NOT EXISTS group_type text,
  ADD COLUMN IF NOT EXISTS sessions_total integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sessions_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS skill_rating integer,
  ADD COLUMN IF NOT EXISTS training_days text,
  ADD COLUMN IF NOT EXISTS session_time text,
  ADD COLUMN IF NOT EXISTS coach_id uuid,
  ADD COLUMN IF NOT EXISTS coach_name text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS client_code text,
  ADD COLUMN IF NOT EXISTS person_name text,
  ADD COLUMN IF NOT EXISTS person_type text NOT NULL DEFAULT 'trainee',
  ADD COLUMN IF NOT EXISTS session_label text;

ALTER TABLE public.coaches
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS day_groups text[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.coach_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL,
  coach_id uuid,
  coach_name text,
  technical integer NOT NULL DEFAULT 0,
  communication integer NOT NULL DEFAULT 0,
  punctuality integer NOT NULL DEFAULT 0,
  students integer NOT NULL DEFAULT 0,
  notes text,
  evaluated_at date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_evaluations TO authenticated;
GRANT ALL ON public.coach_evaluations TO service_role;
ALTER TABLE public.coach_evaluations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "branch scoped rw" ON public.coach_evaluations;
CREATE POLICY "branch scoped rw" ON public.coach_evaluations FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())))
  WITH CHECK (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())));
DROP TRIGGER IF EXISTS trg_coach_evaluations_updated ON public.coach_evaluations;
CREATE TRIGGER trg_coach_evaluations_updated BEFORE UPDATE ON public.coach_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.trainee_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL,
  client_id uuid,
  trainee_name text,
  client_code text,
  evaluator text,
  general integer NOT NULL DEFAULT 0,
  improvements text,
  evaluated_at date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainee_evaluations TO authenticated;
GRANT ALL ON public.trainee_evaluations TO service_role;
ALTER TABLE public.trainee_evaluations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "branch scoped rw" ON public.trainee_evaluations;
CREATE POLICY "branch scoped rw" ON public.trainee_evaluations FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())))
  WITH CHECK (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())));
DROP TRIGGER IF EXISTS trg_trainee_evaluations_updated ON public.trainee_evaluations;
CREATE TRIGGER trg_trainee_evaluations_updated BEFORE UPDATE ON public.trainee_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.group_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL,
  name text NOT NULL,
  max_capacity integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_types TO authenticated;
GRANT ALL ON public.group_types TO service_role;
ALTER TABLE public.group_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "branch scoped rw" ON public.group_types;
CREATE POLICY "branch scoped rw" ON public.group_types FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())))
  WITH CHECK (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())));
DROP TRIGGER IF EXISTS trg_group_types_updated ON public.group_types;
CREATE TRIGGER trg_group_types_updated BEFORE UPDATE ON public.group_types
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.coach_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL,
  coach_id uuid,
  coach_name text,
  day_group text NOT NULL,
  time_slot text NOT NULL,
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_slots TO authenticated;
GRANT ALL ON public.coach_slots TO service_role;
ALTER TABLE public.coach_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "branch scoped rw" ON public.coach_slots;
CREATE POLICY "branch scoped rw" ON public.coach_slots FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())))
  WITH CHECK (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())));
DROP TRIGGER IF EXISTS trg_coach_slots_updated ON public.coach_slots;
CREATE TRIGGER trg_coach_slots_updated BEFORE UPDATE ON public.coach_slots
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.schedule_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL,
  coach_id uuid,
  coach_name text,
  day_group text NOT NULL,
  time_slot text NOT NULL,
  group_type_id uuid,
  group_type_name text,
  student_name text NOT NULL,
  client_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedule_bookings TO authenticated;
GRANT ALL ON public.schedule_bookings TO service_role;
ALTER TABLE public.schedule_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "branch scoped rw" ON public.schedule_bookings;
CREATE POLICY "branch scoped rw" ON public.schedule_bookings FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())))
  WITH CHECK (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())));
DROP TRIGGER IF EXISTS trg_schedule_bookings_updated ON public.schedule_bookings;
CREATE TRIGGER trg_schedule_bookings_updated BEFORE UPDATE ON public.schedule_bookings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.staff_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL,
  staff_name text NOT NULL,
  staff_role text,
  day_group text NOT NULL DEFAULT 'Sat-Thu',
  time_slot text NOT NULL,
  hours numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_hours TO authenticated;
GRANT ALL ON public.staff_hours TO service_role;
ALTER TABLE public.staff_hours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "branch scoped rw" ON public.staff_hours;
CREATE POLICY "branch scoped rw" ON public.staff_hours FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())))
  WITH CHECK (public.is_super_admin(auth.uid()) OR branch_id IN (SELECT private.user_branch_ids(auth.uid())));
DROP TRIGGER IF EXISTS trg_staff_hours_updated ON public.staff_hours;
CREATE TRIGGER trg_staff_hours_updated BEFORE UPDATE ON public.staff_hours
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DO $seed$
DECLARE b uuid;
BEGIN
  SELECT id INTO b FROM public.branches ORDER BY sort_order, created_at LIMIT 1;
  IF b IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.coaches WHERE branch_id = b) THEN
    INSERT INTO public.coaches (branch_id, full_name, role, specialty, color, day_groups, active, phone) VALUES
      (b,'Hager Shaheen','Head Coach','KIDS · LEVELS 1-3','#14b8a6','{Sat-Thu,Sun-Tue}',true,'01000000001'),
      (b,'Hager Ismail','Coach','KIDS · BEGINNER','#00d8f6','{Sat-Thu}',true,'01000000002'),
      (b,'Shahd Ashraf','Coach','KIDS · INTERMEDIATE','#60a5fa','{Mon-Wed}',true,'01000000003'),
      (b,'Mohamed El-Sayed','Receptionist','DIVING','#22c55e','{Sat-Thu}',true,'01000000004'),
      (b,'Yasmine Ghanam','Maintenance','ADULTS · PRIVATE','#fb7185','{Sun-Tue}',true,'01000000005'),
      (b,'Eyman El-Sadek','Senior Coach','LADIES','#a78bfa','{Mon-Wed Ladies}',true,'01000000006'),
      (b,'Nour Ibrahim','Coach','KIDS · ADVANCED','#f59e0b','{Sat-Thu}',true,'01000000007'),
      (b,'Gabr Salah','Junior Coach','ADULTS · GROUP','#eab308','{Sun-Tue}',true,'01000000008'),
      (b,'Tamer Adel','Lifeguard','POOL','#38bdf8','{Sat-Thu}',true,'01000000009');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.group_types WHERE branch_id = b) THEN
    INSERT INTO public.group_types (branch_id, name, max_capacity) VALUES
      (b,'Private',1),(b,'Group of 3',3),(b,'Group of 5',5),(b,'Group of 8',8);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.leads WHERE branch_id = b) THEN
    INSERT INTO public.leads (branch_id, full_name, phone, service, source, status, assigned_staff, offer_label, offer_amount, evaluation_date, subscription_type, notes) VALUES
      (b,'Hany Magdy','01001234567','adults','call','warm','Nada','10%',10,'2026-06-19','Sessions 12','Auto-generated demo lead #1'),
      (b,'Sarah Tamer','01001234568','ladies','whatsapp','hot','Abdelkader','20%',20,'2026-06-22','Monthly','Auto-generated demo lead #2'),
      (b,'Kareem Fouad','01001234569','kids','social','warm','Mero','None',0,'2026-07-02','Sessions 8','Auto-generated demo lead #3'),
      (b,'Mona Adel','01001234570','baby','referral','cold','Nada','15%',15,'2026-07-05','Sessions 8','Auto-generated demo lead #4'),
      (b,'Youssef Nabil','01001234571','diving','call','hot','Mero','10%',10,'2026-07-08','Monthly','Auto-generated demo lead #5'),
      (b,'Aya Hassan','01001234572','ladies','whatsapp','converted','Abdelkader','None',0,'2026-07-10','Sessions 16','Auto-generated demo lead #6'),
      (b,'Omar Sherif','01001234573','kids','social','warm','Nada','5%',5,'2026-07-12','Sessions 12','Auto-generated demo lead #7'),
      (b,'Layla Mostafa','01001234574','kids','referral','hot','Mero','20%',20,'2026-07-14','Sessions 8','Auto-generated demo lead #8'),
      (b,'Tia Wael','01001234575','paraswim','call','lost','Abdelkader','None',0,'2026-07-16','Monthly','Auto-generated demo lead #9');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.clients WHERE branch_id = b) THEN
    INSERT INTO public.clients (branch_id, client_code, full_name, phone, membership_id, category, level, age, assigned_staff, active, address) VALUES
      (b,'CL-003010','Ahmed Shawky','01100000001','M-1001','Adults','Level 3',24,'Mohamed Ali',true,'Nasr City'),
      (b,'CL-003011','Omar Adel','01100000002','M-1002','Adults','Level 2',27,'Mero',true,'Maadi'),
      (b,'CL-003012','Layla Mostafa','01100000003','M-1003','Kids','Level 1',8,'Nada',true,'Zamalek'),
      (b,'CL-003013','Omar Sherif','01100000004','M-1004','Kids','Level 2',10,'Nada',true,'Heliopolis'),
      (b,'CL-003014','Tia Wael','01100000005','M-1005','Kids','Level 1',7,'Abdelkader',true,'Dokki'),
      (b,'CL-003015','Sarah Tamer','01100000006','M-1006','Ladies','Level 2',30,'Mero',true,'6 October'),
      (b,'CL-003016','Aya Hassan','01100000007','M-1007','Ladies','Level 3',26,'Mero',true,'Sheikh Zayed'),
      (b,'CL-003017','Youssef Nabil','01100000008','M-1008','Diving','Level 3',31,'Mohamed Ali',true,'New Cairo'),
      (b,'CL-003018','Kareem Fouad','01100000009','M-1009','Kids','Level 1',9,'Nada',true,'Mokattam'),
      (b,'CL-003019','Mona Adel','01100000010','M-1010','Baby','Level 1',3,'Abdelkader',true,'Rehab'),
      (b,'CL-003020','Hany Magdy','01100000011','M-1011','Adults','Level 1',35,'Mero',true,'Shorouk'),
      (b,'CL-003021','Nada Samir','01100000012','M-1012','Ladies','Level 1',22,'Nada',true,'Giza');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE branch_id = b) THEN
    INSERT INTO public.subscriptions (branch_id, client_id, plan, name, service_name, service_type, start_date, end_date, price, total_amount, paid_amount, status, assigned_staff)
    SELECT b, c.id, 'monthly', 'اشتراك (أفراد)', '(أفراد)', '(كبار)',
           date '2024-07-12' + ((row_number() over (order by c.client_code))*3)::int,
           date '2024-08-01' + ((row_number() over (order by c.client_code))*3)::int,
           41750 - (row_number() over (order by c.client_code))*500,
           41750 - (row_number() over (order by c.client_code))*500,
           41750 - (row_number() over (order by c.client_code))*500,
           'active', c.assigned_staff
    FROM public.clients c WHERE c.branch_id = b;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.payments WHERE branch_id = b) THEN
    INSERT INTO public.payments (branch_id, client_id, receipt_no, amount, method, paid_at, trainee_name, client_code, membership_id, phone, category, age, level, group_type, sessions_total, sessions_used, skill_rating, training_days, session_time, coach_name, status)
    SELECT b, c.id, 'R-' || (1793700 + (row_number() over (order by c.client_code)))::text,
           1500 + (row_number() over (order by c.client_code))*100, 'cash', now() - ((row_number() over (order by c.client_code)) || ' days')::interval,
           c.full_name, c.client_code, c.membership_id, c.phone, c.category, c.age, c.level,
           CASE WHEN (row_number() over (order by c.client_code)) % 3 = 0 THEN 'Private' ELSE 'Group' END,
           (CASE WHEN (row_number() over (order by c.client_code)) % 2 = 0 THEN 16 ELSE 8 END)::int,
           ((row_number() over (order by c.client_code)) % 8)::int,
           (4 + ((row_number() over (order by c.client_code)) % 6))::int,
           CASE WHEN (row_number() over (order by c.client_code)) % 2 = 0 THEN 'Sun-Mon-Wed' ELSE 'Sat-Thu' END,
           CASE WHEN (row_number() over (order by c.client_code)) % 2 = 0 THEN '4:00 PM' ELSE '5:00 PM' END,
           CASE WHEN (row_number() over (order by c.client_code)) % 3 = 0 THEN 'Nour Ibrahim' WHEN (row_number() over (order by c.client_code)) % 3 = 1 THEN 'Gabr Salah' ELSE NULL END,
           CASE WHEN (row_number() over (order by c.client_code)) % 4 = 0 THEN 'expired' ELSE 'active' END
    FROM public.clients c WHERE c.branch_id = b;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.staff_hours WHERE branch_id = b) THEN
    INSERT INTO public.staff_hours (branch_id, staff_name, staff_role, day_group, time_slot, hours)
    SELECT b, s.name, s.role, 'Sat-Thu', t.slot,
           CASE WHEN (s.ord + t.ord) % 4 = 0 THEN 1 WHEN (s.ord + t.ord) % 4 = 1 THEN 0.5 ELSE 0 END
    FROM (VALUES
      ('Ayman El-Maadawy','Coach',1),('Hager Shaheen','Head Coach',2),('Hesham Saeed','Senior Coach',3),
      ('Karim Salah','Junior Coach',4),('Mohamed El-Sayed','Receptionist',5),('Reem Khaled','Coach',6),
      ('Salma Nasser','Receptionist',7),('Tamer Adel','Lifeguard',8),('Yasmine Ghanam','Maintenance',9)
    ) AS s(name, role, ord)
    CROSS JOIN (VALUES ('4PM',1),('5PM',2),('6PM',3),('7PM',4),('8PM',5),('9PM',6),('10PM',7),('11PM',8)) AS t(slot, ord);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.coach_slots WHERE branch_id = b) THEN
    INSERT INTO public.coach_slots (branch_id, coach_id, coach_name, day_group, time_slot, available)
    SELECT b, co.id, co.full_name, dg.g, t.slot, true
    FROM public.coaches co
    CROSS JOIN (VALUES ('Sat-Thu'),('Sun-Tue'),('Mon-Wed')) AS dg(g)
    CROSS JOIN (VALUES ('4:00 PM'),('5:00 PM'),('6:00 PM'),('7:00 PM')) AS t(slot)
    WHERE co.branch_id = b;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.schedule_bookings WHERE branch_id = b) THEN
    INSERT INTO public.schedule_bookings (branch_id, coach_id, coach_name, day_group, time_slot, group_type_id, group_type_name, student_name)
    SELECT b, co.id, co.full_name, 'Sat-Thu', v.slot, gt.id, gt.name, v.student
    FROM (VALUES ('4:00 PM','Layla Mostafa'),('4:00 PM','Omar Sherif'),('5:00 PM','Tia Wael')) AS v(slot, student)
    CROSS JOIN LATERAL (SELECT id, full_name FROM public.coaches WHERE branch_id = b AND full_name = 'Hager Shaheen' LIMIT 1) co
    CROSS JOIN LATERAL (SELECT id, name FROM public.group_types WHERE branch_id = b AND name = 'Group of 5' LIMIT 1) gt;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.coach_evaluations WHERE branch_id = b) THEN
    INSERT INTO public.coach_evaluations (branch_id, coach_id, coach_name, technical, communication, punctuality, students, notes, evaluated_at)
    SELECT b, co.id, co.full_name,
           (4 + (row_number() over (order by co.full_name)) % 2)::int, 4, 5,
           (4 + (row_number() over (order by co.full_name)) % 2)::int,
           CASE WHEN (row_number() over (order by co.full_name)) % 2 = 0 THEN 'Excellent rating' ELSE 'Strong technical skills' END,
           date '2026-07-03' + (row_number() over (order by co.full_name))::int
    FROM public.coaches co WHERE co.branch_id = b LIMIT 6;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.attendance WHERE branch_id = b) THEN
    INSERT INTO public.attendance (branch_id, client_id, method, checked_in_at, client_code, person_name, person_type, session_label, confirmed_at)
    SELECT b, c.id, CASE WHEN (row_number() over (order by c.client_code)) % 2 = 0 THEN 'qr' ELSE 'manual' END,
           now() - ((row_number() over (order by c.client_code)) || ' hours')::interval,
           c.client_code, c.full_name, 'trainee', '5:00 PM',
           CASE WHEN (row_number() over (order by c.client_code)) % 3 = 0 THEN now() ELSE NULL END
    FROM public.clients c WHERE c.branch_id = b LIMIT 8;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.audit_log WHERE branch_id = b) THEN
    INSERT INTO public.audit_log (branch_id, action, entity, entity_id, meta, created_at)
    SELECT b,
      CASE WHEN g % 3 = 0 THEN 'update' WHEN g % 3 = 1 THEN 'insert' ELSE 'delete' END,
      CASE WHEN g % 2 = 0 THEN 'attendance' ELSE 'payments' END,
      '#' || substr(md5(g::text), 1, 7),
      jsonb_build_object('actor','the.one.behind.kemetrise','confirmed_at', (now() - (g || ' minutes')::interval)),
      now() - (g || ' minutes')::interval
    FROM generate_series(1, 25) g;
  END IF;
END $seed$;