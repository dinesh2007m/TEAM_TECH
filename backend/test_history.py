"""
test_history.py
---------------
Live integration tests for the Phase 7 History API.
Run with: ..\.venv\Scripts\python.exe test_history.py
"""
import json
import sys
import time
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8000"
PASS_COUNT = 0
FAIL_COUNT = 0


def _get(path: str):
    with urllib.request.urlopen(f"{BASE}{path}", timeout=8) as r:
        return r.status, json.loads(r.read())


def _delete(path: str):
    req = urllib.request.Request(f"{BASE}{path}", method="DELETE")
    with urllib.request.urlopen(req, timeout=8) as r:
        return r.status, json.loads(r.read())


def _post(path: str, body: dict):
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        return r.status, json.loads(r.read())


def check(label: str, condition: bool, extra: str = ""):
    global PASS_COUNT, FAIL_COUNT
    if condition:
        PASS_COUNT += 1
        print(f"[PASS] {label}  {extra}")
    else:
        FAIL_COUNT += 1
        print(f"[FAIL] {label}  {extra}")


# ── T1: GET /history ──────────────────────────────────────────────────────────
try:
    s, d = _get("/api/v1/history")
    check("T1: GET /history", s == 200 and d["total"] >= 1,
          f"total={d['total']} returned={len(d['scans'])}")
except Exception as exc:
    check("T1: GET /history", False, str(exc))

# ── T2: Pagination ────────────────────────────────────────────────────────────
try:
    s, d = _get("/api/v1/history?page=1&page_size=3")
    check("T2: Pagination page_size=3", s == 200 and len(d["scans"]) == 3,
          f"returned={len(d['scans'])}")
    first_scan_id = d["scans"][0]["scan_id"]
except Exception as exc:
    check("T2: Pagination", False, str(exc))
    first_scan_id = None

# ── T3: GET /history/{scan_id} ───────────────────────────────────────────────
if first_scan_id:
    try:
        s, d2 = _get(f"/api/v1/history/{first_scan_id}")
        check("T3: GET /history/{scan_id}",
              s == 200 and "scan" in d2,
              f"risk={d2['scan']['risk_level']} indicators={d2['scan']['indicator_count']}")
    except Exception as exc:
        check("T3: GET /history/{scan_id}", False, str(exc))
else:
    check("T3: GET /history/{scan_id}", False, "skipped – no scan_id from T2")

# ── T4: 404 for unknown scan_id ───────────────────────────────────────────────
try:
    _get("/api/v1/history/this-id-does-not-exist-000")
    check("T4: 404 for unknown scan_id", False, "Expected HTTPError 404")
except urllib.error.HTTPError as e:
    check("T4: 404 for unknown scan_id", e.code == 404, f"got {e.code}")
except Exception as exc:
    check("T4: 404 for unknown scan_id", False, str(exc))

# ── T5: DELETE /history/{scan_id} ────────────────────────────────────────────
if first_scan_id:
    try:
        s, d3 = _delete(f"/api/v1/history/{first_scan_id}")
        check("T5: DELETE /history/{scan_id}", s == 200, d3.get("message", "")[:60])
    except Exception as exc:
        check("T5: DELETE /history/{scan_id}", False, str(exc))

# ── T6: Deleted record should 404 ────────────────────────────────────────────
if first_scan_id:
    try:
        _get(f"/api/v1/history/{first_scan_id}")
        check("T6: Deleted record 404", False, "Expected 404 after delete")
    except urllib.error.HTTPError as e:
        check("T6: Deleted record 404", e.code == 404, f"got {e.code}")
    except Exception as exc:
        check("T6: Deleted record 404", False, str(exc))

# ── T7: Auto-save via POST /phishing/analyze ─────────────────────────────────
try:
    s_before, d_before = _get("/api/v1/history?page_size=1")
    total_before = d_before["total"]

    _post("/api/v1/phishing/analyze", {
        "sender": "spoof@evil.tk",
        "subject": "Act now immediately!",
        "body_text": "Click here immediately or your account will be deleted.",
        "urls": ["http://bit.ly/xyzABC", "http://192.168.1.1/login"],
        "attachments": [],
        "headers": {"Received-SPF": "fail (domain of evil.tk)"},
    })

    time.sleep(1.5)  # give background task time to commit

    s_after, d_after = _get("/api/v1/history?page_size=1")
    total_after = d_after["total"]

    check("T7: Auto-save after /phishing/analyze",
          total_after > total_before,
          f"total before={total_before} after={total_after}")
except Exception as exc:
    check("T7: Auto-save after /phishing/analyze", False, str(exc))

# ── T8: Database integrity – retrieve second page ─────────────────────────────
try:
    s, d = _get("/api/v1/history?page=2&page_size=5")
    check("T8: Page 2 pagination", s == 200, f"page=2 returned={len(d['scans'])}")
except Exception as exc:
    check("T8: Page 2 pagination", False, str(exc))

# ── Summary ───────────────────────────────────────────────────────────────────
print()
print("=" * 50)
print(f"Results: {PASS_COUNT} PASSED, {FAIL_COUNT} FAILED")
if FAIL_COUNT > 0:
    sys.exit(1)
