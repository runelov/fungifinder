#!/usr/bin/env python3
"""
etl_akershus_ostfold.py

Beriker de kuraterte lokasjonene i data/locations.json (for fylkene Akershus og
Østfold) med sanntidsdata fra åpne norske kilder:

  - NIBIO SR16 (WMS GetFeatureInfo)         -> treslag, bestandsalder
  - NIBIO SR16 beta (WMS GetFeatureInfo)     -> satellittdetektert hogstår
  - NGU berggrunn (WMS GetFeatureInfo)       -> berggrunnstype (kalkinnhold)
  - NVDB API v4                              -> avstand til nærmeste kjørbare vei
  - Artsdatabanken Artskart (REST API)       -> antall kjente artsfunn nær punktet

Designvalg for pilotversjonen:
  - Vi beriker EKSISTERENDE punkter (samme koordinater som i appen), fremfor å
    oppdage nye kandidatsteder automatisk. Automatisk oppdagelse av nye steder
    (basert på hele SR16-polygon-datasettet) er en senere fase.
  - Skriptet er idempotent: det kan kjøres på nytt når som helst og vil bare
    overskrive feltene det faktisk har hentet ny informasjon om.
  - Feilhåndtering er bevisst "myk": hvis ett kall feiler (f.eks. midlertidig
    nede, endret respons-skjema), beholdes forrige verdi og skriptet fortsetter
    med neste lokasjon/kilde, i stedet for å stoppe hele jobben.

VIKTIG FØR FØRSTE KJØRING:
  Endepunktene og feltnavnene under er satt opp basert på offentlig
  dokumentasjon, men er IKKE testet fra dette utviklingsmiljøet (ingen
  nettverkstilgang i sandkassen appen ble bygget i). Kjør skriptet manuelt
  første gang (`python scripts/etl_akershus_ostfold.py`) og se over
  `data/locations.json` etterpå — det er sannsynlig at enkelte feltnavn i
  GetFeatureInfo-responsene (merket med "# VERIFISER" under) må justeres etter
  en titt på den faktiske XML/JSON-responsen fra hver tjeneste.
"""

import json
import math
import sys
import time
from pathlib import Path

import requests

DATA_PATH = Path(__file__).parent.parent / "data" / "locations.json"
PILOT_FYLKER = {"Akershus", "Østfold"}

SR16_WMS = "https://wms.nibio.no/cgi-bin/sr16"
SR16_BETA_WMS = "https://wms.nibio.no/cgi-bin/sr16_beta"
NGU_WMS = "https://geo.ngu.no/geoserver/bedrock/wms"  # VERIFISER: eksakt workspace/lagnavn for berggrunn
NVDB_API = "https://nvdbapiles-v4.atlas.vegvesen.no"
ARTSKART_API = "https://artskart.artsdatabanken.no/publicapi"

SPECIES_SCIENTIFIC_NAMES = {
    "kantarell": "Cantharellus cibarius",
    "traktkantarell": "Craterellus tubaeformis",
    "trompetsopp": "Craterellus cornucopioides",
    "steinsopp": "Boletus edulis",
    "matriske": "Lactarius deliciosus",
    "piggsopp": "Hydnum repandum",
    "faresopp": "Albatrellus ovinus",
    "parasollsopp": "Macrolepiota procera",
    "sjampinjong": "Agaricus campestris",
}

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "FungiFinder-ETL/0.1 (personlig prosjekt)"})


def wms_get_feature_info(base_url, layer, lat, lon, extra_params=None):
    """Gjør et WMS GetFeatureInfo-kall for ett punkt og returnerer parset JSON/tekst."""
    # Liten bbox rundt punktet, 3x3 piksler, spør om senterpikselen (1,1)
    d = 0.0005
    bbox = f"{lon-d},{lat-d},{lon+d},{lat+d}"
    params = {
        "SERVICE": "WMS",
        "VERSION": "1.3.0",
        "REQUEST": "GetFeatureInfo",
        "LAYERS": layer,
        "QUERY_LAYERS": layer,
        "CRS": "EPSG:4326",
        "BBOX": bbox,
        "WIDTH": 3,
        "HEIGHT": 3,
        "I": 1,
        "J": 1,
        "INFO_FORMAT": "application/json",
    }
    if extra_params:
        params.update(extra_params)
    resp = SESSION.get(base_url, params=params, timeout=20)
    resp.raise_for_status()
    try:
        return resp.json()
    except ValueError:
        return {"_raw_text": resp.text}


def fetch_sr16(lat, lon):
    """Henter treslag og bestandsalder fra NIBIO SR16."""
    try:
        data = wms_get_feature_info(SR16_WMS, "SRVTRESLAG", lat, lon)  # VERIFISER lagnavn
        feats = data.get("features", [])
        if not feats:
            return None
        props = feats[0]["properties"]
        # VERIFISER: faktiske feltnavn i responsen, juster mapping under
        treslag_kode = props.get("srvtreslag") or props.get("TRESLAG")
        alder = props.get("srvalder") or props.get("ALDER")
        treslag_map = {1: "gran", 2: "furu", 3: "bjork"}  # VERIFISER kodeverk
        treslag = [treslag_map.get(treslag_kode, "ukjent")] if treslag_kode else None
        skogalder = None
        if alder is not None:
            skogalder = "ung" if alder < 40 else "middels" if alder < 80 else "gammel"
        return {"treslag": treslag, "skogalder": skogalder}
    except Exception as e:
        print(f"  [SR16] feil for ({lat},{lon}): {e}", file=sys.stderr)
        return None


def fetch_hogstar(lat, lon):
    """Henter satellittdetektert hogstår fra NIBIO SR16 beta."""
    try:
        data = wms_get_feature_info(SR16_BETA_WMS, "SRRHOGSTAARbeta", lat, lon)  # VERIFISER lagnavn
        feats = data.get("features", [])
        if not feats:
            return None
        props = feats[0]["properties"]
        year = props.get("hogstaar") or props.get("AAR")  # VERIFISER feltnavn
        return int(year) if year else None
    except Exception as e:
        print(f"  [SR16-hogst] feil for ({lat},{lon}): {e}", file=sys.stderr)
        return None


def fetch_berggrunn(lat, lon):
    """Henter berggrunnstype fra NGU, forenklet til fattig/moderat/rik."""
    try:
        data = wms_get_feature_info(NGU_WMS, "berggrunn_N250", lat, lon)  # VERIFISER lagnavn
        feats = data.get("features", [])
        if not feats:
            return None
        props = feats[0]["properties"]
        bergart = (props.get("bergart") or props.get("NAVN") or "").lower()  # VERIFISER feltnavn
        if any(k in bergart for k in ["kalkstein", "marmor", "kalkspatmarmor"]):
            return "rik"
        if any(k in bergart for k in ["skifer", "fyllitt"]):
            return "moderat"
        return "fattig"
    except Exception as e:
        print(f"  [NGU] feil for ({lat},{lon}): {e}", file=sys.stderr)
        return None


def fetch_nearest_road_distance_m(lat, lon):
    """
    Finner avstand til nærmeste vegnett-segment via NVDB API v4.
    NVDB dekker riks-/fylkes-/kommunale veger OG skogsbilveger/private veger,
    som er nyttig for adkomst-vurderingen.
    """
    try:
        # VERIFISER: eksakt sti og parameterformat i NVDB API v4 for "nærmeste vegnett"
        resp = SESSION.get(
            f"{NVDB_API}/vegnett/veglenkesekvenser/segmentert",
            params={"kartutsnitt": f"{lon-0.01},{lat-0.01},{lon+0.01},{lat+0.01}", "srid": 4326},
            headers={"Accept": "application/vnd.vegvesen.nvdb-v4+json"},
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json()
        objekter = data.get("objekter", [])
        if not objekter:
            return None
        # Grov tilnærming: avstand til geometrisk senter av nærmeste objekt.
        # En mer presis punkt-til-linje-beregning bør gjøres med shapely i en senere versjon.
        best = None
        for obj in objekter:
            geom = obj.get("geometri", {}).get("wkt", "")
            # enkel WKT-parsing av første koordinatpar i LINESTRING
            if "LINESTRING" in geom:
                coords_txt = geom.split("(")[1].split(")")[0]
                first_pair = coords_txt.split(",")[0].strip().split(" ")
                glon, glat = float(first_pair[0]), float(first_pair[1])
                dist = haversine_m(lat, lon, glat, glon)
                if best is None or dist < best:
                    best = dist
        return round(best) if best is not None else None
    except Exception as e:
        print(f"  [NVDB] feil for ({lat},{lon}): {e}", file=sys.stderr)
        return None


def haversine_m(lat1, lon1, lat2, lon2):
    R = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


def fetch_artskart_hits(lat, lon, radius_m=3000, years_back=15):
    """
    Sjekker Artsdatabanken Artskart for kjente funn av våre arter nær punktet.
    Returnerer liste over arts-ID-er (vårt interne id-system) som har treff.
    """
    hits = []
    for our_id, scientific_name in SPECIES_SCIENTIFIC_NAMES.items():
        try:
            # VERIFISER: eksakt sti/parametre i Artskart sitt public API
            # (se swagger: artskart.artsdatabanken.no/publicapi/swagger)
            resp = SESSION.get(
                f"{ARTSKART_API}/api/v1/Sighting/Search",
                params={
                    "SearchString": scientific_name,
                    "Latitude": lat,
                    "Longitude": lon,
                    "Radius": radius_m,
                },
                timeout=20,
            )
            if resp.status_code != 200:
                continue
            data = resp.json()
            count = data.get("totalCount", 0) if isinstance(data, dict) else 0
            if count > 0:
                hits.append(our_id)
        except Exception as e:
            print(f"  [Artskart] feil for {scientific_name} @ ({lat},{lon}): {e}", file=sys.stderr)
        time.sleep(0.3)  # vær grei mot APIet
    return hits


def enrich_location(loc):
    lat, lon = loc["lat"], loc["lon"]
    print(f"Beriker: {loc['name']} ({lat}, {lon})")

    sr16 = fetch_sr16(lat, lon)
    if sr16:
        if sr16.get("treslag"):
            loc["treslag"] = sr16["treslag"]
        if sr16.get("skogalder"):
            loc["skogalder"] = sr16["skogalder"]

    hogstar = fetch_hogstar(lat, lon)
    if hogstar:
        loc["hogstAr"] = hogstar

    berggrunn = fetch_berggrunn(lat, lon)
    if berggrunn:
        loc["berggrunn"] = berggrunn

    avstand = fetch_nearest_road_distance_m(lat, lon)
    if avstand is not None:
        loc["avstandVeiM"] = avstand
        loc["kjorbarVei"] = "ja" if avstand < 3000 else loc.get("kjorbarVei", "ukjent")

    kjente = fetch_artskart_hits(lat, lon)
    if kjente:
        loc["kjenteFunn"] = sorted(set(loc.get("kjenteFunn", []) + kjente))

    loc["sistOppdatert"] = time.strftime("%Y-%m-%d")
    return loc


def main():
    with open(DATA_PATH, encoding="utf-8") as f:
        locations = json.load(f)

    updated = 0
    for loc in locations:
        if loc.get("fylke") in PILOT_FYLKER and not loc.get("custom"):
            enrich_location(loc)
            updated += 1

    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(locations, f, ensure_ascii=False, indent=2)

    print(f"\nFerdig. Oppdaterte {updated} lokasjoner i {DATA_PATH}.")


if __name__ == "__main__":
    main()
