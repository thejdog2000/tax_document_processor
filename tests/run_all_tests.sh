#!/bin/bash
# run_all_tests.sh — Runs the full PrepDesk test suite and writes combined_results.log
# Usage: ./tests/run_all_tests.sh
# After running, Claude will automatically review results on your next message.

cd "$(dirname "$0")/.." || exit 1

PYTHON=python3
LOG=tests/combined_results.log
MARKER=tests/.review_pending

echo "" > "$LOG"
echo "PrepDesk Full Test Suite — $(date)" >> "$LOG"
echo "========================================" >> "$LOG"

run_suite() {
    local label="$1"; shift
    echo "" >> "$LOG"
    echo "--- $label ---" >> "$LOG"
    "$@" >> "$LOG" 2>&1
    local code=$?
    if [ $code -eq 0 ]; then
        echo "[PASSED] $label" >&2
    else
        echo "[FAILED] $label" >&2
    fi
    return $code
}

overall=0

run_suite "Logic unit tests"       $PYTHON tests/test_logic.py              || overall=1
run_suite "Thornton MFJ"           $PYTHON tests/run_tests.py --unit --fixture thornton_mfj  || overall=1
run_suite "Whitfield"              $PYTHON tests/run_tests.py --unit --fixture whitfield      || overall=1
run_suite "Year mismatch"          $PYTHON tests/run_tests.py --unit --fixture year_mismatch  || overall=1
run_suite "TN client"              $PYTHON tests/run_tests.py --unit --fixture tn_client      || overall=1
run_suite "Senior MFJ"             $PYTHON tests/run_tests.py --unit --fixture senior_mfj    || overall=1

echo "" >> "$LOG"
echo "========================================" >> "$LOG"
if [ $overall -eq 0 ]; then
    echo "OVERALL: ALL SUITES PASSED" >> "$LOG"
else
    echo "OVERALL: ONE OR MORE SUITES FAILED" >> "$LOG"
fi

# Write marker file so Claude auto-reviews on next message
touch "$MARKER"

echo ""
echo "Results written to tests/combined_results.log"
echo "Tell Claude 'check' and results will be reviewed automatically."
