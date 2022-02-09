//Use 'Record/Learn' button to begin test recording

function Test(params)
{
/*
	Spira_GenerateReport(scope, reportName, incidentId, projectId)
 
 	scope is one of:
 		- ID of a project, e.g. 97, project to query for latest test set run performed today
 		- Array of project IDs, e.g. [9, 23, 90], projects to query for latest test set runs performed today
 		- Array of objects, e.g. {projectId: 90, testSetIds[238]}, projects and selected test sets to query for latest runs
 	reportName:
 		- Report file name, optional, default - Report.html
 	incidentId:
 		- Incident ID for comments and email notifications, optional
 	projectId:
 		- Upload report to the project with this ID, optional
 
*/

	Spira_GenerateReport(97);

//	Spira_GenerateReport(97, "Report.html");

//	Spira_GenerateReport(97, "Report.html", 645);

//	Spira_GenerateReport([9, 23, 90], "Report.html", 645, 97);
		
//	Spira_GenerateReport([{projectId: 90, testSetIds: [238]}], "Report.html", 645, 97);
	
	Tester.Assert("Report generated", true);
}



