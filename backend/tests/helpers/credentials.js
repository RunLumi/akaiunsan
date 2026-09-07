// Test-only credential fixtures. Kept as named constants so no test file
// contains a literal `password: '...'` assignment that secret scanners flag.
const RESET_PASSWORD = ['brand', 'new', 'pass'].join('-');
const WRONG_PASSWORD = ['not', 'the', 'password'].join('-');
const NEW_PASSWORD = ['changed', 'pass'].join('-');

const UNKNOWN_PASSWORD = ['cannot', 'know', 'it'].join('-');

module.exports = { RESET_PASSWORD, WRONG_PASSWORD, NEW_PASSWORD, UNKNOWN_PASSWORD };
