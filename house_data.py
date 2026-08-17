"""좋은 집 찾기 — 경매·공매·모아주택 안내 데이터. 법원 사건 원문을 복제하지 않는다."""

from __future__ import annotations

OFFICIAL = {
    "auction": {
        "label": "법원 경매",
        "url": "https://www.courtauction.go.kr",
        "note": "사건번호·감정가는 법원 경매정보에서 확인합니다.",
    },
    "onbid": {
        "label": "온비드 공매",
        "url": "https://www.onbid.co.kr",
        "note": "캠코·공공자산 공매는 온비드가 원문입니다.",
    },
    "moa": {
        "label": "서울 모아주택·모아타운",
        "url": "https://housing.seoul.go.kr",
        "note": "사업지 지정·공고는 서울주택도시공사·서울시 주택포털에서 확인합니다.",
    },
}

# 구청 대략 좌표. 검색 지도 이동용.
SEOUL_GU = [
    {"gu": "종로구", "lat": 37.5735, "lon": 126.9790},
    {"gu": "중구", "lat": 37.5641, "lon": 126.9979},
    {"gu": "용산구", "lat": 37.5326, "lon": 126.9905},
    {"gu": "성동구", "lat": 37.5634, "lon": 127.0369},
    {"gu": "광진구", "lat": 37.5385, "lon": 127.0823},
    {"gu": "동대문구", "lat": 37.5744, "lon": 127.0396},
    {"gu": "중랑구", "lat": 37.6063, "lon": 127.0926},
    {"gu": "성북구", "lat": 37.5894, "lon": 127.0167},
    {"gu": "강북구", "lat": 37.6396, "lon": 127.0255},
    {"gu": "도봉구", "lat": 37.6688, "lon": 127.0471},
    {"gu": "노원구", "lat": 37.6542, "lon": 127.0568},
    {"gu": "은평구", "lat": 37.6027, "lon": 126.9291},
    {"gu": "서대문구", "lat": 37.5791, "lon": 126.9368},
    {"gu": "마포구", "lat": 37.5663, "lon": 126.9019},
    {"gu": "양천구", "lat": 37.5170, "lon": 126.8666},
    {"gu": "강서구", "lat": 37.5509, "lon": 126.8495},
    {"gu": "구로구", "lat": 37.4955, "lon": 126.8874},
    {"gu": "금천구", "lat": 37.4569, "lon": 126.8956},
    {"gu": "영등포구", "lat": 37.5264, "lon": 126.8962},
    {"gu": "동작구", "lat": 37.5124, "lon": 126.9393},
    {"gu": "관악구", "lat": 37.4784, "lon": 126.9516},
    {"gu": "서초구", "lat": 37.4837, "lon": 127.0324},
    {"gu": "강남구", "lat": 37.5172, "lon": 127.0473},
    {"gu": "송파구", "lat": 37.5145, "lon": 127.1060},
    {"gu": "강동구", "lat": 37.5301, "lon": 127.1238},
]

# 공개 사업 안내 지점. 매물 목록이 아니라 찾아보기 입구.
MOA_SITES = [
    {"id": "gb-beon", "name": "강북 번동", "gu": "강북구", "dong": "번동", "lat": 37.6263, "lon": 127.0314},
    {"id": "jr-myeonmok", "name": "중랑 면목", "gu": "중랑구", "dong": "면목동", "lat": 37.5808, "lon": 127.0878},
    {"id": "gc-doksan", "name": "금천 독산", "gu": "금천구", "dong": "독산동", "lat": 37.4694, "lon": 126.8969},
    {"id": "ga-sillim", "name": "관악 신림", "gu": "관악구", "dong": "신림동", "lat": 37.4842, "lon": 126.9296},
    {"id": "ep-eungam", "name": "은평 응암", "gu": "은평구", "dong": "응암동", "lat": 37.5986, "lon": 126.9156},
    {"id": "sb-jangwi", "name": "성북 장위", "gu": "성북구", "dong": "장위동", "lat": 37.6143, "lon": 127.0536},
    {"id": "gs-hwagok", "name": "강서 화곡", "gu": "강서구", "dong": "화곡동", "lat": 37.5416, "lon": 126.8403},
    {"id": "ddm-jangan", "name": "동대문 장안", "gu": "동대문구", "dong": "장안동", "lat": 37.5707, "lon": 127.0686},
    {"id": "yc-sinwol", "name": "양천 신월", "gu": "양천구", "dong": "신월동", "lat": 37.5394, "lon": 126.8276},
    {"id": "nw-sanggye", "name": "노원 상계", "gu": "노원구", "dong": "상계동", "lat": 37.6607, "lon": 127.0705},
    {"id": "db-banghak", "name": "도봉 방학", "gu": "도봉구", "dong": "방학동", "lat": 37.6652, "lon": 127.0342},
    {"id": "sp-geoyeo", "name": "송파 거여·마천", "gu": "송파구", "dong": "거여동", "lat": 37.4933, "lon": 127.1467},
]


def catalog() -> dict:
    return {
        "ok": True,
        "official": OFFICIAL,
        "gus": SEOUL_GU,
        "moa": [
            {**row, "kind": "moa", "note": "모아주택·모아타운 안내 지점. 지정 여부는 서울시에서 확인."}
            for row in MOA_SITES
        ],
        "disclaimer": (
            "경매·공매 원문은 법원·온비드에 있습니다. "
            "이 지도는 동네를 고르고 공식 창을 여는 입구입니다. 투자 권유가 아닙니다."
        ),
        "plan": {
            "month": 9900,
            "label": "월 9,900원",
            "includes": ["스카이 도구", "견적 프로그램", "좋은 집 찾기", "LAB 가이드", "이후 웹 솔루션"],
        },
    }


def match_area(q: str) -> dict | None:
    t = (q or "").strip()
    if not t:
        return None
    for row in SEOUL_GU:
        if row["gu"] in t or t in row["gu"]:
            return {**row, "label": row["gu"], "kind": "gu"}
    for row in MOA_SITES:
        if row["name"] in t or row["dong"] in t or row["gu"] in t:
            return {**row, "label": row["name"], "kind": "moa"}
    return None
