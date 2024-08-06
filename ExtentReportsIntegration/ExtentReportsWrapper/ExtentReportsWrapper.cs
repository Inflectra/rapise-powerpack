using AventStack.ExtentReports;
using AventStack.ExtentReports.Reporter;
using System.Runtime.InteropServices;

namespace ExtentReportsWrapper
{
    [System.Runtime.InteropServices.ComVisible(true)]
    [ClassInterface(ClassInterfaceType.AutoDual)]
    [ProgId("ExtentReportsWrapper.ExtentReportsWrapper")]
    public class ExtentReportsWrapper
    {
        ExtentReports extent = new ExtentReports();

        public void CreateSparkReporter(string filePath)
        {
            ExtentSparkReporter htmlReporter = new ExtentSparkReporter(filePath);
            htmlReporter.Config.JS =
@"
var imgs = document.querySelectorAll('a[data-featherlight=\'image\']');

for (var i = 0; i < imgs.length; i++)
{
    var img = imgs[i];
    var imgData = img.getAttribute('href');
    var span = img.querySelector('span');
    img.removeChild(span);
    var imgThumbnail = document.createElement('img');
    imgThumbnail.className = 'r-img';
    imgThumbnail.setAttribute('src', imgData);
    img.appendChild(imgThumbnail);
}

console.log('Screenshot thumbnails created: ' + imgs.length);
";

            string jsonPath = filePath.Replace(".html", ".json");
            ExtentJsonFormatter json = new ExtentJsonFormatter(jsonPath);
            
            ExtentReports extent = new ExtentReports();
            this.extent.AttachReporter(json);
            this.extent.AttachReporter(htmlReporter);
            this.extent.CreateDomainFromJsonArchive(jsonPath);
        }

        public ExtentTestWrapper CreateTest(string name, string description = "") 
        { 
            ExtentTest test = this.extent.CreateTest(name, description);
            return new ExtentTestWrapper(test);
        }

        public void Flush()
        { 
            this.extent.Flush();
        }

        public string Hello(string filePath)
        {
            CreateSparkReporter(filePath);

            var test = CreateTest("MyFirstTest");

            test.Log("Pass", "This is a logging event for MyFirstTest, and it passed!");

            Flush();

            return "Hello from ExtentReportsWrapper";
        }
    }
}
