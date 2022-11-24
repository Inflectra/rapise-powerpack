![Download](https://github.githubassets.com/images/icons/emoji/unicode/23ec.png?v8) [Download Now](https://inflectra.github.io/DownGit/#/home?url=https://github.com/Inflectra/rapise-powerpack/tree/master/SubTestTags)

# Query / Execute sub-tests by tags

This example contains a number of sub and sub-sub tests. Some have tag `group1`, some `group2` and one test has both `group1,group2` assigned.

## Find SubTest by tag

To find all tests having specifig tag(s) (comma-separated) use:
```javascript
FindAllSubTestsByTag(/**string*/tags, /**string*/rootSstest)
```

Dump all sub-test paths together with assigned tag names to the report:

```javascript
DumpAllSubTestTags(/**string*/rootSstest)
```

## Run SubTests by tag

### From RVL

```javascript
function RunAllSubTestsByTagRvl( /**string*/ tags, /**string*/ rootSstest)
```

### From JS

```javascript
function RunAllSubTestsByTag( /**string*/ tags, /**string*/ rootSstest, /**object*/ optionalParams)
```


## Usage

Copy contents of the [User.js](User.js) into your User.js.

