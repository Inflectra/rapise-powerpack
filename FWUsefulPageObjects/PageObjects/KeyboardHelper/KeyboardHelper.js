
/**
 * @PageObject KeyboardHelper provides handy way for pressing/releasing modified keys
 */

function KeyboardHelper_PressAlt()
{
	g_util.KeyPress(/**String*/"VK_MENU", /**Boolean*/true);
}

function KeyboardHelper_ReleaseAlt()
{
	g_util.KeyPress(/**String*/"VK_MENU", /**Boolean*/false);
}

function KeyboardHelper_PressCtrl()
{
	g_util.KeyPress(/**String*/"VK_CONTROL", /**Boolean*/true);
}

function KeyboardHelper_ReleaseCtrl()
{
	g_util.KeyPress(/**String*/"VK_CONTROL", /**Boolean*/false);
}

function KeyboardHelper_PressShift()
{
	g_util.KeyPress(/**String*/"VK_SHIFT", /**Boolean*/true);
}

function KeyboardHelper_ReleaseShift()
{
	g_util.KeyPress(/**String*/"VK_SHIFT", /**Boolean*/false);
}

function KeyboardHelper_PressWin()
{
	g_util.KeyPress(/**String*/"VK_LWIN", /**Boolean*/true);
}

function KeyboardHelper_ReleaseWin()
{
	g_util.KeyPress(/**String*/"VK_LWIN", /**Boolean*/false);
}


SeSPageObject("KeyboardHelper");
