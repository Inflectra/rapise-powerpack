const fs = require('fs');
const pdf = require('pdf-parse');
let process = require('process');
 
let inputPath = process.argv[2];
let outputPath= process.argv[3];
let dataBuffer = fs.readFileSync(inputPath);


function render_page(pageData) {
    //check documents https://mozilla.github.io/pdf.js/
    let render_options = {
        //replaces all occurrences of whitespace with standard spaces (0x20). The default value is `false`.
        normalizeWhitespace: true,
        //do not attempt to combine same line TextItem's. The default value is `false`.
        disableCombineTextItems: true
    }
 
    return pageData.getTextContent(render_options)
    .then(function(textContent) {
        let text = '';
        let lines = {};
        for (let item of textContent.items) {
            let Y = Math.round(item.transform[5]);
            let X = item.transform[4];
            if(!lines[Y]) lines[Y] = {}
            lines[Y][X] = item.str;
        }

        for( let lineY of Object.keys(lines).sort( (a,b)=>parseFloat(b)-parseFloat(a) ) ) {
            let line = lines[lineY];
            let lsep = "";
            for(let lineX of Object.keys(line).sort( (a,b)=>parseFloat(a)-parseFloat(b) )) {
                let str = line[lineX];
                text+=lsep+str; 
                lsep = "\t";
            }
            text+="\n";
        }


        return text;
    });
}

let options = {
    pagerender: render_page
}

pdf(dataBuffer, options).then(function(data) {
 
    // number of pages
    console.log(data.numpages);
    // number of rendered pages
    console.log(data.numrender);
    // PDF info
    console.log(data.info);
    // PDF metadata
    console.log(data.metadata); 
    // PDF.js version
    // check https://mozilla.github.io/pdf.js/getting_started/
    console.log(data.version);
    // PDF text
    console.log(data.text); 
    fs.writeFileSync(outputPath, data.text)
});