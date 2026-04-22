"""
End-to-end PDI-status sweep test.

Goal: prove WHY same PDI sometimes returns data and sometimes doesn't.

What it does:
  1. Calls /api/ftr/parties-with-pdis -> gets every party + every PDI in MRP.
  2. For each PDI, hits /api/ftr/pdi-status/{pdi_id}?party_id={party_id}.
  3. Times every call. Records HTTP status, total_barcodes, packed, dispatched.
  4. Runs the SAME sweep TWICE (pass A then pass B) so you can compare:
       - Did a PDI return data in pass A but not in pass B?  -> upstream flake
       - Did time go DOWN in pass B?                          -> cache working
       - Did some PDI 502 in both passes?                     -> real bug
  5. Prints a side-by-side table + writes pdi_sweep_report.csv.

Usage:
    python test_all_pdi_status.py https://your-prod-domain.in
    python test_all_pdi_status.py http://localhost:5003     # local
    python test_all_pdi_status.py                            # default localhost

Optional:
    --limit 20         only test first 20 PDIs
    --party RAYS       only PDIs whose party name contains "RAYS"
    --passes 3         run 3 passes instead of 2
    --concurrency 1    sequential by default; raise to test parallel load
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

import requests

DEFAULT_BASE = "http://localhost:5003"
TIMEOUT = 90  # seconds — match nginx upper bound


def get_parties(base: str) -> list[dict]:
    url = f"{base}/api/ftr/parties-with-pdis"
    print(f"[*] GET {url}")
    t0 = time.time()
    r = requests.get(url, timeout=TIMEOUT)
    dt = time.time() - t0
    r.raise_for_status()
    data = r.json()
    parties = data.get("parties") or []
    print(f"    -> {len(parties)} parties in {dt:.2f}s "
          f"(cached={data.get('cached')}, stale={data.get('stale')})")
    return parties


def get_pdis_for_party(base: str, party_id: str) -> list[dict]:
    """POST /api/ftr/mrp-party-pdis -> [{id, pdi_name, ...}]"""
    try:
        r = requests.post(
            f"{base}/api/ftr/mrp-party-pdis",
            json={"party_name_id": party_id},
            timeout=TIMEOUT,
        )
        j = r.json()
    except Exception as e:
        print(f"    [!] mrp-party-pdis failed for {party_id}: {e}")
        return []
    return j.get("data") or []


def flatten_pdis(base: str, parties: list[dict],
                 party_filter: str | None) -> list[dict]:
    """For every party, fetch its PDI list and flatten."""
    rows = []
    for p in parties:
        pname = p.get("companyName") or p.get("name") or ""
        if party_filter and party_filter.lower() not in pname.lower():
            continue
        pid = p.get("id") or p.get("party_id") or ""
        if not pid:
            continue
        pdi_count = p.get("pdiCount") or 0
        if pdi_count == 0:
            continue
        pdis = get_pdis_for_party(base, pid)
        print(f"    {pname[:40]:<40}  pdiCount={pdi_count:>3}  fetched={len(pdis)}")
        for pdi in pdis:
            pdi_id = pdi.get("id") or pdi.get("pdi_id") or ""
            rows.append({
                "pdi_id": str(pdi_id),
                "pdi_name": pdi.get("pdi_name") or pdi.get("name") or "",
                "party_id": pid,
                "party_name": pname,
            })
    return rows


def hit_pdi_status(base: str, row: dict) -> dict:
    url = (f"{base}/api/ftr/pdi-status/"
           f"{requests.utils.quote(row['pdi_id'])}"
           f"?party_id={requests.utils.quote(row['party_id'])}")
    t0 = time.time()
    out: dict[str, Any] = {
        "pdi_id": row["pdi_id"],
        "pdi_name": row["pdi_name"],
        "party_name": row["party_name"],
        "status": None,
        "elapsed_s": 0.0,
        "total_barcodes": 0,
        "packed": 0,
        "dispatched": 0,
        "cached": None,
        "stale": None,
        "warning": "",
        "error": "",
    }
    try:
        r = requests.get(url, timeout=TIMEOUT)
        out["elapsed_s"] = round(time.time() - t0, 2)
        out["status"] = r.status_code
        try:
            j = r.json()
        except Exception:
            j = {}
        if r.status_code == 200 and isinstance(j, dict):
            summary = j.get("summary") or {}
            out["total_barcodes"] = int(summary.get("total_barcodes") or 0)
            out["packed"] = int(summary.get("total_packed")
                                or summary.get("packed") or 0)
            out["dispatched"] = int(summary.get("total_dispatched")
                                    or summary.get("dispatched") or 0)
            out["cached"] = j.get("cached")
            out["stale"] = j.get("stale")
            out["warning"] = (summary.get("warning") or "")[:120]
        else:
            out["error"] = (j.get("error") or j.get("message")
                            or r.text[:120])
    except requests.RequestException as e:
        out["elapsed_s"] = round(time.time() - t0, 2)
        out["error"] = f"{type(e).__name__}: {e}"[:120]
    return out


def run_pass(base: str, rows: list[dict], pass_no: int,
             concurrency: int) -> list[dict]:
    print(f"\n=== PASS {pass_no} — {len(rows)} PDIs, "
          f"concurrency={concurrency} ===")
    results: list[dict] = []
    if concurrency <= 1:
        for i, row in enumerate(rows, 1):
            res = hit_pdi_status(base, row)
            results.append(res)
            tag = "OK " if res["status"] == 200 else f"!{res['status']}"
            print(f"  [{i:>3}/{len(rows)}] {tag} "
                  f"{res['elapsed_s']:>5.2f}s  "
                  f"bc={res['total_barcodes']:>4} "
                  f"pk={res['packed']:>4} "
                  f"dp={res['dispatched']:>4}  "
                  f"{res['party_name'][:18]:<18} "
                  f"{res['pdi_name'][:30]}"
                  + (f"  ERR={res['error']}" if res['error'] else ""))
    else:
        with ThreadPoolExecutor(max_workers=concurrency) as ex:
            futs = {ex.submit(hit_pdi_status, base, r): r for r in rows}
            done = 0
            for fut in as_completed(futs):
                res = fut.result()
                results.append(res)
                done += 1
                tag = "OK " if res["status"] == 200 else f"!{res['status']}"
                print(f"  [{done:>3}/{len(rows)}] {tag} "
                      f"{res['elapsed_s']:>5.2f}s  "
                      f"bc={res['total_barcodes']:>4}  "
                      f"{res['pdi_name'][:30]}")
    return results


def summarize(passes: list[list[dict]]) -> None:
    print("\n" + "=" * 78)
    print("SUMMARY")
    print("=" * 78)
    for i, p in enumerate(passes, 1):
        total = len(p)
        ok = sum(1 for r in p if r["status"] == 200)
        empty = sum(1 for r in p if r["status"] == 200
                    and r["total_barcodes"] == 0)
        with_data = ok - empty
        non200 = total - ok
        avg = sum(r["elapsed_s"] for r in p) / max(total, 1)
        slow = sum(1 for r in p if r["elapsed_s"] >= 10)
        print(f"\nPass {i}:  total={total}  HTTP-200={ok}  "
              f"with-data={with_data}  empty-200={empty}  "
              f"non-200={non200}  avg={avg:.2f}s  >=10s={slow}")
        # per-status breakdown
        from collections import Counter
        c = Counter(r["status"] for r in p)
        print(f"  status codes: {dict(c)}")

    # Cross-pass consistency (only if 2+ passes)
    if len(passes) >= 2:
        a, b = passes[0], passes[1]
        a_map = {r["pdi_id"]: r for r in a}
        b_map = {r["pdi_id"]: r for r in b}
        common = set(a_map) & set(b_map)
        flaky = []
        for pid in common:
            ra, rb = a_map[pid], b_map[pid]
            data_a = ra["total_barcodes"] > 0
            data_b = rb["total_barcodes"] > 0
            ok_a = ra["status"] == 200
            ok_b = rb["status"] == 200
            if data_a != data_b or ok_a != ok_b:
                flaky.append((pid, ra, rb))
        print(f"\nFLAKY PDIs (data/status differs between passes): "
              f"{len(flaky)} of {len(common)}")
        for pid, ra, rb in flaky[:30]:
            print(f"  {ra['pdi_name'][:25]:<25} "
                  f"A: {ra['status']} bc={ra['total_barcodes']:>4} "
                  f"{ra['elapsed_s']:>5.2f}s  |  "
                  f"B: {rb['status']} bc={rb['total_barcodes']:>4} "
                  f"{rb['elapsed_s']:>5.2f}s")
        if len(flaky) > 30:
            print(f"  ... and {len(flaky) - 30} more (see CSV)")


def write_csv(passes: list[list[dict]], path: str) -> None:
    fields = ["pass", "pdi_id", "pdi_name", "party_name", "status",
              "elapsed_s", "total_barcodes", "packed", "dispatched",
              "cached", "stale", "warning", "error"]
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for i, p in enumerate(passes, 1):
            for r in p:
                row = {"pass": i}
                row.update({k: r.get(k, "") for k in fields if k != "pass"})
                w.writerow(row)
    print(f"\n[+] Wrote CSV: {path}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("base", nargs="?", default=DEFAULT_BASE,
                    help="Base URL e.g. https://yourdomain.in")
    ap.add_argument("--limit", type=int, default=0,
                    help="Limit number of PDIs (0 = all)")
    ap.add_argument("--party", default="",
                    help="Filter party name (substring, case-insensitive)")
    ap.add_argument("--passes", type=int, default=2)
    ap.add_argument("--concurrency", type=int, default=1)
    ap.add_argument("--csv", default="pdi_sweep_report.csv")
    args = ap.parse_args()

    base = args.base.rstrip("/")
    print(f"Base URL: {base}")

    try:
        parties = get_parties(base)
    except Exception as e:
        print(f"[!] failed to fetch parties: {e}")
        return 1

    rows = flatten_pdis(base, parties, args.party or None)
    if args.limit > 0:
        rows = rows[:args.limit]
    print(f"[*] testing {len(rows)} PDIs"
          + (f" (filter='{args.party}')" if args.party else ""))
    if not rows:
        print("[!] no PDIs to test")
        return 1

    all_passes = []
    for n in range(1, args.passes + 1):
        all_passes.append(run_pass(base, rows, n, args.concurrency))

    summarize(all_passes)
    write_csv(all_passes, args.csv)
    return 0


if __name__ == "__main__":
    sys.exit(main())
