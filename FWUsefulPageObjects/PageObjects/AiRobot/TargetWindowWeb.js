
class TargetWindowWeb extends TargetWindowScreenRegion {

	returnValue = undefined;
	target = "browser";
	mouseX = 0;
	mouseY = 0;
	w = 0;
	h = 0;
	dpi = 1.0;

	constructor() {
		super();
		this.GetScreenshotImpl();
		var vp = this.GetViewportSize();
		this.w = this.lastImage.GetWidth();
		this.h = this.lastImage.GetHeight();
		this.dpi = vp.w / this.w;
	}
	
	B(/**number*/x) {
		// Convert physical (pixel) coords to browser coords.
		return Math.round(x/this.dpi);
	}

	GetScreenshotImpl(cursor=1) {
		if(WebDriver.AlertIsPresent())
		{
			var alert = WebDriver.SwitchToAlert();
			if (alert)
			{
				var actualText = ("" + alert.Text).replace("\r\n", " ").replace("\n", " ");
				alert.Accept();
				var msg = "Web page shows popup with a message: "+actualText+"\n\nI'm the popup was accepted by robot and now gone (you cannot see or interact with it, so I accept it for you).";
				throw {message:msg,info:msg};
			}
		} else {
			var iw = WebDriver.d.GetScreenshotIW();
			this.lastImage = iw;
			return iw.ToBase64Bitmap();
		}
	}

	GetRootEl()
	{
		return WebDriver.FindElementByXPath('/*');
	}
	
	/**
	 * Performs a click action on the specified mouse button.
	 * @param clickType The type of click: "L" (left), "R" (right), "M" (middle),
	 * "LD" (double left click), "RD" (double right click), or "MD" (double middle click).
	 */
	DoClick(clickType) {
		var iw1 = null, iw2 = null;
		if(l3) {
			this.GetScreenshotImpl();
			iw1 = this.lastImage;
		}
		var rootEl = /**WebElementWrapper*/this.GetRootEl();
		
		if(clickType=="LD") {
			WebDriver.Actions().DoubleClick().Perform();
		} else if(clickType=="R") {
			WebDriver.Actions().ContextClick().Perform();
		} else if(clickType=="RD") {
			WebDriver.Actions().ContextClick().ContextClick().Perform();
		} else {
			WebDriver.Actions().Click().Perform();
		}

		if(l3) {
			Global.DoSleep(50); // Git a bit of time for animations to complete.
			this.GetScreenshotImpl();
			iw2 = this.lastImage;
			const data = [];
			data.push(new SeSReportImage(iw1));
			data.push(new SeSReportImage(iw2));
			Tester.Message(clickType+" Click", data);
		}
		
		this.GetCursorPosition();
	}

	/**
	 * Moves the mouse pointer to the specified screen coordinates.
	 * @param x The x-coordinate to move the mouse pointer to.
	 * @param y The y-coordinate to move the mouse pointer to.
	 */
	DoMouseMove(x, y) {
		this.mouseX = x;
		this.mouseY = y;
		WebDriver
			.Actions()
			.MoveToLocation(this.B(this.mouseX), this.B(this.mouseY))
			.Perform();
	}

	/**
	 * Performs a drag-and-drop operation from the current mouse position
	 * to the specified screen coordinates.
	 * @param x The x-coordinate to drag the mouse pointer to.
	 * @param y The y-coordinate to drag the mouse pointer to.
	 */
	DoMouseDragTo(x, y) {
		var iw1 = null, iw2 = null;
		if(l3) {
			this.GetScreenshotImpl();
			iw1 = this.lastImage;
		}
		
		var rootEl = /**WebElementWrapper*/this.GetRootEl();
		WebDriver
			.Actions()
			.MoveToElement(rootEl, this.mouseX, this.mouseY)
			.ClickAndHold()
			.MoveByOffset(this.B(x-this.mouseX),this.B(y-this.mouseY))
			.Release()
			.Perform();
		
		this.GetCursorPosition();
		
		if(l3) {
			this.GetScreenshotImpl();
			iw2 = this.lastImage;
			const data = [];
			data.push(new SeSReportImage(iw1));
			data.push(new SeSReportImage(iw2));
			Tester.Message("Drag to: "+x+"/"+y, data);
		}
	}

	/**
	 * Sends a sequence of keystrokes to the current window.
	 * @param keys A string representing the keys to be sent.
	 */
	DoSendKeys(keys, duration) {
		var iw1 = null, iw2 = null;
		if(l3) {
			this.GetScreenshotImpl();
			iw1 = this.lastImage;
		}
		
		// TODO: Implement press duration.
		Navigator.DoSendKeys(keys)
		
		this.GetCursorPosition();
		
		if(l3) {
			this.GetScreenshotImpl();
			iw2 = this.lastImage;
			const data = [];
			data.push(new SeSReportImage(iw1));
			data.push(new SeSReportImage(iw2));
			Tester.Message("Sending keys: "+keys, data);
		}
	}
	
	DoMousePress(button/*: "L", "R", "M"*/) {
		WebDriver
			.Actions()
			.ClickAndHold()
			.Perform();
	}
	
	DoMouseRelease(button/*: "L", "R", "M"*/) {
		WebDriver
			.Actions()
			.Release()
			.Perform();
	}
	
	DoScroll(scrollX, scrollY)
	{
		var rootEl = /**WebElementWrapper*/this.GetRootEl();
		WebDriver
			.Actions()
			.ClickAndHold()
			.ScrollFromOrigin(null, this.B(this.mouseX), this.B(this.mouseY), this.B(x),this.B(y))
			.Release()
			.Perform();
	}
	
	GetViewportSize()
	{
		var rootEl = /**WebElementWrapper*/this.GetRootEl();
		var elRect = WebDriver.ExecuteScript("return {w:window.innerWidth,h:window.innerHeight};", rootEl.e);
		return {
			w: elRect.w,
			h: elRect.h
		};
	}
	
	/**
	 * Retrieves the current position of the mouse pointer.
	 * @returns An object containing the x and y coordinates of the mouse pointer.
	 */
	GetCursorPosition() {
		return {
			x: this.mouseX,
			y: this.mouseY
		};
	}
}
