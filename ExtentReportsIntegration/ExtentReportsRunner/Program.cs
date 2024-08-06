using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ExtentReportsWrapper.Runner
{
    internal class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Hello, World!");
            string curDir = Directory.GetCurrentDirectory();
            string fileName = Path.Combine(curDir, @"..\..\..\ExtentReport.html");

            ExtentReportsWrapper erw = new ExtentReportsWrapper();
            erw.Hello(fileName);

        }
    }
}
