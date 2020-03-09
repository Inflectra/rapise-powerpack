//Use 'Record/Learn' button to begin test recording

function Test(params)
{
	var str = "One";
	str = IncrementInd(str);
	str = IncrementInd(str);
	str = IncrementInd(str);
	str = IncrementInd(str);
	
	Tester.AssertEqual('One', "One4", str);
	
	var str = "Invoice 0001";
	str = IncrementInd(str);
	str = IncrementInd(str);
	str = IncrementInd(str);
	str = IncrementInd(str);
	
	Tester.AssertEqual('Invoice', "Invoice 0005", str);
}

