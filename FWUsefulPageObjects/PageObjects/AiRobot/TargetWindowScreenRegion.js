class TargetWindowScreenRegion {

	ox = 0;
	oy = 0;
	w = 0;
	h = 0;
	returnValue = undefined;

	constructor(ox, oy, w, h) {
		this.ox = ox;
		this.oy = oy;
		this.w = w;
		this.h = h;
	}

	static FromHWND(/**HWNDWrapper*/hwndWrapper) {
		if(hwndWrapper.Iconic||hwndWrapper.IsVisible())
		{
			hwndWrapper.Restore();
		}
		
		return new TargetWindowScreenRegion(hwndWrapper.PosX, hwndWrapper.PosY, hwndWrapper.PosWidth, hwndWrapper.PosHeight)
	}

	static FromWebDriver() {
		var r = SeSGetBrowserWindowRect();
		return new TargetWindowScreenRegion(r.x, r.y, r.w, r.h);
	}

	static FromScreenRegion(x, y, w, h) {
		return new TargetWindowScreenRegion(x, y, w, h);
	}

	static FromScreen() {
		var /**HWNDWrapper*/hwndWrapper = g_util.GetDesktopWindow();
		return TargetWindowScreenRegion.FromHWND(hwndWrapper);
	}

	/**
	 * Takes a screenshot of the current window and returns it as a base64-encoded string.
	 * @returns A base64-encoded string representing the screenshot.
	 */
	GetScreenshot(cursor = false) {
		var iw = SeSCaptureImageDefaultImpl(this.ox, this.oy, this.w, this.h, cursor);
		this.lastImage = iw;
		return iw.ToBase64Bitmap();
	}

	/**
	 * Performs a click action on the specified mouse button.
	 * @param clickType The type of click: "L" (left), "R" (right), "M" (middle),
	 * "LD" (double left click), "RD" (double right click), or "MD" (double middle click).
	 */
	DoClick(clickType) {
		Global.DoClick(clickType)
	}

	/**
	 * Moves the mouse pointer to the specified screen coordinates.
	 * @param x The x-coordinate to move the mouse pointer to.
	 * @param y The y-coordinate to move the mouse pointer to.
	 */
	DoMouseMove(x, y) {
		Global.DoMouseMove(x + this.ox, y + this.oy)
	}

	/**
	 * Performs a drag-and-drop operation from the current mouse position
	 * to the specified screen coordinates.
	 * @param x The x-coordinate to drag the mouse pointer to.
	 * @param y The y-coordinate to drag the mouse pointer to.
	 */
	DoMouseDragTo(x, y) {
		g_util.LButtonDown();
		Global.DoSleep(50)
		Global.DoMouseMove(x + this.ox, y + this.oy, 500);
		g_util.LButtonUp();
	}

	/**
	 * Sends a sequence of keystrokes to the current window.
	 * @param keys A string representing the keys to be sent.
	 */
	DoSendKeys(keys) {
		Global._DoSendKeys(keys);
	}

	/**
	 * Retrieves the current position of the mouse pointer.
	 * @returns An object containing the x and y coordinates of the mouse pointer.
	 */
	GetCursorPosition() {
		return {
			x: g_util.GetCursorX() - this.ox,
			y: g_util.GetCursorY() - this.oy
		}
	}

	AssistantText(msg) {
		if (l2) {
			var data = [];
			this.lastImage = null;
			this.GetScreenshot(true);
			if (this.lastImage) {
				data.push(new SeSReportImage(this.lastImage));
			}
	
			Tester.Message("Assistant: " + msg, data);
		}
	}

	Log(msg) {
		if (l3) {
			Tester.Message(msg);
		}
		Log2(msg);
	}

	PrintReportMessage(/**string*/message) {
		Tester.Message(message, "AiRobot");
	}

	ActionStart(actionkey, msg) {
		this.actions = this.actions || {};
		this.actions[actionkey] = msg;
	}

	ActionEnd(actionkey, output) {
		// Don't reflect in the log, we track it for all other actions.
		if (actionkey.indexOf("screenshot") == 0 || actionkey.indexOf("rapise") == 0) return;

		var data = [actionkey];
		this.lastImage = null;
		this.GetScreenshot(true);
		if (this.lastImage) {
			data.push(new SeSReportImage(this.lastImage));
		}

		if (l2) {
			Tester.Message("Robot: " + output, data, { comment: this.actions[actionkey] || actionkey });
		}
	}

	LoadResponse() {
		if (File.Exists("iteration.json")) {
			try {
				var json = File.Read("iteration.json");
				var obj = JSON.parse(json);
				return obj;
			} catch (e) {
			}
		}
		return null;
	}

	RegisterResponse(payload, response, imgMeta, chatStatus) {
		File.Write("iteration.json",
			JSON.stringify(
				{ payload, response, imgMeta: { metadata: imgMeta.metadata, metadata_scaled: imgMeta.metadata_scaled }, chatStatus },
				null, 2
			)
		);
	}

	// Assertion management
	Assert(/**string*/message, /**boolean*/pass, /**string*/optAdditionalData) {
		var data = optAdditionalData;
		if(typeof data == 'undefined') {
			data = [];
		} else if(!Array.isArray(data)) {
			data = [data];
		}
		
		if(l2) {
			this.lastImage = null;
			this.GetScreenshot(true);
			if (this.lastImage) {
				data.push(new SeSReportImage(this.lastImage));
			}
		}
		
		Tester.SoftAssert(message, pass, optAdditionalData)
	};

	// Return value management
	SetReturnValue(val) {
		if (l3) Tester.Message("AiRobot: Setting return value to: " + val);
		this.returnValue = val;
	}
	GetReturnValue() {
		return this.returnValue;
	}
}