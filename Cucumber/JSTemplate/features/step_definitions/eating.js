// ================================

Given('there are {int} cucumbers', function (start) { 
	SeS('Input').DoClick();
	SeS('Input').DoSendKeys('{ESC}');
	SeS('Input').DoSendKeys(''+start);
});

When('I eat {int} cucumbers', function (ate) { 
	SeS('Eat').DoClick();
	SeS('Input').DoClick();
	SeS('Input').DoSendKeys(''+ate);
});

Then('I should have {int} cucumbers', function (left) { 
	SeS('Equals').DoClick();
	
	Tester.AssertEqual('Check cucumbers left', Global.DoTrim(SeS('Left').GetText()), ""+left);
});

// ================================
