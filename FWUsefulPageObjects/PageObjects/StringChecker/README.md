# StringChecker

## Purpose

StringChecker helps comparing strings with regular patterns, checking uniqueness, and validating string contents. It provides both check functions (return true/false) and verify functions (write results to the test report).

## Installation

Install StringChecker [public page object](https://rapisedoc.inflectra.com/Guide/pageobjects/) into your test framework using the `Import Public Module` option.

## Actions

| Action | Description |
|--------|-------------|
| `CheckPattern(str, pattern, defObj)` | Compare `str` with `pattern` using field definitions |
| `VerifyPattern(message, str, pattern, defObj)` | CheckPattern + write assertion to report |
| `CheckPatternRVL(str, pattern)` | RVL-friendly version of CheckPattern |
| `VerifyPatternRVL(message, str, pattern)` | RVL-friendly version of VerifyPattern |
| `CheckRegex(str, regexstr)` | Check if `str` matches a regular expression |
| `VerifyRegex(message, str, regexstr)` | CheckRegex + write assertion to report |
| `CheckUnique(val)` | Check that `val` has not been seen before |
| `VerifyUnique(message, val)` | CheckUnique + write assertion to report |
| `CheckContainsOneOf(val, chars)` | Check that `val` contains at least one character from `chars` |
| `VerifyContainsOneOf(message, val, chars)` | CheckContainsOneOf + write assertion to report |
| `CheckContainsNoneOf(val, chars)` | Check that `val` contains none of the characters from `chars` |
| `VerifyContainsNoneOf(message, val, chars)` | CheckContainsNoneOf + write assertion to report |
| `CheckMatchesOneOf(val, values)` | Check that `val` matches one of the `values` |
| `VerifyMatchesOneOf(message, val, values)` | CheckMatchesOneOf + write assertion to report |

## Pattern Matching

The `CheckPattern` function compares a string character-by-character against a pattern. Each character in the pattern is either a literal match or a field defined in `defObj`.

```javascript
// defObj defines what each field character accepts:
{
    N: "0123456789",   // N matches any digit
    L: "ABCXYZ"        // L matches any of these letters
}

// Pattern "NN-LL" means: two digits, dash, two letters
StringChecker.CheckPattern("12-AX", "NN-LL", {N: "0123456789", L: "ABCXYZ"});
// Returns true: 1∈digits, 2∈digits, - is literal, A∈letters, X∈letters
```

## Usage

### JavaScript

```javascript
// Pattern matching: verify a code like "1-X" matches "digit-letter" pattern
var result = StringChecker.CheckPattern('1-X', 'N-L', {N: "0123456789", L: "XYZ"});
// result: true

// Verify with report output
StringChecker.VerifyPattern('Code format is valid', '1-X', 'N-L', {N: "0123456789", L: "XYZ"});

// Regex matching
StringChecker.VerifyRegex('Email format', '[email protected]', '[a-z]+@[a-z]+\\.[a-z]+');

// Uniqueness check (across test run)
StringChecker.VerifyUnique('Order ID is unique', orderId);

// Check string contains at least one digit
StringChecker.VerifyContainsOneOf('Has a digit', 'abc3def', '0123456789');

// Check string contains no special characters
StringChecker.VerifyContainsNoneOf('No special chars', 'HelloWorld', '!@#$%^&*');

// Check value matches one of expected values
StringChecker.VerifyMatchesOneOf('Valid status', status, ['Active', 'Pending', 'Closed']);
```

### RVL

| Flow | Type | Object | Action | ParamName | ParamValue |
|------|------|--------|--------|-----------|------------|
| | Action | StringChecker | VerifyPatternRVL | message | Code format check |
| | | | | str | 1-X |
| | | | | pattern | N-L |
| | | | | N | 0123456789 |
| | | | | L | XYZ |
| | Action | StringChecker | VerifyRegex | message | Email format |
| | | | | str | test@mail.com |
| | | | | regexstr | [a-z]+@[a-z]+\\.[a-z]+ |
| | Action | StringChecker | VerifyUnique | message | ID is unique |
| | | | | val | ORD-001 |
