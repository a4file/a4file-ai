#!/bin/bash
# 춘직이 아바타 원클릭 실행 (Mac/Linux)
set -e
cd "$(dirname "$0")"
echo "📦 필요한 패키지 설치 중..."
pip3 install --quiet flask flask-cors requests
echo "🚀 서버 시작!"
python3 server.py
