function IsMobileTest()
{
    return g_browserProfile.indexOf("Android") != -1 || g_browserProfile.indexOf("iPhone") != -1;
}

function IsSeleniumTest()
{
    return (typeof(WebDriver) != "undefined" && WebDriver);
}

function IsAndroidTest()
{
    return g_browserProfile.indexOf("Android") != -1;
}