"""
test_phishing.py
----------------
End-to-end integration tests for POST /api/v1/phishing/analyze
Run from the backend/ directory:
    python test_phishing.py
"""
import json
import sys
import urllib.request

BASE = "http://127.0.0.1:8000/api/v1/phishing/analyze"
PASS_COUNT = 0
FAIL_COUNT = 0


def post(payload: dict) -> dict:
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        BASE,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())


def check(label: str, payload: dict, expect_names=None, expect_empty=False):
    global PASS_COUNT, FAIL_COUNT
    try:
        res = post(payload)
        names = [i["name"] for i in res["indicators"]]
        if expect_empty:
            ok = len(names) == 0
        elif expect_names:
            ok = any(n in names for n in expect_names)
        else:
            ok = True
        status = "PASS" if ok else "FAIL"
        if ok:
            PASS_COUNT += 1
        else:
            FAIL_COUNT += 1
        print(f"[{status}] {label}")
        print(f"       risk={res['risk_level']} | count={res['indicator_count']}")
        print(f"       indicators={names}")
    except Exception as exc:
        FAIL_COUNT += 1
        print(f"[FAIL] {label} => EXCEPTION: {exc}")
    print()


# ── Tests ─────────────────────────────────────────────────────────────────────

# Test 1 – Normal email, no indicators expected
check(
    "T1: Normal email — no indicators",
    {
        "sender": "alice@example.com",
        "receiver": "bob@example.com",
        "subject": "Meeting tomorrow",
        "body_text": "Hi Bob, see you at 9am.",
        "urls": [],
        "attachments": [],
        "headers": {},
        "message_id": "<abc@example.com>",
        "date": "Thu, 31 Jul 2026 10:00:00 +0000",
        "mime_version": "1.0",
        "return_path": "alice@example.com",
    },
    expect_empty=True,
)

# Test 2 – Urgency language in subject
check(
    "T2: Urgency language — Act now in subject",
    {
        "sender": "x@evil.com",
        "subject": "Act now! Verify your account immediately",
        "body_text": "Click here immediately.",
        "urls": [],
        "attachments": [],
        "headers": {},
    },
    expect_names=["Urgency Language"],
)

# Test 3 – URL shortener (bit.ly)
check(
    "T3: Shortened URL — bit.ly detected",
    {
        "sender": "x@evil.com",
        "subject": "Check this out",
        "body_text": "Visit us today.",
        "urls": ["http://bit.ly/abcd1234"],
        "attachments": [],
        "headers": {},
    },
    expect_names=["Shortened URL"],
)

# Test 4 – HTTP (non-HTTPS) URL
check(
    "T4: Insecure HTTP URL",
    {
        "sender": "x@evil.com",
        "subject": "Hello",
        "body_text": "Click the link.",
        "urls": ["http://example.com/login"],
        "attachments": [],
        "headers": {},
    },
    expect_names=["Insecure URL (HTTP)"],
)

# Test 5 – Reply-To domain mismatch
check(
    "T5: Reply-To mismatch",
    {
        "sender": "support@paypal.com",
        "reply_to": "attacker@evil.com",
        "subject": "Your account needs verification",
        "body_text": "Please verify.",
        "urls": [],
        "attachments": [],
        "headers": {},
    },
    expect_names=["Reply-To Domain Mismatch"],
)

# Test 6 – SPF Fail header
check(
    "T6: SPF Failure — High severity",
    {
        "sender": "spoofer@example.com",
        "subject": "Important update",
        "body_text": "",
        "urls": [],
        "attachments": [],
        "headers": {"Received-SPF": "fail (domain of example.com does not designate ...)"},
    },
    expect_names=["SPF Failure"],
)

# Test 7 – More than 3 URLs
check(
    "T7: Excessive links (>3 URLs)",
    {
        "sender": "x@evil.com",
        "subject": "Deals",
        "body_text": "",
        "urls": [
            "https://a.com",
            "https://b.com",
            "https://c.com",
            "https://d.com",
        ],
        "attachments": [],
        "headers": {},
    },
    expect_names=["Excessive Links"],
)

# Test 8 – Dangerous attachment (.exe)
check(
    "T8: Dangerous attachment (.exe)",
    {
        "sender": "x@evil.com",
        "subject": "Your invoice",
        "body_text": "Please find attached.",
        "urls": [],
        "attachments": [
            {"filename": "invoice.exe", "extension": ".exe", "size": 40960}
        ],
        "headers": {},
    },
    expect_names=["Dangerous Attachment"],
)

# ── Summary ───────────────────────────────────────────────────────────────────
print("=" * 50)
print(f"Results: {PASS_COUNT} PASSED, {FAIL_COUNT} FAILED")
if FAIL_COUNT > 0:
    sys.exit(1)
