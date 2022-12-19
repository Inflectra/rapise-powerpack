//Use 'Record/Learn' button to begin test recording

function Test(params)
{
	File.DeleteFolder('%WORKDIR%/Checkpoints');
	File.CreateFolder('%WORKDIR%/Checkpoints');
	File.Delete('%WORKDIR%/Checkpoints/books_cp.txt');
	// Auto-created
	Checkpoint.AssertTextFile('%WORKDIR%/Checkpoints/books_cp.txt', '%WORKDIR%/Data/books.txt', true);
	
	// Re-use auto created
	Checkpoint.AssertTextFile('%WORKDIR%/Checkpoints/books_cp.txt', '%WORKDIR%/Data/books.txt');

	File.Delete('%WORKDIR%/Checkpoints/books_cp.json');
	Checkpoint.AssertTextFile('%WORKDIR%/Checkpoints/books_cp.json', '%WORKDIR%/Data/books.txt', true);
	Checkpoint.AssertTextFile('%WORKDIR%/Checkpoints/books_cp.json', '%WORKDIR%/Data/books.txt');

	File.Delete('%WORKDIR%/Checkpoints/books_cp.xlsx');
	// The same checkpoint in Excel format
	Checkpoint.AssertTextFile('%WORKDIR%/Checkpoints/books_cp.xlsx', '%WORKDIR%/Data/books.txt', true);
	Checkpoint.AssertTextFile('%WORKDIR%/Checkpoints/books_cp.xlsx', '%WORKDIR%/Data/books.txt');

	// Re-use it with a modified text file
	Checkpoint.AssertTextFile('%WORKDIR%/Checkpoints/books_cp.xlsx', '%WORKDIR%/Data/books1.txt');

	File.Delete('%WORKDIR%/Checkpoints/png1.json');
	// Compare .png file using binary format
	Checkpoint.AssertBinary('%WORKDIR%/Checkpoints/png1.txt', '%WORKDIR%/Data/PDF216.png', true);
	Checkpoint.AssertBinary('%WORKDIR%/Checkpoints/png1.json', '%WORKDIR%/Data/PDF216.png', true);
	Checkpoint.AssertBinary('%WORKDIR%/Checkpoints/png1.json', '%WORKDIR%/Data/PDF216.png');
	Checkpoint.AssertBinary('%WORKDIR%/Checkpoints/png1.json', '%WORKDIR%/Data/PDF232.png');

	File.Delete('%WORKDIR%/Checkpoints/pdf1.json');
	Checkpoint.AssertPdf('%WORKDIR%/Checkpoints/pdf1.json', '%WORKDIR%/Data/pdf1.pdf', true);
	Checkpoint.AssertPdf('%WORKDIR%/Checkpoints/pdf1.json', '%WORKDIR%/Data/pdf1.pdf');
	
	RVL.DoPlayScript("Main.rvl.xlsx", Tester.GetParam("sheetName", "RVL"));
}

