![Download](https://github.githubassets.com/images/icons/emoji/unicode/23ec.png?v8) [Download Now](https://inflectra.github.io/DownGit/#/home?url=https://github.com/Inflectra/rapise-powerpack/tree/master/PatternMatching)


# Flexible Pattern Checker

Useful for checking strings that should match fixed-length pattern. I.e. 2020/09/08 or SSN 078-05-1120 or phone number etc.

The checker has 2 set of entry points: for JavaScript and for RVL. 

See this test for a real example. `Main.js` calls JS versions, while Main.rvl.xlsx calls RVL ones.

## How to Use
Copy contents of `User.js` into your test project so you may call the functions.

## Using with JavaScript
```javascript
function MatchPattern(/**string*/str, /**string*/pattern, /**object*/defObj)/**boolean*/
```

```javascript
function MatchPatternAssert(/**string*/msg, /*string*/str, /**string*/pattern, /**object*/defObj)
```

## Using with RVL

```javascript
function RVLMatchPattern(/*string*/str, /**string*/pattern)
```

```javascript
function RVLAssertMatchPattern(/**string*/msg, /*string*/str, /**string*/pattern)
```