"""
test_e2e_all.py
---------------
Comprehensive end-to-end test script verifying all 11 backend endpoints
and database synchronization.
"""

import json
import sys
import time
import urllib.error
import urllib.request

BASE_URL = "http://127.0.0.1:8000"
PASS_COUNT = 0
FAIL_COUNT = 0


def log_test(name: str, success: bool, msg: str = ""):
    global PASS_COUNT, FAIL_COUNT
    if success:
        PASS_COUNT += 1
        print(f"[PASS] {name} | {msg}")
    else:
        FAIL_COUNT += 1
        print(f"[FAIL] {name} | {msg}")


def test_http_get(path: str):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.status, resp.headers, resp.read()


def test_http_post_json(path: str, data_dict: dict):
    url = f"{BASE_URL}{path}"
    json_bytes = json.dumps(data_dict).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=json_bytes,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))


def test_http_post_file(path: str, filename: str, content: bytes, param_name="file"):
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="{param_name}"; filename="{filename}"\r\n'
        f"Content-Type: message/rfc822\r\n\r\n"
    ).encode("utf-8") + content + f"\r\n--{boundary}--\r\n".encode("utf-8")

    req = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))


def test_http_delete(path: str):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, method="DELETE")
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))


def main():
    print("=" * 60)
    print("STARTING END-TO-END AUDIT & API VERIFICATION")
    print("=" * 60)

    # 1. Test POST /api/v1/upload/email
    sample_eml = (
        b"From: paypal-support@paypa1-security.com\r\n"
        b"To: victim@company.com\r\n"
        b"Subject: URGENT: Verify your account immediately\r\n"
        b"Date: Fri, 01 Aug 2026 12:00:00 +0000\r\n"
        b"Content-Type: text/plain; charset=utf-8\r\n\r\n"
        b"Your account is suspended. Click immediately: http://bit.ly/login-fake"
    )

    try:
        status_code, upload_res = test_http_post_file("/api/v1/upload/email", "test_phish.eml", sample_eml)
        email_id = upload_res.get("email_id")
        log_test("1. POST /api/v1/upload/email", status_code == 200 and email_id is not None, f"email_id={email_id}")
    except Exception as e:
        log_test("1. POST /api/v1/upload/email", False, str(e))
        email_id = None

    # 2. Test POST /api/v1/phishing/analyze with scan_id synchronization
    if email_id:
        try:
            parsed_email = upload_res.get("parsed_email", {})
            phish_payload = {**parsed_email, "scan_id": email_id, "email_id": email_id}
            status_code, phish_res = test_http_post_json("/api/v1/phishing/analyze", phish_payload)
            returned_scan_id = phish_res.get("scan_id")
            log_test(
                "2. POST /api/v1/phishing/analyze (Synchronized ID)",
                status_code == 200 and returned_scan_id == email_id,
                f"scan_id={returned_scan_id} indicators={phish_res.get('indicator_count')}",
            )
        except Exception as e:
            log_test("2. POST /api/v1/phishing/analyze", False, str(e))

    # 3. Test POST /api/v1/sandbox/analyze
    try:
        status_code, sandbox_res = test_http_post_file("/api/v1/sandbox/analyze", "invoice.pdf", b"%PDF-1.4 sample content with /JS")
        log_test(
            "3. POST /api/v1/sandbox/analyze",
            status_code == 200 and "risk_score" in sandbox_res,
            f"risk_score={sandbox_res.get('risk_score')} risk_level={sandbox_res.get('risk_level')}",
        )
    except Exception as e:
        log_test("3. POST /api/v1/sandbox/analyze", False, str(e))

    # 4. Test POST /api/v1/risk/analyze
    try:
        risk_req = {
            "sender": "attacker@evil.com",
            "subject": "Urgent Action Required",
            "phishing_indicators": [{"name": "Urgency", "severity": "High", "reason": "Immediate action required"}],
            "sandbox_indicators": [{"name": "High Entropy", "severity": "Medium", "reason": "Packed binary"}],
        }
        status_code, risk_res = test_http_post_json("/api/v1/risk/analyze", risk_req)
        log_test(
            "4. POST /api/v1/risk/analyze",
            status_code == 200 and "attack_path" in risk_res,
            f"risk_score={risk_res.get('risk_score')} attack_path_steps={len(risk_res.get('attack_path', []))}",
        )
    except Exception as e:
        log_test("4. POST /api/v1/risk/analyze", False, str(e))

    # 5. Test POST /api/v1/scan (Unified 1-Click Complete Scan)
    try:
        status_code, complete_scan_res = test_http_post_file("/api/v1/scan", "test_complete.eml", sample_eml)
        complete_scan_id = complete_scan_res.get("scan_id")
        log_test(
            "5. POST /api/v1/scan (Unified 1-Click)",
            status_code == 200 and complete_scan_id is not None,
            f"scan_id={complete_scan_id} saved_to_db={complete_scan_res.get('saved_to_db')}",
        )
    except Exception as e:
        log_test("5. POST /api/v1/scan", False, str(e))
        complete_scan_id = None

    # 6. Test GET /api/v1/history
    try:
        status_code, headers, body_bytes = test_http_get("/api/v1/history")
        history_res = json.loads(body_bytes.decode("utf-8"))
        log_test(
            "6. GET /api/v1/history",
            status_code == 200 and history_res.get("total", 0) > 0,
            f"total_scans={history_res.get('total')}",
        )
    except Exception as e:
        log_test("6. GET /api/v1/history", False, str(e))

    # 7. Test GET /api/v1/history/{scan_id}
    target_scan_id = email_id or complete_scan_id
    if target_scan_id:
        try:
            status_code, headers, body_bytes = test_http_get(f"/api/v1/history/{target_scan_id}")
            detail_res = json.loads(body_bytes.decode("utf-8"))
            log_test(
                f"7. GET /api/v1/history/{target_scan_id[:8]}",
                status_code == 200 and detail_res.get("scan", {}).get("scan_id") == target_scan_id,
                f"risk_level={detail_res.get('scan', {}).get('risk_level')}",
            )
        except Exception as e:
            log_test(f"7. GET /api/v1/history/{target_scan_id[:8]}", False, str(e))

    # 8. Test GET /api/v1/report/{scan_id}
    if target_scan_id:
        try:
            status_code, headers, body_bytes = test_http_get(f"/api/v1/report/{target_scan_id}")
            rep_res = json.loads(body_bytes.decode("utf-8"))
            log_test(
                f"8. GET /api/v1/report/{target_scan_id[:8]}",
                status_code == 200 and rep_res.get("scan_id") == target_scan_id,
                f"indicators_count={len(rep_res.get('indicators', []))}",
            )
        except Exception as e:
            log_test(f"8. GET /api/v1/report/{target_scan_id[:8]}", False, str(e))

    # 9. Test GET /api/v1/report/{scan_id}/json
    if target_scan_id:
        try:
            status_code, headers, body_bytes = test_http_get(f"/api/v1/report/{target_scan_id}/json")
            disp = headers.get("Content-Disposition", "")
            log_test(
                f"9. GET /api/v1/report/{target_scan_id[:8]}/json",
                status_code == 200 and "attachment" in disp,
                f"size={len(body_bytes)} bytes header='{disp}'",
            )
        except Exception as e:
            log_test(f"9. GET /api/v1/report/{target_scan_id[:8]}/json", False, str(e))

    # 10. Test GET /api/v1/report/{scan_id}/pdf
    if target_scan_id:
        try:
            status_code, headers, body_bytes = test_http_get(f"/api/v1/report/{target_scan_id}/pdf")
            disp = headers.get("Content-Disposition", "")
            log_test(
                f"10. GET /api/v1/report/{target_scan_id[:8]}/pdf",
                status_code == 200 and "attachment" in disp,
                f"size={len(body_bytes)} bytes header='{disp}'",
            )
        except Exception as e:
            log_test(f"10. GET /api/v1/report/{target_scan_id[:8]}/pdf", False, str(e))

    # 11. Test DELETE /api/v1/history/{scan_id}
    if target_scan_id:
        try:
            status_code, del_res = test_http_delete(f"/api/v1/history/{target_scan_id}")
            log_test(
                f"11. DELETE /api/v1/history/{target_scan_id[:8]}",
                status_code == 200 and del_res.get("status") == "success",
                f"msg='{del_res.get('message')[:50]}'",
            )
        except Exception as e:
            log_test(f"11. DELETE /api/v1/history/{target_scan_id[:8]}", False, str(e))

    print("=" * 60)
    print(f"VERIFICATION RESULTS: {PASS_COUNT} PASSED, {FAIL_COUNT} FAILED")
    print("=" * 60)

    if FAIL_COUNT > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
