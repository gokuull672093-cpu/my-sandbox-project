ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS addon_rank integer,
  ADD COLUMN IF NOT EXISTS deal_rank integer,
  ADD COLUMN IF NOT EXISTS deal_price numeric;

CREATE INDEX IF NOT EXISTS products_addon_rank_idx ON public.products (addon_rank) WHERE addon_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS products_deal_rank_idx ON public.products (deal_rank) WHERE deal_rank IS NOT NULL;