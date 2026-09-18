CREATE TABLE public.site_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  session_id text NOT NULL,
  path text,
  product_id uuid,
  product_name text,
  qty integer NOT NULL DEFAULT 0,
  value numeric NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'direct',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.site_events TO anon;
GRANT SELECT, INSERT ON public.site_events TO authenticated;
GRANT ALL ON public.site_events TO service_role;

ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_events public insert" ON public.site_events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "site_events admin all" ON public.site_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX site_events_created_at_idx ON public.site_events (created_at DESC);
CREATE INDEX site_events_kind_idx ON public.site_events (kind);