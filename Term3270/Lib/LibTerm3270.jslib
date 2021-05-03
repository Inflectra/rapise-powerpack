
SeSRegisterLibrary(
	{
		name: 'Term3270',
        description: 'Term3270 - Default user-defined library',
		include: 'Lib/LibTerm3270/LibTerm3270.js',
		info: null,
		load_order: 1000,   
        recording: false, // Only use in playback. If it has recording rules then set it to 'true'
		autoload: true // Always load this library for this test and each subtest
    }
);