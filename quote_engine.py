"""AI41 견적 엔진. LLM 없이 규칙으로 과업 분해 · 공수 · 금액을 나눈다."""

from __future__ import annotations

import re
from typing import Any

MD_PER_MM = 20
HOURS_PER_DAY = 8
VAT = 0.10

ROLES: dict[str, dict[str, Any]] = {
    "junior": {"label": "주니어 참여 인력", "day": 125_000, "month": 2_500_000},
    "junior_creator": {"label": "주니어 연구원/크리에이터", "day": 150_000, "month": 3_000_000},
    "mid": {"label": "미드레벨 실무자", "day": 250_000, "month": 5_000_000},
    "senior": {"label": "시니어/PM/책임연구원", "day": 500_000, "month": 10_000_000},
}

# 뉴로크래프트 2+1 패키지: 인력 월 1천만 × 3명
NEURO_PACK = {"week": 7_500_000, "biweek": 15_000_000, "month": 30_000_000}

DIFF = {"low": 0.9, "normal": 1.0, "high": 1.25}
RISK_BUFFER = 0.12
USD_KRW = 1_400
# Runway Gen-4급 안내: 5초 ≈ $0.25. 재시도가 원가를 키운다. 고객 단가의 주연이 아님.
GEN_USD_PER_5S = 0.25
GEN_RETRIES = 12

VIDEO_CUSTOMER_NOTE = (
    "AI 영상 제작비는 기획, 콘셉트 개발, 프롬프트 설계, AI 생성 및 재시도, "
    "컷 선별, 편집, 자막, 음원 적용, 검수 및 납품 정리를 포함한 과업 수행비로 산정한다. "
    "AI 생성에 필요한 토큰, 크레딧, API, 유료 구독, 라이선스, 음원, 폰트, 성우, "
    "촬영 및 외부 소스 비용은 별도 실비로 산정한다."
)

# 유형별 기본 공수(일). 기획·회의·검수·PM을 이미 포함.
TEMPLATES: dict[str, dict[str, Any]] = {
    "document": {
        "label": "문서·제안서",
        "packages": [
            {"name": "자료 조사", "role": "junior", "md": 0.8},
            {"name": "초안 작성", "role": "mid", "md": 1.5},
            {"name": "시니어 검수", "role": "senior", "md": 0.4},
            {"name": "회의·납품 정리", "role": "mid", "md": 0.4},
        ],
        "floor": 500_000,
        "missing": ["사용 목적", "분량(쪽)", "납품 형식"],
    },
    "edu_1": {
        "label": "교육 1회차 개발",
        "packages": [
            {"name": "요구사항 정리", "role": "mid", "md": 0.5},
            {"name": "커리큘럼 설계", "role": "senior", "md": 1.0},
            {"name": "교안·활동지", "role": "mid", "md": 1.5},
            {"name": "시니어 검수", "role": "senior", "md": 0.5},
            {"name": "회의·납품", "role": "mid", "md": 0.4},
        ],
        "floor": 1_500_000,
        "missing": ["대상 연령", "1회 시간", "현장/온라인"],
    },
    "edu_4w": {
        "label": "4주 교육 프로그램",
        "packages": [
            {"name": "기획·설계", "role": "senior", "md": 2.5},
            {"name": "교안 개발", "role": "mid", "md": 6.5},
            {"name": "운영안·평가지", "role": "mid", "md": 2.5},
            {"name": "검수·수정", "role": "senior", "md": 1.5},
            {"name": "PM·회의", "role": "senior", "md": 1.2},
        ],
        "floor": 5_000_000,
        "missing": ["주당 횟수", "인원", "평가 방식"],
    },
    "ai_poc": {
        "label": "AI 자동화 PoC",
        "packages": [
            {"name": "요구사항 분석", "role": "senior", "md": 1.5},
            {"name": "워크플로우 설계", "role": "mid", "md": 1.5},
            {"name": "구현·프롬프트", "role": "mid", "md": 5.0},
            {"name": "테스트·예외", "role": "mid", "md": 3.0},
            {"name": "문서·인수인계", "role": "junior_creator", "md": 1.0},
            {"name": "PM 검수", "role": "senior", "md": 1.2},
        ],
        "floor": 5_000_000,
        "missing": ["연동 시스템", "데이터 제공 여부", "유지보수 범위"],
    },
    "research": {
        "label": "연구·조사",
        "packages": [
            {"name": "연구 설계", "role": "senior", "md": 2.0},
            {"name": "문헌 조사", "role": "junior_creator", "md": 3.5},
            {"name": "도구 개발", "role": "mid", "md": 2.0},
            {"name": "정리·분석", "role": "mid", "md": 6.0},
            {"name": "보고서", "role": "senior", "md": 4.0},
            {"name": "PM·윤리 검토", "role": "senior", "md": 1.5},
        ],
        "floor": 7_000_000,
        "missing": ["표본 규모", "개인정보 여부", "납품 형식"],
    },
    "content_ip": {
        "label": "콘텐츠·IP 기획",
        "packages": [
            {"name": "콘셉트 기획", "role": "senior", "md": 2.0},
            {"name": "시나리오·구성", "role": "mid", "md": 3.5},
            {"name": "제작·편집", "role": "mid", "md": 6.0},
            {"name": "검수·수정", "role": "senior", "md": 1.5},
            {"name": "PM·권리 확인", "role": "senior", "md": 1.0},
        ],
        "floor": 5_000_000,
        "missing": ["저작권 귀속", "원본 파일 제공", "수정 횟수"],
    },
    "video_test": {
        "label": "10~15초 테스트 컷",
        "customer_range": "50만~150만 원",
        "seconds": 12,
        "packages": [
            {"name": "기획/PM", "role": "senior", "md": 0.5},
            {"name": "프롬프트·생성·재시도", "role": "junior_creator", "md": 1.0},
            {"name": "선별·편집·자막", "role": "mid", "md": 2.0},
            {"name": "수정·납품", "role": "mid", "md": 0.5},
        ],
        "floor": 500_000,
        "unit": "편",
        "video": True,
        "missing": ["초 수", "테스트인지 납품인지", "수정 횟수"],
    },
    "video_30": {
        "label": "30초 AI 홍보영상",
        "customer_range": "150만~400만 원",
        "seconds": 30,
        "packages": [
            {"name": "기획/PM", "role": "senior", "md": 1.0},
            {"name": "프롬프트·생성·재시도", "role": "junior_creator", "md": 1.5},
            {"name": "선별·편집·자막·음원", "role": "mid", "md": 4.0},
            {"name": "검수·수정·납품", "role": "senior", "md": 0.8},
        ],
        "floor": 1_500_000,
        "unit": "편",
        "video": True,
        "missing": ["채널", "레퍼런스", "성우·음원 실비"],
    },
    "video_60": {
        "label": "60초 AI 홍보영상",
        "customer_range": "300만~800만 원",
        "seconds": 60,
        "packages": [
            {"name": "기획/PM", "role": "senior", "md": 1.5},
            {"name": "프롬프트·생성·재시도", "role": "junior_creator", "md": 2.5},
            {"name": "선별·편집·자막·후반", "role": "mid", "md": 7.0},
            {"name": "검수·수정·납품", "role": "senior", "md": 1.2},
        ],
        "floor": 3_000_000,
        "unit": "편",
        "video": True,
        "missing": ["사용처", "성우", "음악 라이선스"],
    },
    "video_ip": {
        "label": "캐릭터/IP 콘셉트 영상",
        "customer_range": "500만~1,500만 원",
        "seconds": 45,
        "packages": [
            {"name": "세계관·콘셉트 기획", "role": "senior", "md": 2.5},
            {"name": "프롬프트·생성·재시도", "role": "junior_creator", "md": 3.0},
            {"name": "편집·후반", "role": "mid", "md": 8.0},
            {"name": "검수·권리·납품", "role": "senior", "md": 1.5},
        ],
        "floor": 5_000_000,
        "unit": "편",
        "video": True,
        "missing": ["캐릭터 가이드", "저작권 귀속", "시리즈 여부"],
    },
    "video_ad": {
        "label": "광고·기관 제출용 고품질 영상",
        "customer_range": "800만 원 이상",
        "seconds": 60,
        "packages": [
            {"name": "전략·기획/PM", "role": "senior", "md": 3.0},
            {"name": "프롬프트·생성·재시도", "role": "junior_creator", "md": 4.0},
            {"name": "편집·후반·자막", "role": "mid", "md": 10.0},
            {"name": "검수·수정·납품", "role": "senior", "md": 2.0},
        ],
        "floor": 8_000_000,
        "unit": "편",
        "video": True,
        "missing": ["제출처 가이드", "초상권", "심의 여부"],
    },
    "video_campaign": {
        "label": "시리즈·세계관·브랜드 캠페인",
        "customer_range": "별도 M/M 산정",
        "seconds": 180,
        "packages": [
            {"name": "시니어 기획/PM", "role": "senior", "md": 8.0},
            {"name": "미드레벨 제작", "role": "mid", "md": 16.0},
            {"name": "주니어 생성·리서치", "role": "junior_creator", "md": 8.0},
        ],
        "floor": 12_000_000,
        "video": True,
        "missing": ["편수", "세계관 범위", "운영 기간"],
    },
    "video_edu": {
        "label": "교육 영상 1회차",
        "customer_range": "300만~800만 원",
        "seconds": 60,
        "packages": [
            {"name": "학습 목표·기획/PM", "role": "senior", "md": 1.5},
            {"name": "생성·재시도", "role": "junior_creator", "md": 2.0},
            {"name": "편집·자막", "role": "mid", "md": 5.0},
            {"name": "검수·납품", "role": "senior", "md": 0.8},
        ],
        "floor": 3_000_000,
        "unit": "회",
        "video": True,
        "missing": ["1회 길이", "대상", "현장 촬영 여부"],
    },
    "neurocraft": {
        "label": "뉴로크래프트 2+1",
        "packages": [
            {"name": "실무 A", "role": "senior", "md": 20.0},
            {"name": "실무 B", "role": "senior", "md": 20.0},
            {"name": "코치(+1)", "role": "senior", "md": 20.0},
        ],
        "floor": 30_000_000,
        "missing": ["과업 종류", "데이터 양", "납기"],
    },
    "sky_adopt": {
        "label": "스카이 도입 준비",
        "packages": [
            {"name": "현장 요구 정리", "role": "mid", "md": 1.5},
            {"name": "설정·온보딩", "role": "mid", "md": 2.0},
            {"name": "보호자·윤리 안내", "role": "senior", "md": 1.0},
            {"name": "PM", "role": "senior", "md": 0.6},
        ],
        "floor": 1_500_000,
        "missing": ["쓸 사람 수", "학교/센터", "기간"],
    },
}


def _count(text: str, unit_words: tuple[str, ...]) -> int:
    for w in unit_words:
        m = re.search(rf"(\d+)\s*{w}", text)
        if m:
            return max(1, int(m.group(1)))
    return 1


def classify(text: str) -> str:
    t = (text or "").lower()
    c = re.sub(r"\s+", "", t)
    if re.search(r"뉴로|데이터검수|3\+1|2\+1|neurocraft", t):
        return "neurocraft"
    if re.search(r"스카이|도입|온보딩|센터|학교", t) and re.search(r"도입|설치|교육", t):
        return "sky_adopt"
    if re.search(r"시리즈|세계관\s*캠페인|브랜드\s*캠페인", t):
        return "video_campaign"
    if re.search(r"기관\s*제출|(광고|고품질)\s*영", t):
        return "video_ad"
    if re.search(r"(캐릭터|세계관|ip).{0,12}(영|비디오|필름)|콘셉트\s*영", t):
        return "video_ip"
    if re.search(r"교육\s*영|강의\s*영|수업\s*영", t):
        return "video_edu"
    if re.search(r"10초|15초|테스트\s*컷|테스트컷", t):
        return "video_test"
    if re.search(r"60초|1분\s*홍보|일분", t):
        return "video_60"
    if re.search(r"30초", t):
        return "video_30"
    if re.search(r"본편|유튜브|youtube|3분|5분|8분|롱폼", t):
        return "video_ad"
    if re.search(r"숏폼|릴스|쇼츠|shorts|reels|틱톡", t):
        return "video_30"
    if re.search(r"poc|자동화|사아스|saas|api|챗봇개발|워크플로", t):
        return "ai_poc"
    if re.search(r"연구|조사|설문|인터뷰|문헌", t):
        return "research"
    if re.search(r"4주|한달교육|월간교육|커리큘럼전체", c):
        return "edu_4w"
    if re.search(r"교육|워크숍|교안|커리큘럼|수업", t):
        return "edu_1"
    if re.search(r"캐릭터|세계관|ip|시나리오|콘텐츠기획", t):
        return "content_ip"
    if re.search(r"영상|비디오|필름|애니메이션", t):
        return "video_30"
    if re.search(r"제안서|보고서|문서|견적서작성|브랜드북", t):
        return "document"
    return "document"


def _units_for(kind: str, text: str) -> int:
    if kind in ("video_test", "video_30", "video_60", "video_ip", "video_ad", "video_campaign"):
        return _count(text, ("편", "개", "clips"))
    if kind == "video_edu":
        return _count(text, ("회", "차시", "편"))
    if kind == "edu_1":
        return _count(text, ("회", "차시"))
    return 1


def _volume_factor(n: int) -> float:
    if n <= 1:
        return 1.0
    if n <= 4:
        return 0.9
    if n <= 12:
        return 0.8
    return 0.72


def _generation_cogs(kind: str, units: int) -> dict[str, Any]:
    """내부 원가. 고객 공급가에 더하지 않는다."""
    tpl = TEMPLATES.get(kind) or {}
    if not tpl.get("video"):
        return {"krw": 0, "usd": 0, "note": ""}
    seconds = int(tpl.get("seconds") or 30) * max(1, units)
    blocks = max(1, (seconds + 4) // 5) * GEN_RETRIES
    usd = round(blocks * GEN_USD_PER_5S, 2)
    krw = int(usd * USD_KRW)
    return {
        "krw": krw,
        "usd": usd,
        "seconds": seconds,
        "retries": GEN_RETRIES,
        "note": (
            f"내부 원가 추정: 완성 {seconds}초를 5초 클립×{GEN_RETRIES}회 재시도로 보면 "
            f"약 ${usd} (≈{krw:,}원). Runway급 초당 과금 참고. 고객 단가의 주연이 아닙니다."
        ),
    }


def _sensitive(text: str) -> bool:
    return bool(
        re.search(r"아동|어린이|노인|의료|임상|복지|장애|개인정보|초상|민감", text or "")
    )


def split_task(text: str, kind: str | None = None) -> dict[str, Any]:
    raw = (text or "").strip()
    kind = kind or classify(raw)
    tpl = TEMPLATES.get(kind) or TEMPLATES["document"]
    units = _units_for(kind, raw)
    packages = [{**p} for p in tpl["packages"]]
    missing = list(tpl.get("missing") or [])
    if not raw:
        missing = ["의뢰 목적", "희망 산출물", "일정"] + missing
    return {
        "ok": True,
        "kind": kind,
        "label": tpl["label"],
        "customer_range": tpl.get("customer_range"),
        "units": units,
        "packages": packages,
        "missing": missing[:7],
        "notes": [
            "LLM이 아니라 규칙으로 과업을 나눴습니다.",
            "기획·회의·검수·PM을 빼지 않았습니다.",
            VIDEO_CUSTOMER_NOTE if tpl.get("video") else "외부 실비(촬영, 라이선스, API, 인쇄)는 별도입니다.",
        ],
        "task": raw,
    }


def estimate_effort(
    text: str = "",
    kind: str | None = None,
    difficulty: str = "normal",
    rush: bool = False,
    packages: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    split = split_task(text, kind)
    kind = split["kind"]
    units = split["units"]
    rows = packages or split["packages"]
    mult = DIFF.get(difficulty, 1.0)
    if rush:
        mult *= 1.2
    if _sensitive(text):
        mult *= 1.15
    vol = _volume_factor(units)
    out_rows = []
    total_md = 0.0
    for p in rows:
        md = round(float(p["md"]) * units * vol * mult, 2)
        if md < 0.5 and p.get("name") not in ("시니어 검수",):
            md = max(md, 0.5) if units == 1 else md
        md = max(0.25, md)
        total_md += md
        out_rows.append(
            {
                "name": p["name"],
                "role": p["role"],
                "role_label": ROLES.get(p["role"], {}).get("label", p["role"]),
                "md": md,
                "mm": round(md / MD_PER_MM, 3),
            }
        )
    return {
        "ok": True,
        "kind": kind,
        "label": split["label"],
        "units": units,
        "difficulty": difficulty,
        "rush": rush,
        "sensitive": _sensitive(text),
        "volume_factor": vol,
        "multiplier": round(mult, 3),
        "rows": out_rows,
        "total_md": round(total_md, 2),
        "total_mm": round(total_md / MD_PER_MM, 3),
        "missing": split["missing"],
        "task": split["task"],
    }


def price_effort(
    rows: list[dict[str, Any]] | None = None,
    expert_sessions: int = 0,
    expert_fee: int = 500_000,
    floor: int | None = None,
    kind: str | None = None,
    span: str | None = None,
    units: int = 1,
) -> dict[str, Any]:
    if kind == "neurocraft" and span in NEURO_PACK:
        supply = NEURO_PACK[span]
        vat = int(round(supply * VAT))
        return {
            "ok": True,
            "mode": "neurocraft_pack",
            "span": span,
            "lines": [
                {
                    "name": "뉴로크래프트 2+1",
                    "role_label": "실무 2 + 코치 1",
                    "md": {"week": 5, "biweek": 10, "month": 20}[span] * 3,
                    "unit_price": ROLES["senior"]["day"],
                    "amount": supply,
                }
            ],
            "labor": supply,
            "expert": 0,
            "floor_applied": False,
            "supply": supply,
            "vat": vat,
            "total": supply + vat,
            "assumptions": [
                "2+1 패키지. 1인 월 1,000만 원 × 3명 기준.",
                "1주 750만, 2~3주 1,500만, 1개월 3,000만.",
                "부가세 10% 별도.",
            ],
        }

    lines = []
    labor = 0
    for r in rows or []:
        role = r.get("role") or "mid"
        day = int(ROLES.get(role, ROLES["mid"])["day"])
        md = float(r.get("md") or 0)
        amount = int(round(day * md))
        labor += amount
        lines.append(
            {
                "name": r.get("name") or role,
                "role": role,
                "role_label": ROLES.get(role, {}).get("label", role),
                "md": md,
                "unit_price": day,
                "amount": amount,
            }
        )
    expert = int(expert_sessions) * int(expert_fee)
    tpl = TEMPLATES.get(kind or "", {})
    is_video = bool(tpl.get("video"))
    if floor is None and kind in TEMPLATES:
        floor = int(TEMPLATES[kind].get("floor") or 0)
    floor = int(floor or 0)
    buffer = int(round(labor * RISK_BUFFER)) if is_video else 0
    labor_with_buffer = labor + buffer
    floor_applied = labor_with_buffer < floor
    # 고객 공급가 = 공수(+버퍼)와 과업 단가(floor) 중 큰 값. 토큰 원가는 더하지 않음.
    supply = max(labor_with_buffer, floor) + expert
    vat = int(round(supply * VAT))
    cogs = _generation_cogs(kind or "", max(1, int(units or 1)))
    assumptions = [
        "고객 견적은 맨먼스·과업 단가입니다. 토큰/크레딧은 내부 원가입니다.",
        "1 M/M = 20 M/D, 1일 = 8시간.",
        "부가세 10% 별도.",
        "토큰·크레딧·API·구독·라이선스·성우·음원·폰트·촬영은 별도 실비.",
        "무제한 수정·인허가·지원 선정·AI 사실성은 보장하지 않습니다.",
    ]
    if is_video:
        assumptions.insert(0, VIDEO_CUSTOMER_NOTE)
        if tpl.get("customer_range"):
            assumptions.insert(1, f"권장 밴드: {tpl['customer_range']}")
    return {
        "ok": True,
        "mode": "role_days",
        "lines": lines,
        "labor": labor,
        "risk_buffer": buffer,
        "expert": expert,
        "floor": floor,
        "floor_applied": floor_applied,
        "customer_range": tpl.get("customer_range"),
        "supply": supply,
        "vat": vat,
        "total": supply + vat,
        "extras": "별도 실비",
        "internal": cogs,
        "assumptions": assumptions,
    }


def draft(text: str, difficulty: str = "normal", rush: bool = False, span: str | None = None) -> dict[str, Any]:
    split = split_task(text)
    effort = estimate_effort(text, split["kind"], difficulty, rush, split["packages"])
    floor = TEMPLATES.get(split["kind"], {}).get("floor")
    if floor and TEMPLATES.get(split["kind"], {}).get("unit"):
        floor = int(floor * effort["units"] * effort["volume_factor"])
    priced = price_effort(
        effort["rows"],
        kind=split["kind"],
        span=span,
        floor=floor,
        units=effort["units"],
    )
    return {
        "ok": True,
        "split": split,
        "effort": effort,
        "price": priced,
        "summary": _summary(split, effort, priced),
    }


def _summary(split: dict, effort: dict, price: dict) -> str:
    band = price.get("customer_range")
    band_txt = f" 권장 밴드는 {band}입니다." if band else ""
    return (
        f"{split['label']}로 봤습니다."
        f"{band_txt} "
        f"공수는 {effort['total_md']} M/D({effort['total_mm']} M/M)입니다. "
        f"과업 수행비(공급가) {price['supply']:,}원, 부가세 포함 {price['total']:,}원입니다. "
        f"토큰·크레딧·라이선스·성우 등 실비는 별도입니다. "
        f"확인: {', '.join(split['missing'][:3]) or '일정'}. "
        f"계산기입니다."
    )


def catalog() -> dict[str, Any]:
    return {
        "ok": True,
        "roles": ROLES,
        "neurocraft": NEURO_PACK,
        "kinds": {
            k: {
                "label": v["label"],
                "floor": v.get("floor"),
                "range": v.get("customer_range"),
                "video": bool(v.get("video")),
            }
            for k, v in TEMPLATES.items()
        },
        "video_note": VIDEO_CUSTOMER_NOTE,
        "rules": {
            "md_per_mm": MD_PER_MM,
            "hours_per_day": HOURS_PER_DAY,
            "vat": VAT,
            "risk_buffer": RISK_BUFFER,
            "token_is_cogs": True,
        },
    }
