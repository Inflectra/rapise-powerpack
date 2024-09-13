//Use 'Record/Learn' button to begin test recording

function Test(params)
{
	Navigator.Open('https://v3.libraryinformationsystem.org/');
	
	Playwright.DoInvoke(async ({page,expect})=> {
		await expect(page).toHaveTitle("Library Information System");
		await page.locator('css=#username').fill('librarian');
	});
	
	Navigator.SeSFind("css=#password").DoSetText('librarian');
}

g_load_libraries=["Web"]

