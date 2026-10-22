#!/bin/bash
# One gate before anything goes live: verify numbers -> smoke test. Stops on the first failure.
# Usage: scripts/release_check.sh <month-code> <raw-folder-for-that-month> [trial-file]
#   e.g. scripts/release_check.sh 2026-09 ~/Desktop/Sept_raw Dashboard_TRIAL_v10.html
# Does not copy anything to the live file; do that yourself after PASS.
set -e
MONTH="$1"; RAW="$2"; TRIAL="${3:-Dashboard_TRIAL_v10.html}"
if [ -z "$MONTH" ] || [ -z "$RAW" ]; then echo "usage: $0 <month-code> <raw-folder> [trial-file]"; exit 2; fi
cd "$(dirname "$0")/.."
echo "1/2 numbers vs raw workbooks"; python3 scripts/verify_awqaf_month.py "$MONTH" "$RAW" "$TRIAL"
echo "2/2 every tab, English + Arabic"; python3 scripts/smoke_v9.py "$TRIAL"
echo "done: all checks passed for $TRIAL"
