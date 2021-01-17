#!/usr/bin/env bash

set -e

rm -rf public/*
mkdir -p public/scripts

ln pages/{style.css,dependencies.css,icon.svg,sw.js,pencil.svg} public
ln pages/scripts/* public/scripts
ln dependencies.js public

deno run --unstable -A build/build.js
