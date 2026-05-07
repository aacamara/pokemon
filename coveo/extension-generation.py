# Indexing Pipeline Extension: derive @pokemongeneration from National Pokédex No.
#
# Apply this extension to the `pokedex-full` source on the
# *Document Enrichment* phase, after the web-scraping metadata is attached.
#
# The web-scraping config writes the National No. (e.g. "0001") into
# `pokemon_natdex`. This script parses that integer, finds the matching
# generation range, and writes `pokemongeneration` (1..9).
#
# Coveo IPE runtime exposes the magic global `document` with .get_meta_data_value
# and .add_meta_data; see https://docs.coveo.com/en/2477/ for reference.

import re

GEN_RANGES = [
    (1,    151, 1),
    (152,  251, 2),
    (252,  386, 3),
    (387,  493, 4),
    (494,  649, 5),
    (650,  721, 6),
    (722,  809, 7),
    (810,  905, 8),
    (906, 1025, 9),
]


def _parse_natdex(value):
    if not value:
        return None
    match = re.search(r"\d+", str(value))
    if not match:
        return None
    try:
        return int(match.group(0))
    except (TypeError, ValueError):
        return None


natdex_meta = document.get_meta_data_value("pokemon_natdex") or []
natdex_value = _parse_natdex(natdex_meta[0] if natdex_meta else None)

if natdex_value is not None:
    for low, high, gen in GEN_RANGES:
        if low <= natdex_value <= high:
            document.add_meta_data({"pokemongeneration": str(gen)})
            break

# Mirror canonical fields onto the lower-cased Coveo field names so the search
# UI can rely on @pokemonname / @pokemonimage etc. without case juggling.
for src, dst in (
    ("pokemon_name", "pokemonname"),
    ("pokemon_natdex", "pokemonnatdex"),
    ("pokemon_image", "pokemonimage"),
    ("pokemon_species", "pokemonspecies"),
    ("pokemon_height", "pokemonheight"),
    ("pokemon_weight", "pokemonweight"),
):
    val = document.get_meta_data_value(src)
    if val:
        document.add_meta_data({dst: val[0]})

# Multi-value fields are joined with semicolons so the field's
# multiValueFacetTokenizers=";" rule splits them into proper facet values.
for src, dst in (("pokemon_types", "pokemontypes"), ("pokemon_abilities", "pokemonabilities")):
    vals = document.get_meta_data_value(src) or []
    cleaned = [v.strip() for v in vals if v and v.strip()]
    if cleaned:
        document.add_meta_data({dst: ";".join(cleaned)})
