
/**
 * @PageObject One-time password generation.
 * 
 * @Version 1.0.0
 */
SeSPageObject("OTP");

function OtpInstallModules()
{
	if(!File.FolderExists("PageObjects\\OTP\\node_modules"))
	{
		Log("otplib not installed, doing npm install");
		var cmd = "npm";
		var osType = Global.GetOsType();
		if (osType.toLowerCase().indexOf("windows") != -1)
		{
			Log("OS Type is Windows");
			cmd = '"' + g_helper.ResolvePath("InstrumentJS/npm.cmd") + '"';
		}
		var result = Global.DoCmd(`${cmd} ci`, Global.GetFullPath("PageObjects\\OTP"), true, false);
		Log(result);
	}
}

function OTP_GetCode(/**string*/ secret)
{
	secret = secret || global.g_OTP_Secret || Tester.GetParam("OTP Secret", "");
	
	if (!secret)
	{
		Tester.Message('OTP Secret is not defined');
		return "";
	}

	OtpInstallModules();
	const otpPath = Global.GetFullPath("PageObjects/OTP/node_modules/otplib");
	const { authenticator } = require(otpPath);
	const token = authenticator.generate(secret);
	return token;
}

var _paramInfoOTP_GetCode = {
	_: function()
	{
/**
 * Generate one-time password for given secret.
 */
	},
	_type: "string",
	_returns: "Generated one-time password.",
	secret: {
		description: "Secret string to use for OTP generation.",
		type: "string",
		optional: true,
		defaultValue: ""
	}
};


