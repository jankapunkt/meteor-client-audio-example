#!/usr/bin/env bash



FBASE=$(basename $1)
FNAME=${FBASE%.*}

EXOGG="./temp/$FNAME.ogg"
EXMP4="./temp/$FNAME.mp4"
EXWEBM="./temp/$FNAME.webm"

mkdir -p ./temp
ffmpeg -i $1 -vn $EXOGG $EXMP4 $EXWEBM
exit 0
