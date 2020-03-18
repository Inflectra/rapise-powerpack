
SeSRegisterLibrary(
	{
		name: 'MetaTable',
        description: 'MetaTable - Default user-defined library',
		include: 'Lib/LibMetaTable/LibMetaTable.js',
		info: null,
		load_order: 1000,   
        recording: true, // Only use in playback. If it has recording rules then set it to 'true'
		autoload: true // Always load this library for this test and each subtest
    }
);