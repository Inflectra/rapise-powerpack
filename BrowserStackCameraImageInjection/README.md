![Download](https://github.githubassets.com/images/icons/emoji/unicode/23ec.png?v8) [Download Now](https://inflectra.github.io/DownGit/#/home?url=https://github.com/Inflectra/rapise-powerpack/tree/master/BrowserStackCameraImageInjection)

# BrowserStack Camera Image Injection

This Framework demonstrates how to do 

## Test Camera image capture and QR/Barcode scanning

> BrowserStack enables you to test image capture and QR/Bar code scanning from BrowserStack’s mobile device camera. If your mobile app has features, such as check scanning, profile image capture, and QR/Bar code scanning, you can use this feature to automate the testing of such a feature in your app.
    
More details:

[https://www.browserstack.com/docs/app-automate/appium/advanced-features/camera-image-injection#1-how-browserstack-enables-camera-testing](https://www.browserstack.com/docs/app-automate/appium/advanced-features/camera-image-injection#1-how-browserstack-enables-camera-testing)
    
## Configuring the Framework

### Config.json

This file is located in the root of the framework. Use it to set BrowserStack User Name and Access Key.

### Sample Application

The sample application was built from 

https://github.com/ionic-team/tutorial-photo-gallery-angular

Find it in the root folder of the framework. Upload ionic-demo-app.apk to BrowserStack and save the application URL, it looks like:  bs://3da26db3498dbe59aa76b06361907158fdf2d56e

Change the `BrowserStack Android App` profile and set `app` capability to this URL.

### Run the Test

Run `ImageGallery` test case and find a cat in screenshots captured by Rapise.





