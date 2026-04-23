@echo off
REM 춘직이 아바타 원클릭 실행 (Windows)
cd /d "%~dp0"
echo 📦 필요한 패키지 설치 중...
pip install --quiet flask flask-cors requests
echo 🚀 서버 시작!
python server.py
pause
