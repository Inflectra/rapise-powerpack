  const { SummaryFormatter, formatterHelpers, Status } = require('@cucumber/cucumber')
  class CucTesterFormat extends SummaryFormatter {
    constructor(options) {
      super(options)
      options.eventBroadcaster.on('envelope', (envelope) => {
        if (envelope.testCaseFinished) {
          this.logTestCaseFinished(envelope.testCaseFinished)
        }
      })
    }
    
   
    logTestCaseFinished(testCaseFinished) {
      const testCaseAttempt = this.eventDataCollector.getTestCaseAttempt(testCaseFinished.testCaseStartedId)
      var msg = testCaseAttempt.gherkinDocument.feature.name + ' / ' + testCaseAttempt.pickle.name;
      Tester.BeginTest('Feature: '+msg);
      this.log(msg + '\n')
      const parsed = formatterHelpers.parseTestCaseAttempt({
        cwd: this.cwd,
        snippetBuilder: this.snippetBuilder, 
        supportCodeLibrary: this.supportCodeLibrary,
        testCaseAttempt 
      })
      var allSteps = "";
      var allStepsPassed = true;
      parsed.testSteps.forEach(testStep => {
        var stepMsg = testStep.keyword + (testStep.text || '') + ' - ' + Status[testStep.result.status];
        this.log('  ' + stepMsg + '\n')
        allSteps+=stepMsg+"<br/>";
        allStepsPassed = allStepsPassed&&testStep.result.status==1;
      })
      Tester.Assert(msg, allStepsPassed, allSteps);
      this.log('\n')
      Tester.EndTest();
    }
  }
  module.exports = CucTesterFormat