

function IncludeFolder(/**string*/folderPath) {
	SeSEachFile(folderPath, '*.js', function(f) {
		Log("Including file: "+f);
		eval(File.Include(f));
	},
	true // true for non-recursive
	);
}

IncludeFolder("%WORKDIR%/F1");