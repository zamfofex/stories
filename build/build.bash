#!/usr/bin/env bash

set -e

rm -rf public/*
mkdir -p public/scripts

ln pages/{style.css,script.js,dependencies.css,icon.svg,subscribe.html,not-found.svg,sw.js} public
ln pages/not-found.html public/not_found.html
ln pages/scripts/* public/scripts

node build/build.js
