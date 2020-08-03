#!/usr/bin/env bash

set -e

mkdir -p public
rm -rf public/*

ln style.css script.js public
ln -s ../scripts public
ln not-found/main.svg public/not-found.svg
ln not-found/main.html public/not_found.html

node build/build.js
