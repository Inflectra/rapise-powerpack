var saved_script_objects={
	"New_mail": {
		"version": 0,
		"object_type": "HTMLObject",
		"object_flavor": "Button",
		"object_name": "New mail",
		"screenshot_path": "Recording/2026-04-23_14-58-34/Step2.png",
		"ignore_object_name": true,
		"object_class": "Selenium",
		"object_role": "",
		"object_text": "New mailCreate a new email message. (Ctrl+N / Ctrl+Shift+M)",
		"object_library": "Selenium",
		"window_class": "param:object_class",
		"window_name": "Mail - Robin Ellacott - Outlook",
		"locations": [
			{
				"locator_name": "HTML",
				"location": {
					"xpath": "param:xpath",
					"url": "param:url",
					"title": "param:title"
				}
			}
		],
		"xpath": "//button[@aria-label='New mail' and @type='button']",
		"title": "Mail - Robin Ellacott - Outlook",
		"url": "https://outlook.office.com/mail/?nativeVersion=1.2026.407.100",
		"smart_object_description": "A button labeled 'New mail' located in the top-left corner of the application interface, used to initiate the creation of a new email.",
		"smart_actions": {
			"DoClick": "This action simulates a user clicking on the 'New mail' button to start composing a new email. It is expected to open a new email composition window."
		}
	},
	"To": {
		"version": 0,
		"object_type": "HTMLObject",
		"object_flavor": "Cell",
		"object_name": "To",
		"screenshot_path": "Recording/2026-04-23_14-58-34/Step7.png",
		"ignore_object_name": true,
		"object_class": "Selenium",
		"object_role": "",
		"object_text": "",
		"object_library": "Selenium",
		"window_class": "param:object_class",
		"window_name": "Mail - Robin Ellacott - Outlook",
		"locations": [
			{
				"locator_name": "HTML",
				"location": {
					"xpath": "param:xpath",
					"url": "param:url",
					"title": "param:title"
				}
			}
		],
		"xpath": "//div[@aria-label='To']",
		"title": "Mail - Robin Ellacott - Outlook",
		"url": "https://outlook.office.com/mail/?nativeVersion=1.2026.407.100",
		"smart_object_description": "An input field labeled 'To' located within the email composition window, used for entering the recipient's email address.",
		"smart_actions": {
			"DoClick": "This action simulates a user clicking on the 'To' input field to focus it, allowing the user to enter the recipient's email address. It is expected to activate the input field for text entry.",
			"DoSetText": "This action sets the text 'some@user.com' in the 'To' input field. It is expected to populate the recipient's email address in the 'To' field of the email composition window."
		}
	},
	"Subject": {
		"version": 0,
		"object_type": "HTMLObject",
		"object_flavor": "Text",
		"object_name": "Subject",
		"screenshot_path": "Recording/2026-04-23_14-58-34/Step24.png",
		"ignore_object_name": true,
		"object_class": "Selenium",
		"object_role": "",
		"object_text": "",
		"object_library": "Selenium",
		"window_class": "param:object_class",
		"window_name": "Mail - Robin Ellacott - Outlook",
		"locations": [
			{
				"locator_name": "HTML",
				"location": {
					"xpath": "param:xpath",
					"url": "param:url",
					"title": "param:title"
				}
			}
		],
		"xpath": "//input[@aria-label='Subject' and @placeholder='Add a subject' and @type='text']",
		"title": "Mail - Robin Ellacott - Outlook",
		"url": "https://outlook.office.com/mail/?nativeVersion=1.2026.407.100",
		"smart_object_description": "An input field labeled 'Subject' located within the email composition window, used for entering the subject of the email.",
		"smart_actions": {
			"DoClick": "This action simulates a user clicking on the 'Subject' input field to focus it, allowing the user to enter the subject of the email. It is expected to activate the input field for text entry.",
			"DoSetText": "This action sets the text 'Hello there' in the 'Subject' input field. It is expected to populate the subject of the email in the composition window."
		}
	},
	"Message_body": {
		"version": 0,
		"object_type": "HTMLObject",
		"object_flavor": "Cell",
		"object_name": "Message body",
		"screenshot_path": "Recording/2026-04-23_14-58-34/Step29.png",
		"ignore_object_name": true,
		"object_class": "Selenium",
		"object_role": "",
		"object_text": "",
		"object_library": "Selenium",
		"window_class": "param:object_class",
		"window_name": "Mail - Robin Ellacott - Outlook",
		"locations": [
			{
				"locator_name": "HTML",
				"location": {
					"xpath": "param:xpath",
					"url": "param:url",
					"title": "param:title"
				}
			}
		],
		"xpath": "//div[@aria-label='Message body' and @role='textbox']",
		"title": "Mail - Robin Ellacott - Outlook",
		"url": "https://outlook.office.com/mail/?nativeVersion=1.2026.407.100",
		"smart_object_description": "The message body text area within the email composition window, where the content of the email is written.",
		"smart_actions": {
			"DoClick": "This action simulates a user clicking on the message body text area to focus it, allowing the user to enter the content of the email. It is expected to activate the text area for content entry.",
			"DoSetText": "This action sets the text 'Dfff' in the message body text area. It is expected to populate the content of the email with the specified text."
		}
	},
	"Discard": {
		"version": 0,
		"object_type": "HTMLObject",
		"object_flavor": "Button",
		"object_name": "Discard",
		"screenshot_path": "Recording/2026-04-23_14-58-34/Step35.png",
		"ignore_object_name": true,
		"object_class": "Selenium",
		"object_role": "",
		"object_text": "",
		"object_library": "Selenium",
		"window_class": "param:object_class",
		"window_name": "Mail - Robin Ellacott - Outlook",
		"locations": [
			{
				"locator_name": "HTML",
				"location": {
					"xpath": "param:xpath",
					"url": "param:url",
					"title": "param:title"
				}
			}
		],
		"xpath": "//button[@aria-label='Discard' and @title='Discard (Esc)' and @type='button']",
		"title": "Mail - Robin Ellacott - Outlook",
		"url": "https://outlook.office.com/mail/?nativeVersion=1.2026.407.100",
		"smart_object_description": "A button labeled 'Discard' located within the email composition window, used to discard the current draft email.",
		"smart_actions": {
			"DoClick": "This action simulates a user clicking on the 'Discard' button to discard the current draft email. It is expected to open a confirmation dialog asking if the user is sure they want to discard the draft."
		}
	},
	"OK": {
		"version": 0,
		"object_type": "HTMLObject",
		"object_flavor": "Button",
		"object_name": "OK",
		"screenshot_path": "Recording/2026-04-23_14-58-34/Step38.png",
		"ignore_object_name": true,
		"object_class": "Selenium",
		"object_role": "",
		"object_text": "param:object_name",
		"object_library": "Selenium",
		"window_class": "param:object_class",
		"window_name": "Mail - Robin Ellacott - Outlook",
		"locations": [
			{
				"locator_name": "HTML",
				"location": {
					"xpath": "param:xpath",
					"url": "param:url",
					"title": "param:title"
				}
			}
		],
		"xpath": "//div[@role='dialog']/div/div[3]/button[@type='button'][1]",
		"title": "Mail - Robin Ellacott - Outlook",
		"url": "https://outlook.office.com/mail/?nativeVersion=1.2026.407.100",
		"smart_object_description": "A button labeled 'OK' located within a confirmation dialog, used to confirm the action of discarding the current draft email.",
		"smart_actions": {
			"DoClick": "This action simulates a user clicking on the 'OK' button within the confirmation dialog to confirm the discarding of the current draft email. It is expected to close the confirmation dialog and proceed with discarding the draft."
		}
	},
	"People": {
		"version": 0,
		"object_type": "HTMLObject",
		"object_flavor": "Button",
		"object_name": "People",
		"screenshot_path": "Recording/2026-04-23_14-58-34/Step41.png",
		"ignore_object_name": true,
		"object_class": "Selenium",
		"object_role": "",
		"object_text": "",
		"object_library": "Selenium",
		"window_class": "param:object_class",
		"window_name": "Mail - Robin Ellacott - Outlook",
		"locations": [
			{
				"locator_name": "HTML",
				"location": {
					"xpath": "param:xpath",
					"url": "param:url",
					"title": "param:title"
				}
			}
		],
		"xpath": "//button[@aria-label='People' and @type='button' and @role='button']",
		"title": "Mail - Robin Ellacott - Outlook",
		"url": "https://outlook.office.com/mail/?nativeVersion=1.2026.407.100",
		"smart_object_description": "A button labeled 'People' located in the navigation pane on the left side of the application interface, used to access the contacts and directory section.",
		"smart_actions": {
			"DoClick": "This action simulates a user clicking on the 'People' button to navigate to the contacts and directory section of the application. It is expected to display the contacts and directory interface."
		}
	},
	"Mail": {
		"version": 0,
		"object_type": "HTMLObject",
		"object_flavor": "Button",
		"object_name": "Mail",
		"screenshot_path": "Recording/2026-04-23_14-58-34/Step44.png",
		"ignore_object_name": true,
		"object_class": "Selenium",
		"object_role": "",
		"object_text": "",
		"object_library": "Selenium",
		"window_class": "param:object_class",
		"window_name": "People - Robin Ellacott - Outlook",
		"locations": [
			{
				"locator_name": "HTML",
				"location": {
					"xpath": "param:xpath",
					"url": "param:url",
					"title": "param:title"
				}
			}
		],
		"xpath": "//button[@aria-label='Mail' and @type='button' and @role='button']",
		"title": "People - Robin Ellacott - Outlook",
		"url": "https://outlook.office.com/people/?nativeVersion=1.2026.407.100",
		"smart_object_description": "A button labeled 'Mail' located in the navigation pane on the left side of the application interface, used to access the mail section.",
		"smart_actions": {
			"DoClick": "This action simulates a user clicking on the 'Mail' button to navigate to the mail section of the application. It is expected to display the mail interface."
		}
	}
};