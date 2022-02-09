const fs = require('fs');
const { diff, formats } = require('myers-diff');

const inputPath = 'input.json';
const outputPath = 'output.json'

const inputData = fs.readFileSync(inputPath);

const inputObj = JSON.parse(inputData);
const resultObj = {};

let lhs = ""+fs.readFileSync(inputObj.lhs);
let rhs = ""+fs.readFileSync(inputObj.rhs);
const opts = inputObj.opts || {
    compare: 'lines',
    ignoreWhitespace: false,
    ignoreCase: false,
    ignoreAccents: false
};

if(opts.ignoreWhitespace) {
    lhs = lhs.replace(/\r?\n/gi, '\n').replace(/\r/gi, '\n')
    .replace(/(^[\s\xA0]+)|([\s\xA0]+$)/g, "")
    .replace(/^\s*$(?:\r\n?|\n)/gm, '\n')
        .replace(/\n\n/gi, '\n')
        .replace(/\n\n/gi, '\n')
        .replace(/\n\n/gi, '\n')
        .replace(/\n\n/gi, '\n')
        .replace(/\n\n/gi, '\n');
    fs.writeFileSync("lhs1.txt", lhs);
    rhs = rhs.replace(/\r?\n/gi, '\n').replace(/\r/gi, '\n')
    .replace(/(^[\s\xA0]+)|([\s\xA0]+$)/g, "")
        .replace(/^\s*$(?:\r\n?|\n)/gm, '\n')
        .replace(/\n\n/gi, '\n')
        .replace(/\n\n/gi, '\n')
        .replace(/\n\n/gi, '\n')
        .replace(/\n\n/gi, '\n')
        .replace(/\n\n/gi, '\n');
    fs.writeFileSync("rhs1.txt", rhs);
}

const changes = diff(lhs, rhs, opts);

console.log(formats.GnuNormalFormat(changes));
console.log(changes);

resultObj.changes = changes;
resultObj.diff = formats.GnuNormalFormat(changes);

// Finally, write results to the output
fs.writeFileSync(outputPath, JSON.stringify(resultObj))
