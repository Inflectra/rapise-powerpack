![Download](https://github.githubassets.com/images/icons/emoji/unicode/23ec.png?v8) [Download Now](https://inflectra.github.io/DownGit/#/home?url=https://github.com/Inflectra/rapise-powerpack/tree/master/SoftAssert)

# Tester.SoftAssert and Tester.SoftAssertAll

Enables **SoftAssert** feature. SoftAssert proceeds execution without causing test termination (i.e. ignores `StopOnError` option).

Another use-case, is to have a bunch of SoftAssert statements, followed by a real assertion `Tester.SoftAssertAll` that is only fails if there was previous soft failures.

Update: SoftAssert was introduced in Rapise v6.7. However, this topic also contains new features:
```javascript
Tester.SoftAssertEqual
Tester.SoftAssertContains
Tester.SoftAssertNotContains
```

## Usage

Copy contents of the [User.js](User.js) into your User.js.

## Using from JavaScript

```javascript
	Tester.Assert('Pass0', true);
	Tester_SoftAssert('SoftFailure1', false);
	Tester_SoftAssert('SoftFailure2', true);

	Tester.Assert('Pass1', true);
	
	// How we should fail if there were failures
	Tester_SoftAssertAll('Aftermath', true);
```

## Using from RVL

![SoftAssert RVL](img/SoftAssertRvl.png)

