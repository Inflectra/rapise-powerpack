const PdfUtil = {

	ConvertMDtoPDF(mdFileName, pdfFileName)
	{
		if (!File.Exists(mdFileName))
		{
			Tester.Assert(`File does not exist: ${mdFileName}`, false);
		}
		File.Delete(pdfFileName);
	
		const deasync = require("deasync");
		const fs = require('fs');
		const markdownpdf = require("markdown-pdf");

		const markdownPdfOptions = {
			// Optional configuration (see markdown-pdf documentation)
			cssPath: Global.GetFullPath("PageObjects\\TestRunner\\style.css"), //  Customize the look with CSS (optional)
			paperFormat: 'A4' // Change paper size (optional)
		};
		
		let done = false;
		async function convertMarkdownToPdf(markdownFilePath, pdfFilePath, options = {}) {
			await markdownpdf(options).from(markdownFilePath).to(pdfFilePath, function () { done = true; });
		}

		const markdownFile = Global.GetFullPath(mdFileName);
		const pdfFile = Global.GetFullPath(pdfFileName);

		convertMarkdownToPdf(markdownFile, pdfFile, markdownPdfOptions);
		deasync.loopWhile(function(){return !done;});
		
		const fileName = pdfFileName.split('\\').pop().split('/').pop();
		if (File.Exists(pdfFileName))
		{
			
			Tester.Message(`PDF report generated: ${fileName}`, new SeSReportLink(pdfFileName));
		}
		else
		{
			Tester.Assert(`PDF report generated: ${fileName}`, false);
		}
	},
	
	ConvertJsonltoPdf(jsonlFileName, pdfFileName)
	{
		if (!File.Exists(jsonlFileName))
		{
			Tester.Assert(`File does not exist: ${jsonlFileName}`, false);
		}
		File.Delete(pdfFileName);
	
		const deasync = require("deasync");
		const fs = require("fs");
		const sharp = require("sharp");
		const PdfPrinter = require("pdfmake");

		function findAttribute(name, attributes) {
			const attr = attributes.find(a => a.name === name);
			return attr ? attr.value : '';
		}
	
		async function convertToJpgAsync(dataEntry) {
			try
			{
				const buffer = Buffer.from(dataEntry.value, 'base64');
				const image = await sharp(buffer);
				const dimensions = await image.metadata();
				const width = dimensions.width < 500 ? dimensions.width : 500;
		
				const jpgBuffer = await sharp(buffer).jpeg({ quality: 100 }).toBuffer();
				dataEntry.value =  `data:image/jpeg;base64,${jpgBuffer.toString('base64')}`;
				dataEntry.width = width;
			}
			catch(error)
			{
				console.log(`Error converting image: ${error}`);
			}
		}
		

		// Function to extract data for a single table entry
		async function getTableData(entry, index) 
		{
			const attributes = entry.attributes || []; // Ensure 'attributes' exists
			const data = [];
		
			// Extract the required fields, handling potential missing attributes
			const step = index + 1; // 1-based index
			const type = findAttribute('type', attributes);
			const status = findAttribute('status', attributes);
			const at = findAttribute('at', attributes);
			const name = findAttribute('name', attributes);
			const comment = findAttribute('comment', attributes);
		
			//additional handling for status
			const statusStyle = status === 'Fail' ? 'failed' : status === 'Pass' ? 'passed': "info";
		
			// Create the table row
			data.push(
				[
					{ text: step, style: 'tableCell' },
					{ text: type, style: 'tableCell' },
					{ text: status, style: statusStyle },
					{ text: at, style: 'tableCell' },
					{ text: name, style: 'tableCell' },
					{ text: comment, style: 'tableCell' }
				]
			);
		
			const additionalData = await getAdditionalData(entry);
			if (additionalData.length > 0) {
				data.push(...additionalData);
			}	
		
			return data;
		}

		async function getAdditionalData(entry) {
			let additionalData = [];
			if (entry.data && Array.isArray(entry.data) && entry.data.length > 0) {
				for(let i=0; i<entry.data.length; i++) {
					const dataEntry = entry.data[i];
					const attributes = dataEntry.attributes || [];
		
					const type = findAttribute('type', attributes);
					const valueText = dataEntry.value;
		
					if (type == "image") {
					
						additionalData.push(
							[
								{ image: valueText, width: dataEntry.width < 500 ? dataEntry.width : 500, style: 'tableCell', colSpan: 6 },
								{},
								{},
								{},
								{},
								{}
							]);
					} else {
						additionalData.push(
							[
								{ text: valueText, style: 'tableCell', colSpan: 6 },
								{},
								{},
								{},
								{},
								{}
							]
						);
					}
				}
			}	
			return additionalData;
		}

		// Function to build the entire PDF document
		async function buildDocumentDefinition(title, entries) {
			const content = [ 
				{ text: title, style: 'header' }
			];
		
			// Iterate through each entry in the JSON and create a table for each
			let tableData = [];
			for(let index = 0; index < entries.length; index++) {
				const entry = entries[index];
				const entryTableData = await getTableData(entry, index);
				tableData.push(...entryTableData);
			}
		
			content.push(
				{
					table: {
						headerRows: 1,
						widths: ['auto', 'auto', 'auto', 'auto', 125, 125], // Adjust widths as needed. '*' means distribute equally
						body: [
							// Header row
							[
								{ text: '#', style: 'tableHeader' },
								{ text: 'Type', style: 'tableHeader' },
								{ text: 'Status', style: 'tableHeader' },
								{ text: 'Start', style: 'tableHeader' },
								{ text: 'Name', style: 'tableHeader' },
								{ text: 'Comment', style: 'tableHeader' }
							],
							// Data rows (extracted by getTableData)
							...tableData,
						]
					},
					layout: 'lightHorizontalLines', // optional table layout
					margin: [0, 20, 0, 20]  // Add some margin around each table (top, right, bottom, left)
				}
			);	
		
			return {
				content: content,
				styles: {
					header: {
						fontSize: 18,
						bold: true,
						margin: [0, 0, 0, 20]
					},
					tableHeader: {
						bold: true,
						fontSize: 12,
						color: 'black'
					},
					tableCell: {
						fontSize: 10
					},
					passed: {
						bold: true,
						color: 'green'
					},
					failed: {
						bold: true,
						color: 'red'
					},
					info: {
						bold: true,
						color: 'black'
					}
				},
				defaultStyle: {
					font: 'Roboto'
				}
			};
		}
		
		async function processJsonlInChunks(filePath, chunkSizeInMB, processJsonObject) {
		
			const fs = require('fs');
			const { StringDecoder } = require('string_decoder');
		
			const chunkSizeInBytes = chunkSizeInMB * 1024 * 1024;
			const decoder = new StringDecoder('utf8');
			
			try
			{
				const fd = fs.openSync(filePath, 'r');
			
				let buffer = Buffer.alloc(chunkSizeInBytes);
				let bytesRead = 0;
				let leftover = '';
				let lineNumber = 0;
			
				while ((bytesRead = fs.readSync(fd, buffer, 0, chunkSizeInBytes, null)) > 0) 
				{
					let chunk = decoder.write(buffer.slice(0, bytesRead));
					let lines = (leftover + chunk).split('\n');
			
					leftover = lines.pop(); // Save incomplete line for next chunk
			
					for (const line of lines) 
					{
						lineNumber++;
						if (!line.trim()) continue; // Skip empty lines
						try 
						{
							const jsonObject = JSON.parse(line);
							await processJsonObject(jsonObject); // Process each object synchronously
						} 
						catch (error) 
						{
							Log(`Error parsing JSON on line ${lineNumber}: ${error}`);
							Log(`Bad line: ${line}`);
						}
					}
				}
			
				// Process any remaining data in `leftover`
				if (leftover.trim()) 
				{
					lineNumber++;
					try 
					{
						const jsonObject = JSON.parse(leftover);
						processJsonObject(jsonObject);
					} 
					catch (error) 
					{
						Log(`Error parsing JSON on line ${lineNumber}: ${error}`);
						Log(`Bad line: ${leftover}`);
					}
				}
			
				fs.closeSync(fd); // Close file descriptor
				Log("Finished processing the file.");
			
			} 
			catch (error) 
			{
				Log(`An error occurred: ${error}`);
			}
		}
		
		let done = false;
		async function convertJsonlToPdf() {
			const start = new Date();

			let jsonData = { entries: [] };
			let numberOfEntries = 0;
			await processJsonlInChunks(jsonlFileName, 1, async (entry) => {
				numberOfEntries++;
				jsonData.entries.push(entry);
				if (entry.data && Array.isArray(entry.data) && entry.data.length > 0) {
					for(let i=0; i<entry.data.length; i++) {
						const dataEntry = entry.data[i];
						const attributes = dataEntry.attributes || [];
						const type = findAttribute('type', attributes);
						if (type == "image") {
							await convertToJpgAsync(dataEntry);
						}
					}
				}
			});

			const end = new Date();
			const elapsed = (end - start) / 1000;
			
			console.log(`${numberOfEntries} report entries fetched in ${elapsed} seconds`);
			
			const vfs = await require('pdfmake/build/vfs_fonts.js');

			const fonts = {
				Roboto: {
					normal: Buffer.from(vfs['Roboto-Regular.ttf'], 'base64'),
					bold: Buffer.from(vfs['Roboto-Medium.ttf'], 'base64'),
					italics: Buffer.from(vfs['Roboto-Italic.ttf'], 'base64'),
					bolditalics: Buffer.from(vfs['Roboto-MediumItalic.ttf'], 'base64'),
				}
			};

			const printer = new PdfPrinter(fonts);

			const documentDefinition = await buildDocumentDefinition("Report Title", jsonData.entries);
			const pdfDoc = printer.createPdfKitDocument(documentDefinition);

			const stream = fs.createWriteStream(pdfFileName);
			stream.on('finish', () => { 
				console.log(`PDF file written: ${pdfFileName}`);
				done = true;
			});
			pdfDoc.pipe(stream);
			pdfDoc.end();
		}

		jsonlFileName = Global.GetFullPath(jsonlFileName);
		pdfFileName = Global.GetFullPath(pdfFileName);

		convertJsonlToPdf();
		deasync.loopWhile(function(){return !done;});
		
		const fileName = pdfFileName.split('\\').pop().split('/').pop();
		if (File.Exists(pdfFileName))
		{
			
			Tester.Message(`PDF report generated: ${fileName}`, new SeSReportLink(pdfFileName));
		}
		else
		{
			Tester.Assert(`PDF report generated: ${fileName}`, false);
		}
	}
}
