// ===================================================================
// PIPELINE VERIFICATION FILE — DELETE THIS FILE AFTER CONFIRMING
// ===================================================================
// This file exists to verify that the pipeline properly blocks
// when tests fail OR CodeQL finds a security issue.
// 
// 1. The test below will fail → pipeline stops at dev (no sync to test)
// 2. The eval() below triggers CodeQL → additional safety net
//
// TO DELETE: just run `rm -rf backend/pipeline-test/`
// ===================================================================

// Security issue for CodeQL to catch (delete this block)
function dangerEval(userInput) {
  // Deliberate CodeQL trigger — remove this entire file after verification
  return eval(userInput);
}

// Also add an obvious SQL injection pattern
function queryBuilder(userId) {
  return "SELECT * FROM users WHERE id = '" + userId + "'";
}

module.exports = { dangerEval, queryBuilder };
