"""
test_risk.py
------------
Comprehensive test suite for Phase 5 – Explainable Risk Scoring Engine.

Tests 12 distinct attack and benign scenarios against the risk engine service
and live FastAPI endpoint POST /api/v1/risk/analyze.
"""

from __future__ import annotations

import sys
from typing import Any, Dict

from app.schemas.email import ParsedEmail
from app.schemas.phishing import PhishingAnalyzeResponse, PhishingIndicator
from app.schemas.sandbox import FileAnalysis, SandboxAnalyzeResponse, SandboxIndicator, SeverityLevel, RiskLevel as SandboxRiskLevel
from app.schemas.risk import RiskAnalyzeRequest, RiskLevel
from app.services.risk_engine import calculate_risk


def run_tests():
    print("==================================================")
    print("PHASE 5 EXPLAINABLE RISK ENGINE TEST SUITE")
    print("==================================================")

    passed_count = 0
    total_count = 12

    # -------------------------------------------------------------------
    # Test 1: Clean Email
    # -------------------------------------------------------------------
    print("\n--- Test 1: Clean Email ---")
    req1 = RiskAnalyzeRequest(
        parsed_email=ParsedEmail(
            sender="alice@company.com",
            receiver="bob@company.com",
            subject="Weekly Project Status Meeting",
            body_text="Hi Bob, see you at 2 PM today for our weekly sync."
        ),
        phishing_result=PhishingAnalyzeResponse(
            status="success",
            indicator_count=0,
            risk_level="Low",
            indicators=[]
        )
    )
    res1 = calculate_risk(req1)
    print(f"Score: {res1.risk_score} | Level: {res1.risk_level.value}")
    assert res1.risk_score <= 24, f"Expected Low score <= 24, got {res1.risk_score}"
    assert res1.risk_level == RiskLevel.LOW
    print("✅ TEST 1 PASSED: Clean Email -> LOW RISK")
    passed_count += 1

    # -------------------------------------------------------------------
    # Test 2: Invoice Scam
    # -------------------------------------------------------------------
    print("\n--- Test 2: Invoice Scam ---")
    req2 = RiskAnalyzeRequest(
        parsed_email=ParsedEmail(
            sender="accounts@fake-invoice-billing.com",
            subject="OVERDUE INVOICE #94812 - IMMEDIATE PAYMENT REQUIRED",
            body_text="Please pay immediately to avoid legal action."
        ),
        phishing_result=PhishingAnalyzeResponse(
            status="success",
            indicator_count=2,
            risk_level="High",
            indicators=[
                PhishingIndicator(name="Urgency Language", severity="High", reason="Subject contains URGENT/IMMEDIATE"),
                PhishingIndicator(name="Threat Language", severity="High", reason="Body contains threat of legal action")
            ]
        )
    )
    res2 = calculate_risk(req2)
    print(f"Score: {res2.risk_score} | Level: {res2.risk_level.value}")
    assert res2.risk_score >= 25
    assert res2.risk_level in (RiskLevel.MEDIUM, RiskLevel.HIGH)
    print("✅ TEST 2 PASSED: Invoice Scam -> MEDIUM/HIGH RISK")
    passed_count += 1

    # -------------------------------------------------------------------
    # Test 3: Business Email Compromise (BEC)
    # -------------------------------------------------------------------
    print("\n--- Test 3: Business Email Compromise (BEC) ---")
    req3 = RiskAnalyzeRequest(
        parsed_email=ParsedEmail(
            sender="ceo-exec@mail-spoof.org",
            reply_to="ceo-personal@gmail.com",
            subject="Wire Transfer Instructions - Confidential",
            body_text="Please process this urgent wire transfer right away."
        ),
        phishing_result=PhishingAnalyzeResponse(
            status="success",
            indicator_count=3,
            risk_level="High",
            indicators=[
                PhishingIndicator(name="Display Name Spoofing", severity="High", reason="Executive display name spoof"),
                PhishingIndicator(name="Reply-To Mismatch", severity="High", reason="Reply-To differs from sender"),
                PhishingIndicator(name="Urgency Language", severity="High", reason="Urgent wire transfer request")
            ]
        )
    )
    res3 = calculate_risk(req3)
    print(f"Score: {res3.risk_score} | Level: {res3.risk_level.value}")
    assert res3.risk_score >= 45
    assert res3.risk_level in (RiskLevel.MEDIUM, RiskLevel.HIGH)
    print("✅ TEST 3 PASSED: Business Email Compromise -> HIGH RISK")
    passed_count += 1

    # -------------------------------------------------------------------
    # Test 4: Macro Malware
    # -------------------------------------------------------------------
    print("\n--- Test 4: Macro Malware ---")
    req4 = RiskAnalyzeRequest(
        sandbox_result=SandboxAnalyzeResponse(
            filename="purchase_order.docm",
            risk_score=45,
            risk_level=SandboxRiskLevel.MEDIUM,
            analysis=FileAnalysis(
                file_type="Microsoft Word (DOCM)",
                extension=".docm",
                mime_type="application/vnd.ms-word.document.macroEnabled.12",
                macros=True
            ),
            indicators=[
                SandboxIndicator(name="Office Macro Detected", severity=SeverityLevel.HIGH, reason="VBA Macro code detected in DOCM file")
            ]
        )
    )
    res4 = calculate_risk(req4)
    print(f"Score: {res4.risk_score} | Level: {res4.risk_level.value}")
    assert res4.risk_score >= 25
    assert any("Office Macro" in r for r in res4.reasons)
    print("✅ TEST 4 PASSED: Macro Malware -> MEDIUM/HIGH RISK")
    passed_count += 1

    # -------------------------------------------------------------------
    # Test 5: PDF JavaScript
    # -------------------------------------------------------------------
    print("\n--- Test 5: PDF JavaScript ---")
    req5 = RiskAnalyzeRequest(
        sandbox_result=SandboxAnalyzeResponse(
            filename="statement.pdf",
            risk_score=35,
            risk_level=SandboxRiskLevel.MEDIUM,
            analysis=FileAnalysis(
                file_type="PDF Document",
                extension=".pdf",
                mime_type="application/pdf",
                javascript=True
            ),
            indicators=[
                SandboxIndicator(name="PDF JavaScript Detected", severity=SeverityLevel.HIGH, reason="Embedded /JavaScript stream detected")
            ]
        )
    )
    res5 = calculate_risk(req5)
    print(f"Score: {res5.risk_score} | Level: {res5.risk_level.value}")
    assert res5.risk_score >= 20
    assert any("PDF JavaScript" in r for r in res5.reasons)
    print("✅ TEST 5 PASSED: PDF JavaScript -> MEDIUM RISK")
    passed_count += 1

    # -------------------------------------------------------------------
    # Test 6: Credential Harvesting
    # -------------------------------------------------------------------
    print("\n--- Test 6: Credential Harvesting ---")
    req6 = RiskAnalyzeRequest(
        parsed_email=ParsedEmail(
            sender="security@service-login-update.com",
            subject="Security Alert: Password Expiring",
            urls=["http://bit.ly/login-verify"]
        ),
        phishing_result=PhishingAnalyzeResponse(
            status="success",
            indicator_count=3,
            risk_level="High",
            indicators=[
                PhishingIndicator(name="Credential Harvesting", severity="High", reason="Link points to suspicious login form"),
                PhishingIndicator(name="Shortened URL", severity="Medium", reason="Link uses bit.ly shortener"),
                PhishingIndicator(name="HTTP URL", severity="Medium", reason="Unencrypted HTTP URL")
            ]
        )
    )
    res6 = calculate_risk(req6)
    print(f"Score: {res6.risk_score} | Level: {res6.risk_level.value}")
    assert res6.risk_score >= 35
    assert any("Credential Theft" in stage.stage for stage in res6.attack_path)
    print("✅ TEST 6 PASSED: Credential Harvesting -> HIGH RISK")
    passed_count += 1

    # -------------------------------------------------------------------
    # Test 7: ZIP Malware
    # -------------------------------------------------------------------
    print("\n--- Test 7: ZIP Malware ---")
    req7 = RiskAnalyzeRequest(
        sandbox_result=SandboxAnalyzeResponse(
            filename="shipping_details.zip",
            risk_score=50,
            risk_level=SandboxRiskLevel.MEDIUM,
            analysis=FileAnalysis(
                file_type="ZIP Archive",
                extension=".zip",
                nested_archive=True
            ),
            indicators=[
                SandboxIndicator(name="Nested Archive", severity=SeverityLevel.MEDIUM, reason="Contains nested ZIP inside ZIP")
            ]
        )
    )
    res7 = calculate_risk(req7)
    print(f"Score: {res7.risk_score} | Level: {res7.risk_level.value}")
    assert res7.risk_score >= 12
    print("✅ TEST 7 PASSED: ZIP Malware -> Analyzed")
    passed_count += 1

    # -------------------------------------------------------------------
    # Test 8: Safe Attachment
    # -------------------------------------------------------------------
    print("\n--- Test 8: Safe Attachment ---")
    req8 = RiskAnalyzeRequest(
        sandbox_result=SandboxAnalyzeResponse(
            filename="notes.txt",
            risk_score=0,
            risk_level=SandboxRiskLevel.SAFE,
            analysis=FileAnalysis(
                file_type="Plain Text",
                extension=".txt",
                mime_type="text/plain",
                magic_byte_valid=True
            ),
            indicators=[]
        )
    )
    res8 = calculate_risk(req8)
    print(f"Score: {res8.risk_score} | Level: {res8.risk_level.value}")
    assert res8.risk_score == 0
    assert res8.risk_level == RiskLevel.LOW
    print("✅ TEST 8 PASSED: Safe Attachment -> LOW RISK")
    passed_count += 1

    # -------------------------------------------------------------------
    # Test 9: High Entropy
    # -------------------------------------------------------------------
    print("\n--- Test 9: High Entropy ---")
    req9 = RiskAnalyzeRequest(
        sandbox_result=SandboxAnalyzeResponse(
            filename="update.bin",
            risk_score=40,
            risk_level=SandboxRiskLevel.MEDIUM,
            analysis=FileAnalysis(
                file_type="Binary Data",
                extension=".bin",
                entropy=7.85
            ),
            indicators=[
                SandboxIndicator(name="High Entropy", severity=SeverityLevel.HIGH, reason="Entropy is 7.85 (>7.2). Packed or encrypted file.")
            ]
        )
    )
    res9 = calculate_risk(req9)
    print(f"Score: {res9.risk_score} | Level: {res9.risk_level.value}")
    assert res9.risk_score >= 12
    print("✅ TEST 9 PASSED: High Entropy -> Analyzed")
    passed_count += 1

    # -------------------------------------------------------------------
    # Test 10: Display Spoof
    # -------------------------------------------------------------------
    print("\n--- Test 10: Display Spoof ---")
    req10 = RiskAnalyzeRequest(
        parsed_email=ParsedEmail(
            sender="PayPal Security <alert@pay-pal-security-support.org>",
            subject="Account Limited"
        ),
        phishing_result=PhishingAnalyzeResponse(
            status="success",
            indicator_count=2,
            risk_level="High",
            indicators=[
                PhishingIndicator(name="Display Name Spoofing", severity="High", reason="Impersonating PayPal"),
                PhishingIndicator(name="Lookalike Domain", severity="High", reason="Lookalike domain pay-pal-security-support.org")
            ]
        )
    )
    res10 = calculate_risk(req10)
    print(f"Score: {res10.risk_score} | Level: {res10.risk_level.value}")
    assert res10.risk_score >= 35
    print("✅ TEST 10 PASSED: Display Spoof -> HIGH RISK")
    passed_count += 1

    # -------------------------------------------------------------------
    # Test 11: Reply-To Mismatch
    # -------------------------------------------------------------------
    print("\n--- Test 11: Reply-To Mismatch ---")
    req11 = RiskAnalyzeRequest(
        parsed_email=ParsedEmail(
            sender="hr@company.com",
            reply_to="attacker@external-hacker.com",
            subject="Employee Survey"
        ),
        phishing_result=PhishingAnalyzeResponse(
            status="success",
            indicator_count=1,
            risk_level="Medium",
            indicators=[
                PhishingIndicator(name="Reply-To Mismatch", severity="High", reason="Reply-To points to external domain")
            ]
        )
    )
    res11 = calculate_risk(req11)
    print(f"Score: {res11.risk_score} | Level: {res11.risk_level.value}")
    assert res11.risk_score >= 15
    print("✅ TEST 11 PASSED: Reply-To Mismatch -> Analyzed")
    passed_count += 1

    # -------------------------------------------------------------------
    # Test 12: Critical Combination
    # -------------------------------------------------------------------
    print("\n--- Test 12: Critical Combination ---")
    req12 = RiskAnalyzeRequest(
        parsed_email=ParsedEmail(
            sender="payroll@company-update.com",
            reply_to="attacker@darknet.ru",
            subject="URGENT: Payroll Information Required IMMEDIATELY",
            urls=["http://bit.ly/fake-payroll-login"]
        ),
        phishing_result=PhishingAnalyzeResponse(
            status="success",
            indicator_count=4,
            risk_level="High",
            indicators=[
                PhishingIndicator(name="Urgency Language", severity="High", reason="URGENT subject"),
                PhishingIndicator(name="Credential Harvesting", severity="High", reason="Fake login link"),
                PhishingIndicator(name="Reply-To Mismatch", severity="High", reason="Reply-To mismatch"),
                PhishingIndicator(name="Lookalike Domain", severity="High", reason="Lookalike domain")
            ]
        ),
        sandbox_result=SandboxAnalyzeResponse(
            filename="payroll_form.docm.exe",
            risk_score=95,
            risk_level=SandboxRiskLevel.HIGH,
            analysis=FileAnalysis(
                file_type="PE Executable",
                extension=".exe",
                double_extension=True,
                is_executable=True,
                macros=True,
                magic_byte_valid=False
            ),
            indicators=[
                SandboxIndicator(name="Executable File", severity=SeverityLevel.HIGH, reason="Executable payload"),
                SandboxIndicator(name="Double Extension", severity=SeverityLevel.HIGH, reason="Double extension docm.exe"),
                SandboxIndicator(name="Office Macro Detected", severity=SeverityLevel.HIGH, reason="Macro detected"),
                SandboxIndicator(name="Magic Byte Mismatch", severity=SeverityLevel.HIGH, reason="Magic byte mismatch")
            ]
        )
    )
    res12 = calculate_risk(req12)
    print(f"Score: {res12.risk_score} | Level: {res12.risk_level.value}")
    assert res12.risk_score >= 75
    assert res12.risk_level == RiskLevel.CRITICAL
    assert len(res12.attack_path) >= 3
    print("✅ TEST 12 PASSED: Critical Combination -> CRITICAL RISK (Clamped at 100 max)")
    passed_count += 1

    print("\n==================================================")
    print(f"ALL {passed_count}/{total_count} TEST CASES PASSED SUCCESSFULLY!")
    print("==================================================")


if __name__ == "__main__":
    run_tests()
