#!/bin/bash
set -eu
cd `dirname $0`

test_cases=(`ls e2e-test/*/test.sh`)

for test_case in "${test_cases[@]}"; do
  test_case_dir=`dirname $test_case`
  cd $test_case_dir
  echo "+ Running test case: $test_case_dir"
  ./test.sh
done
