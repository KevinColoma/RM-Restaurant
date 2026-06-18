// ===================================================================
// PIPELINE VERIFICATION TEST — DELETE THIS FILE AFTER CONFIRMING
// ===================================================================
// This test intentionally fails to verify the CI pipeline stops
// at the dev phase (no sync to test, no deploy).
//
// TO DELETE: just run `rm -rf backend/tests/pipeline-verify.test.js`
// ===================================================================

describe('Pipeline verification', () => {
  it('INTENTIONALLY FAILS — delete this test after verifying pipeline blocking', () => {
    expect(1 + 1).toBe(3); // This will never pass
  });
});
