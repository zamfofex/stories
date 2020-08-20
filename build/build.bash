#!/usr/bin/env bash

set -e

rm -rf public/*
mkdir -p public/scripts

ln style.css script.js public
ln scripts/* public/scripts

node build/build.js

ln not-found/main.svg public/not-found.svg
ln not-found/main.html public/not_found.html
ln sw.js public
