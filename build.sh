#!/bin/bash
set -e
npm ci --prefer-offline --no-audit --ignore-scripts
npm run build
