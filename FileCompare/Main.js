//Use 'Record/Learn' button to begin test recording

function Test(params)
{
	File.Delete('%WORKDIR%/Data/books_cp.txt');
	// Auto-created
	Checkpoint.AssertTextFile('%WORKDIR%/Data/books_cp.txt', '%WORKDIR%/Data/books.txt', true);
	
	// Re-use auto created
	Checkpoint.AssertTextFile('%WORKDIR%/Data/books_cp.txt', '%WORKDIR%/Data/books.txt');

	File.Delete('%WORKDIR%/Data/books_cp.json');
	Checkpoint.AssertTextFile('%WORKDIR%/Data/books_cp.json', '%WORKDIR%/Data/books.txt', true);
	Checkpoint.AssertTextFile('%WORKDIR%/Data/books_cp.json', '%WORKDIR%/Data/books.txt');

	File.Delete('%WORKDIR%/Data/books_cp.xlsx');
	// The same checkpoint in Excel format
	Checkpoint.AssertTextFile('%WORKDIR%/Data/books_cp.xlsx', '%WORKDIR%/Data/books.txt', true);
	Checkpoint.AssertTextFile('%WORKDIR%/Data/books_cp.xlsx', '%WORKDIR%/Data/books.txt');

	// Re-use it with a modified text file
	Checkpoint.AssertTextFile('%WORKDIR%/Data/books_cp.xlsx', '%WORKDIR%/Data/books1.txt');

	File.Delete('%WORKDIR%/Data/png1.json');
	// Compare .png file using binary format
	Checkpoint.AssertBinary('%WORKDIR%/Data/png1.txt', '%WORKDIR%/Data/PDF216.png', true);
	Checkpoint.AssertBinary('%WORKDIR%/Data/png1.json', '%WORKDIR%/Data/PDF216.png', true);
	Checkpoint.AssertBinary('%WORKDIR%/Data/png1.json', '%WORKDIR%/Data/PDF216.png');
	Checkpoint.AssertBinary('%WORKDIR%/Data/png1.json', '%WORKDIR%/Data/PDF232.png');

	File.Delete('%WORKDIR%/Data/pdf1.json');
	Checkpoint.AssertPdf('%WORKDIR%/Data/pdf1.json', '%WORKDIR%/Data/pdf1.pdf', true);
	Checkpoint.AssertPdf('%WORKDIR%/Data/pdf1.json', '%WORKDIR%/Data/pdf1.pdf');
	
	RVL.DoPlayScript("Main.rvl.xlsx", Tester.GetParam("sheetName", "RVL"));
}

