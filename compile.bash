#!/bin/bash

npm run build:prod
pkg --options max_old_space_size=4096 --targets latest-win-x64,latest-macos-x64,latest-linux-x64,latest-alpine-x64 --public dist/package/production/app.js --config dist/package/production/package.json --out-path dist/github
