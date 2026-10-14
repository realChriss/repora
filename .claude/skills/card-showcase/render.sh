#!/usr/bin/env bash
set -euo pipefail

OUT=${1:-assets/cards.webp}
PORT=3123 HOLD=1 FADE=0.5 FPS=30 QUALITY=80
BROWSER=${BROWSER:-"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"}
VARIANTS=(
  "style=rim&accent=4FB3FF"
  "style=glow&layout=pill&accent=B48CFF"
  "style=brutal&accent=FFC857"
  "style=acrylic&accent=4ADE9B"
  "style=solid&layout=pill&accent=FF5C8A"
  "style=glow&accent=FF8A5B"
  "style=bar&accent=B48CFF"
  "style=brutal&layout=pill&accent=4ADE9B"
)

win() { if command -v cygpath >/dev/null; then cygpath "$1" "$2"; else echo "$2"; fi; }

TMP=$(mktemp -d)
PORT=$PORT bun src/server/index.ts >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER; rm -rf "$TMP"' EXIT
until curl -so /dev/null "localhost:$PORT/"; do sleep 0.2; done

W=0 H=0 shots=()
for i in "${!VARIANTS[@]}"; do
  curl -sf "localhost:$PORT/oven-sh/bun?${VARIANTS[$i]}&icon=docs/icons/bun.svg&scale=2" -o "$TMP/$i.svg"
  read -r w h < <(grep -om1 'width="[0-9]*" height="[0-9]*"' "$TMP/$i.svg" | tr -dc '0-9 \n')
  (( w > W )) && W=$w; (( h > H )) && H=$h
  "$BROWSER" --headless --disable-gpu --hide-scrollbars --default-background-color=00000000 \
    --user-data-dir="$(win -w "$TMP/edge$i")" --window-size="$w,$h" \
    --screenshot="$(win -w "$TMP/$i.png")" "file:///$(win -m "$TMP/$i.svg")" >/dev/null 2>&1 &
  shots+=($!)
done
wait "${shots[@]}"

N=${#VARIANTS[@]}
LEN=$(awk "BEGIN{print $HOLD+2*$FADE}")
inputs=() filter="" prev=v0
for k in $(seq 0 "$N"); do
  inputs+=(-loop 1 -framerate "$FPS" -t "$LEN" -i "$TMP/$((k % N)).png")
  filter+="[$k:v]format=rgba,pad=$W:$H:(ow-iw)/2:(oh-ih)/2:color=0x00000000,setsar=1,premultiply=inplace=1[v$k];"
done
for k in $(seq 1 "$N"); do
  filter+="[$prev][v$k]xfade=transition=custom:duration=$FADE:offset=$(awk "BEGIN{print $k*($HOLD+$FADE)-$FADE}")"
  filter+=":expr='if(gt(P,0.5),A*(2*P-1)*(2*P-1)*(5-4*P),B*(1-2*P)*(1-2*P)*(1+4*P))'[x$k];"
  prev=x$k
done
filter+="[$prev]trim=duration=$(awk "BEGIN{print $N*($HOLD+$FADE)}"),unpremultiply=inplace=1,format=yuva420p"

ffmpeg -hide_banner -loglevel error -y "${inputs[@]}" -filter_complex "$filter" \
  -c:v libwebp_anim -lossless 0 -quality "$QUALITY" -compression_level 4 -loop 0 "$OUT"
echo "$OUT: ${W}x${H}, $(wc -c < "$OUT") bytes"
