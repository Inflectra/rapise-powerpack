
SeSRegisterLibrary(
	{
		name: 'CucumberJs',
        description: 'CucumberJs - Default cucumberjs wrapper for Rapise',
		include: 'Lib/LibCucumberJs/LibCucumberJs.js',
		info: null,
		load_order: 1000,   
        recording: false, // Only use in playback. If it has recording rules then set it to 'true'
		autoload: true // Always load this library for this test and each subtest
    }
);