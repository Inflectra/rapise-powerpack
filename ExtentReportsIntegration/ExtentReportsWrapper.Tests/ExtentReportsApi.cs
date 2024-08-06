using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.IO;

namespace ExtentReportsWrapper.Tests
{
    [TestClass]
    public class ExtentReportsApi
    {
        private string curDir;
        private string dataDir;

        public ExtentReportsApi()
        {
            this.curDir = Directory.GetCurrentDirectory();
            this.dataDir = Path.Combine(curDir, @"..\..\TestData");
        }

        [TestMethod]
        public void TestMethod1()
        {
            string fileName = Path.Combine(dataDir, @"ExtentReport.html");
            ExtentReportsWrapper erw = new ExtentReportsWrapper();
            erw.Hello(fileName);
            Assert.AreEqual(1, 1);
        }
    }
}
