CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text,
  discount_type text NOT NULL DEFAULT 'percent',
  value numeric NOT NULL DEFAULT 0,
  min_value numeric NOT NULL DEFAULT 0,
  max_discount numeric,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  used_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.coupons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupons public read" ON public.coupons FOR SELECT TO anon USING (active);
CREATE POLICY "coupons admin all" ON public.coupons FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER coupons_set_updated_at BEFORE UPDATE ON public.coupons
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.enquiries
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0;

INSERT INTO public.coupons (code, label, discount_type, value, min_value, max_discount)
VALUES
  ('DIWALI10', '10% off on enquiries above ₹2,000', 'percent', 10, 2000, 1500),
  ('FIRST250', '₹250 off your first enquiry above ₹1,500', 'flat', 250, 1500, NULL);