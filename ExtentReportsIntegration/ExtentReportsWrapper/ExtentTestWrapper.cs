using AventStack.ExtentReports;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace ExtentReportsWrapper
{
    [System.Runtime.InteropServices.ComVisible(true)]
    [ClassInterface(ClassInterfaceType.AutoDual)]
    [ProgId("ExtentReportsWrapper.ExtentTestWrapper")]
    public class ExtentTestWrapper
    {
        private ExtentTest test;
        public ExtentTestWrapper(ExtentTest test) 
        {
            this.test = test;
        }

        public ExtentTestWrapper Log(string status, string details)
        {
            Status _status = Status.Info;
            Enum.TryParse(status, out _status);
            test.Log(_status, details);
            return this;
        }

        public ExtentTestWrapper LogScreenshot(string base64, string title)
        {
            test.Log(Status.Info, title, null, MediaEntityBuilder.CreateScreenCaptureFromBase64String(base64).Build());
            return this;
        }

        public ExtentTestWrapper AddScreenCaptureFromPath(string filePath)
        { 
            test.AddScreenCaptureFromPath(filePath);
            return this;
        }

        public ExtentTestWrapper AddScreenCaptureFromBase64String(string base64, string title = null)
        {
            test.AddScreenCaptureFromBase64String(base64, title);
            return this;
        }
    }
}
