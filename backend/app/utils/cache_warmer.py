"""
Nightly Cache Warmer
====================

Runs every night between 02:00 and 05:00 (server local time).
For every (party, pdi) pair we know about, it calls the same
/api/ftr/pdi-status logic in-process so that:

  - the per-barcode pack_cache is fully populated for the day
  - the pdi_status response cache is primed
  - the per-PDI barcode cache is primed

Result: when the user opens a PDI the next morning, the response is
served instantly from cache (no per-barcode API calls to umanmrp.in).

Disable by setting env:  ENABLE_CACHE_WARMER=false
Change start hour:       CACHE_WARMER_HOUR=2   (default 2 AM)
Change cutoff hour:      CACHE_WARMER_STOP_HOUR=5 (default 5 AM)
Run once on boot:        CACHE_WARMER_RUN_ON_BOOT=true (default false)
"""
import os
import time
import threading
from datetime import datetime, timedelta

_started = False


def _seconds_until(hour: int) -> float:
    now = datetime.now()
    target = now.replace(hour=hour, minute=0, second=0, microsecond=0)
    if target <= now:
        target = target + timedelta(days=1)
    return (target - now).total_seconds()


def _warm_one_pdi(app, pdi_id: str, party_id: str) -> bool:
    """Hit /api/ftr/pdi-status in-process with force=1 to fully populate cache."""
    try:
        with app.test_client() as c:
            r = c.get(f"/api/ftr/pdi-status/{pdi_id}?party_id={party_id}&force=1")
            return r.status_code == 200
    except Exception as e:
        print(f"[CacheWarmer] pdi {pdi_id}/{party_id} failed: {e}")
        return False


def _run_warm_cycle(app, is_boot_run: bool = False):
    """One full warm pass — bounded to stop_hour."""
    from app.utils import http_client
    from app.utils import disk_cache
    from app.routes.ftr_routes import _load_parties_pdi_disk_cache, pdi_status

    http = http_client.http
    stop_hour = int(os.environ.get('CACHE_WARMER_STOP_HOUR', '5'))

    # Compute absolute cutoff time (today's stop_hour, or tomorrow's if already past)
    now_dt = datetime.now()
    cutoff_dt = now_dt.replace(hour=stop_hour, minute=0, second=0, microsecond=0)
    if cutoff_dt <= now_dt:
        cutoff_dt = cutoff_dt + timedelta(days=1)
    stop_at = cutoff_dt.timestamp()
    if is_boot_run:
        # Manual/boot-triggered warmup should not run for nearly 24h when
        # started after the nightly cutoff window.
        boot_max_seconds = int(os.environ.get('CACHE_WARMER_BOOT_MAX_SECONDS', '10800'))
        stop_at = min(stop_at, time.time() + boot_max_seconds)

        print(f"[CacheWarmer] === starting nightly warm-up at {now_dt.strftime('%H:%M:%S')} "
            f"(cutoff {datetime.fromtimestamp(stop_at).strftime('%H:%M')}) ===")
    t0 = time.time()

    parties_data = _load_parties_pdi_disk_cache()
    if not parties_data or not parties_data.get('data'):
        print("[CacheWarmer] no parties_with_pdis disk cache yet — skipping this cycle")
        return

    parties = parties_data['data']
    print(f"[CacheWarmer] {len(parties)} parties to walk")

    warmed = 0
    failed = 0
    checkpoints = 0
    for party in parties:
        if time.time() > stop_at:
            print(f"[CacheWarmer] hit {stop_hour}:00 cutoff, stopping early")
            break
        party_id = party.get('id')
        party_name = party.get('companyName', '')
        if not party_id:
            continue
        try:
            r = http.post(
                'https://umanmrp.in/get/get_all_pdi.php',
                json={"party_name_id": party_id},
                timeout=20,
            )
            d = r.json() if r.status_code == 200 else {}
            pdis = d.get('data') if d.get('status') == 'success' else []
            if not isinstance(pdis, list) or not pdis:
                continue
            print(f"[CacheWarmer] {party_name}: {len(pdis)} PDI(s)")
            for p in pdis:
                if time.time() > stop_at:
                    break
                pdi_id = p.get('id') or p.get('pdi_id')
                if not pdi_id:
                    continue
                ok = _warm_one_pdi(app, str(pdi_id), str(party_id))
                if ok:
                    warmed += 1
                else:
                    failed += 1
                total_done = warmed + failed
                if total_done % 10 == 0:
                    # Persist checkpoints so file size grows during run and
                    # progress survives crashes/restarts.
                    try:
                        pack_cache = getattr(pdi_status, '_pack_cache', None)
                        if pack_cache is not None:
                            disk_cache.save_pack_cache(pack_cache)
                            checkpoints += 1
                            print(
                                f"[CacheWarmer] progress: done={total_done} "
                                f"(ok={warmed}, fail={failed}), "
                                f"pack_cache={len(pack_cache)} entries"
                            )
                    except Exception as e:
                        print(f"[CacheWarmer] checkpoint persist failed: {e}")
                # Tiny breather so we don't pin the upstream MRP API.
                time.sleep(0.3)
        except Exception as e:
            print(f"[CacheWarmer] party {party_name} failed: {e}")
            failed += 1

    mins = (time.time() - t0) / 60
    print(f"[CacheWarmer] === done: warmed={warmed}, failed={failed}, "
          f"elapsed={mins:.1f} min, checkpoints={checkpoints} ===")
    # Flush pack_cache to disk so the populated state survives any restart.
    try:
        pack_cache = getattr(pdi_status, '_pack_cache', None)
        if pack_cache is not None:
            disk_cache.save_pack_cache(pack_cache)
            print(f"[CacheWarmer] persisted {len(pack_cache)} pack entries to disk")
    except Exception as e:
        print(f"[CacheWarmer] persist failed: {e}")


def _warm_loop(app):
    start_hour = int(os.environ.get('CACHE_WARMER_HOUR', '2'))
    run_on_boot = os.environ.get('CACHE_WARMER_RUN_ON_BOOT', 'false').lower() in ('1', 'true', 'yes')

    # Optional: run once shortly after boot (useful for first deploy / testing).
    if run_on_boot:
        time.sleep(60)
        try:
            _run_warm_cycle(app, is_boot_run=True)
        except Exception as e:
            print(f"[CacheWarmer] boot run failed: {e}")

    while True:
        try:
            wait = _seconds_until(start_hour)
            print(f"[CacheWarmer] sleeping {wait/3600:.2f}h until next {start_hour:02d}:00")
            time.sleep(wait)
            _run_warm_cycle(app)
        except Exception as e:
            print(f"[CacheWarmer] loop error: {e}")
            time.sleep(600)  # back off 10 min then retry


def _refresh_pending_loop(app):
    """Every 30 min, re-check ONLY the cached 'pending' barcodes.
    These are the ones that might have flipped to 'packed' since last check.
    Packed/dispatched entries are terminal and never need re-checking.

    This keeps daytime data fresh without hammering the upstream API for
    barcodes whose state is already known.
    """
    from app.utils import http_client
    from app.routes.ftr_routes import pdi_status
    from concurrent.futures import ThreadPoolExecutor, as_completed
    http = http_client.http
    interval = int(os.environ.get('PENDING_REFRESH_INTERVAL', '1800'))  # 30 min

    # Wait one interval before first run so app finishes booting.
    time.sleep(interval)

    while True:
        try:
            pack_cache = getattr(pdi_status, '_pack_cache', None)
            if not pack_cache:
                time.sleep(interval)
                continue
            now = time.time()
            # Only re-check entries currently marked 'pending'.
            pending_serials = [s for s, e in pack_cache.items() if e.get('status') == 'pending']
            if not pending_serials:
                time.sleep(interval)
                continue

            print(f"[CacheWarmer] incremental refresh: {len(pending_serials)} pending barcodes")
            t0 = time.time()
            flipped = 0

            def _check(serial):
                try:
                    r = http.post(
                        'https://umanmrp.in/api/get_barcode_tracking.php',
                        data={'barcode': serial}, timeout=8,
                    )
                    if r.status_code != 200:
                        return None
                    d = r.json()
                    if not d.get('success') or not d.get('data'):
                        return ('pending', None)
                    pack = (d['data'] or {}).get('packing') or {}
                    if pack.get('packing_date'):
                        return ('packed', {
                            'packing_date': pack.get('packing_date'),
                            'box_no': pack.get('box_no', ''),
                            'pallet_no': pack.get('pallet_no', '')
                        })
                    return ('pending', None)
                except Exception:
                    return None

            with ThreadPoolExecutor(max_workers=15) as ex:
                futures = {ex.submit(_check, s): s for s in pending_serials}
                for f in as_completed(futures):
                    s = futures[f]
                    res = f.result()
                    if not res:
                        continue
                    status, info = res
                    if status == 'packed':
                        pack_cache[s] = {'t': now, 'status': 'packed', 'info': info}
                        flipped += 1
                    else:
                        # still pending, but bump timestamp so it stays fresh
                        pack_cache[s] = {'t': now, 'status': 'pending'}

            # If any flipped, blow away the response-cache so the next user
            # request rebuilds the summary with the new packed counts.
            if flipped:
                resp_cache = getattr(pdi_status, '_cache', None)
                if resp_cache:
                    resp_cache.clear()
                print(f"[CacheWarmer] incremental: {flipped} pending->packed in {(time.time()-t0):.1f}s, response cache cleared")
            else:
                print(f"[CacheWarmer] incremental: no changes ({(time.time()-t0):.1f}s)")
            # Persist after every cycle
            try:
                from app.utils import disk_cache
                disk_cache.save_pack_cache(pack_cache)
            except Exception:
                pass
        except Exception as e:
            print(f"[CacheWarmer] incremental loop error: {e}")
        time.sleep(interval)


def start_warmer(app):
    global _started
    if _started:
        return
    enabled = os.environ.get('ENABLE_CACHE_WARMER', 'true').lower() in ('1', 'true', 'yes')
    if not enabled:
        print("[CacheWarmer] disabled (ENABLE_CACHE_WARMER=false)")
        return
    _started = True
    # Nightly full warm-up
    t = threading.Thread(target=_warm_loop, args=(app,), daemon=True, name='CacheWarmer')
    t.start()
    # Daytime incremental refresh of pending barcodes
    t2 = threading.Thread(target=_refresh_pending_loop, args=(app,), daemon=True, name='CacheWarmerIncremental')
    t2.start()
    hour = int(os.environ.get('CACHE_WARMER_HOUR', '2'))
    interval = int(os.environ.get('PENDING_REFRESH_INTERVAL', '1800'))
    print(f"[CacheWarmer] started — full nightly at {hour:02d}:00, incremental every {interval//60} min")
