--
name: quick-test
description: Run the test suite and explain any failures. Use when the user asks
  to run tests, check if tests pass, or debug a failing test.
disable-model-invocation: true
allowed-tools: Bash(npm test) Bash(npm run *)--
## Test run output
```!
npm test 2>&1 || true
```
## Instructions
1. Parse the test output above.
2. Report the summary: total tests, passed, failed, skipped.
3. If all tests passed, confirm this clearly and stop.
4. If any tests failed, for each failure:
   a. Quote the test name and assertion error.
   b. Explain in one sentence what the test expected vs. what it got.
   c. Suggest the most likely cause in the source code.
   d. Show the minimal fix needed to make the test pass.
5. Do not modify any files — report findings only.
