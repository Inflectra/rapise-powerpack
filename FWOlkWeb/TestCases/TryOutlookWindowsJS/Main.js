//Use 'Record/Learn' button to begin test recording

function Test(params)
{
	Global.DoInvokeTest('%WORKDIR%/TestCases/Util/LaunchOutlook/Test.sstest');
	Navigator.Open();
	WebPageHelper.DoClickByText('Other');
	
	SeS('New_mail').DoClick();
	SeS('Help').DoClick();
	SeS('Home').DoClick();
	SeS('Discard').DoClick();
	
	
	
}

g_load_libraries=["Web"]

