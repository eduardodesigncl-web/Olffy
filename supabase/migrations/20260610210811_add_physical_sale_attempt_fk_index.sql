create index physical_sale_attempts_physical_sale_id_idx
  on public.physical_sale_attempts (physical_sale_id)
  where physical_sale_id is not null;
