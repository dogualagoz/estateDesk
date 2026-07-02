-- Global arama (search.service.ts) için trigram ifade indeksleri.
--
-- Neden sarmalayıcı fonksiyonlar: PostgreSQL ifade indeksi yalnızca IMMUTABLE
-- fonksiyonlara izin verir. unaccent() ve array_to_string() STABLE işaretlidir
-- (sözlük/enum etiketi değişebilir diye); pratikte değişmedikleri için
-- IMMUTABLE sarmalayıcı standarttır. Enum etiketi değiştirilirse indeksler
-- REINDEX gerektirir (bu projede enum etiketleri sabittir).
--
-- DİKKAT: Aşağıdaki indeks ifadeleri search.service.ts'teki PORTFOLIO_DOC /
-- DEMAND_DOC ifadeleriyle BİREBİR aynı olmalıdır; aksi halde planner indeksi kullanmaz.

CREATE OR REPLACE FUNCTION f_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$ SELECT unaccent('unaccent', $1) $$;

CREATE OR REPLACE FUNCTION f_array_to_string(text[], text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$ SELECT array_to_string($1, $2) $$;

-- Enum dizisini metne çevirir (enum->text cast'i STABLE olduğundan sarmalayıcı içinde)
CREATE OR REPLACE FUNCTION f_proptypes_to_string("PropertyType"[]) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$ SELECT array_to_string($1::text[], ' ') $$;

CREATE INDEX IF NOT EXISTS "Portfolio_search_trgm_idx" ON "Portfolio"
  USING gin ((f_unaccent(lower(coalesce(title,'') || ' ' || city || ' ' || district || ' ' ||
    coalesce(neighborhood,'') || ' ' || coalesce(note,'') || ' ' || "ownerName" || ' ' ||
    "roomCount" || ' ' || f_array_to_string(features, ' ')))) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Demand_search_trgm_idx" ON "Demand"
  USING gin ((f_unaccent(lower(coalesce(note,'') || ' ' || "customerName" || ' ' ||
    f_array_to_string(regions, ' ') || ' ' || f_array_to_string("roomPreferences", ' ') || ' ' ||
    f_array_to_string("featurePrefs", ' ') || ' ' || f_proptypes_to_string(types)))) gin_trgm_ops);
