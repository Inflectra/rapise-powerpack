
function Spira_GenerateTestSummaryReport(htmlName, projectId, incidentId)
{
	var text = File.Read(htmlName);
	var upto = text.indexOf("</body>")
	if(upto>0) {
		text = text.substring(0, upto);
	}
	var from = text.indexOf("<body>");
	if(from>0) {
		text = text.substring(from + "<body>".length);
	}
	
	var testStatus = Tester.GetTestStatus();
	var testName = g_tempVals.fso.GetFileName(g_tempVals.fso.GetParentFolderName(g_scriptFileName));
	var statusText = testName +": "+ (testStatus==1?"Passed":"Failed");
	
	SpiraUtil_UploadReport(htmlName, text, statusText, projectId, incidentId);
}


function SpiraUtil_UploadReport(reportFileName, reportText, subject, projectId, incidentId)
{
	if (!projectId)
	{
		if (incidentId)
		{
			Log("Specify parent project id for the incident: " + incidentId, false);
		}
		else
		{
			Log("No incident specified, skip report uploading");
		}
		return;
	}

	var config = SpiraApiUtil_GetSpiraConfig();
	var serverUrl = config.SpiraServer;

	var reportFolderName = "Test Execution Reports";
	var documentFolders = SpiraUtil_LoadDocumentFolders(projectId);
	if (documentFolders)
	{
		var rootDocumentFolderId;
		var reportsFolderId;
		for(var i = 0; i < documentFolders.length; i++)
		{
			var df = documentFolders[i];
			if (df.ParentProjectAttachmentFolderId == null)
			{
				rootDocumentFolderId = df.ProjectAttachmentFolderId;
			}
			
			if (df.Name == reportFolderName)
			{
				reportsFolderId = df.ProjectAttachmentFolderId;
			}
		}
		
		if (!reportsFolderId)
		{
			reportsFolderId = SpiraUtil_CreateDocumentFolder(projectId, rootDocumentFolderId, reportFolderName);
		}
		
		if (reportsFolderId)
		{
			var defaultDocumentTypeId;
			var documentTypes = SpiraUtil_LoadDocumentTypes(projectId);
			if (documentTypes)
			{
				for(var i = 0; i < documentTypes.length; i++)
				{
					var dt = documentTypes[i];
					if (dt.Default == true)
					{
						defaultDocumentTypeId = dt.DocumentTypeId;
						break;
					}
				}
				
				if (defaultDocumentTypeId)
				{
					var name = UtilGetPaddedZeroesDateTime(new Date()) + " " + reportFileName;
					var base64String = g_util.ByteArrayAsBase64(g_util.ReadFileAsByteArray(Global.GetFullPath(reportFileName)));
					var document = SpiraUtil_UploadDocument(projectId, reportsFolderId, defaultDocumentTypeId, name, base64String)
					if (document && incidentId)
					{
						// summary
						var text = reportText+"<hr/>";
					
						// back link
						var backlink = serverUrl + projectId + "/Document/" + document.AttachmentId + "/Preview.aspx";

						text+='<a target="_blank" href="' + backlink + '">Open report in Spira</a>';
						
						Tester.Message("Updating incident subject");
						// update incident subject
						var incident = SpiraUtil_GetIncidentById(projectId, incidentId);
						if (incident)
						{
							incident.Name = subject;
							Tester.Message("New subject: " + incident.Name);
							SpiraUtil_UpdateIncident(projectId, incident);
						}
						
						// add comment to an incident
						SpiraUtil_AddIncidentComment(projectId, incidentId, text);
					}
				}
			}
		}
	}
}

function SpiraUtil_AddIncidentComment(projectId, incidentId, text)
{
	var query = "projects/{project_id}/incidents/{incident_id}/comments"
	var postData = [{"Text": text}];
	
	var req = SpiraApiUtil_GetSpiraRequest("POST", query);
	req.SetParameter('project_id', projectId);
	req.SetParameter('incident_id', incidentId);
	req.SetRequestBodyObject(postData);	

	var response = req._DoExecute();
	
	if(response.status)
	{
		var comment = req.GetResponseBodyObject();
		return comment;
	} else {
		SpiraApiUtil_LogError('Failed to add comment to incident: ' + incidentId);
		return false;
	}
}


function SpiraUtil_UploadDocument(projectId, documentFolderId, documentTypeId, name, base64String)
{
	var query = "projects/{project_id}/documents/file";
	var postData = 
	{
		BinaryData: base64String,
		AttachmentTypeId: 1,
		DocumentTypeId: documentTypeId,
		ProjectAttachmentFolderId: documentFolderId,
		FilenameOrUrl: name,
		ProjectId: projectId,
		Tags: "report"
	};

	var req = SpiraApiUtil_GetSpiraRequest("POST", query);
	req.SetParameter('project_id', projectId);
	req.SetRequestBodyObject(postData);	

	var response = req._DoExecute();
	
	if(response.status)
	{
		var document = req.GetResponseBodyObject();
		return document;
	} else {
		SpiraApiUtil_LogError('Failed to upload document in project: ' + projectId);
		return false;
	}
}

function SpiraUtil_LoadDocumentTypes(projectId)
{
	var project = SpiraUtil_GetProject(projectId);
	
	if (!project)
	{
		return null;
	}
	
	var projectTemplateId = project.ProjectTemplateId;
	var query = "project-templates/{project_template_id}/document-types?active_only=true";
	
	var req = SpiraApiUtil_GetSpiraRequest("GET", query);
	req.SetParameter('project_template_id', projectTemplateId);
	
	var response = req._DoExecute();
	
	if(response.status)
	{
		var documentTypes = req.GetResponseBodyObject();
		return documentTypes;
	} else {
		SpiraApiUtil_LogError('Failed to load document types in project: ' + projectId);
		return false;
	}
}

function SpiraUtil_GetProject(projectId)
{
	var query = "projects/{project_id}";
	var req = SpiraApiUtil_GetSpiraRequest("GET", query);
	req.SetParameter('project_id', projectId);
	
	var response = req._DoExecute();
	
	if(response.status)
	{
		var project = req.GetResponseBodyObject();
		return project;
	} else {
		SpiraApiUtil_LogError('Failed to load project: ' + projectId);
		return false;
	}
}

function SpiraUtil_CreateDocumentFolder(projectId, parentFolderId, name)
{
	var query = "projects/{project_id}/document-folders";
	
	var postData = {"ParentProjectAttachmentFolderId": parentFolderId, "Name": name};
	
	var req = SpiraApiUtil_GetSpiraRequest("POST", query);
	req.SetParameter('project_id', projectId);
	req.SetRequestBodyObject(postData);
	
	var response = req._DoExecute();
	
	if(response.status)
	{
		var documentFolder = req.GetResponseBodyObject();
		return documentFolder.ProjectAttachmentFolderId;
	} else {
		SpiraApiUtil_LogError('Failed to create report folder in project: ' + projectId);
		return false;
	}
}

function SpiraUtil_LoadDocumentFolders(projectId)
{
 	var query = "projects/{project_id}/document-folders";
	
	var req = SpiraApiUtil_GetSpiraRequest("GET", query);
	req.SetParameter('project_id', projectId);
	
	var response = req._DoExecute();
	
	if(response.status)
	{
		var folders = req.GetResponseBodyObject();
		return folders;
	} else {
		SpiraApiUtil_LogError('Faield to load document folders in project: ' + projectId);
		return false;
	}
}

function SpiraUtil_GetIncidentById(projectId, incidentId)
{
	var req = SpiraApiUtil_GetSpiraRequest("GET", "projects/{project_id}/incidents/{incident_id}");
	
	req.SetParameter('project_id', projectId);
	req.SetParameter('incident_id', incidentId);
	
	var response = req._DoExecute();
	
	if(response.status)
	{
		var incident = req.GetResponseBodyObject();
		return incident;
	} 
	else 
	{
		SpiraApiUtil_LogError("Incident not found: " + incidentId + " in project: " + projectId);
		return false;
	}
}

function SpiraUtil_UpdateIncident(projectId, incident)
{
	var req = SpiraApiUtil_GetSpiraRequest("PUT", "projects/{project_id}/incidents/{incident_id}");
	
	req.SetParameter("project_id", projectId);
	req.SetParameter("incident_id", incident.IncidentId);
	req.SetRequestBodyObject(incident);
	
	var response = req._DoExecute();
	
	if(response.status)
	{
		var incident = req.GetResponseBodyText();
		return incident;
	} 
	else 
	{
		SpiraApiUtil_LogError("Incident not updated: " + incident.IncidentId + " in project: " + projectId);
		return false;
	}
}


