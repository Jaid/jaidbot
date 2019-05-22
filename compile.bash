#!/bin/bash

npm run build:prod
pkg --options max_old_space_size=4096 --targets latest-win,latest-macos,latest-linux,latest-alpine --public dist/package/production/cli.js --config dist/package/production/package.json
