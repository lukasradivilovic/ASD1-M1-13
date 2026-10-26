#!/bin/bash
# użycie: ./shoot.sh nazwa "query" szer wys
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
ROOT="$(cd "$(dirname "$0")/.." && pwd -W)"
"$EDGE" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=${3:-1400},${4:-1000} --screenshot="$ROOT/docs/img/$1.png" "file:///$ROOT/index.html?$2" >/dev/null 2>&1
