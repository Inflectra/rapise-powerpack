/** @ignore */
function _CreateFromStringJson( /**string*/ txt, /**bool*/ regex) {
	var res = {};
	var data = [];
	res.data = data;
	if (l2) Log2("File read, length: " + txt.length);
	var re = /\r\n|\n\r|\n|\r/g;
	var lines = txt.replace(re, "\n").split("\n");
	if (l2) Log2("File lines: " + lines.length);
	for (var i = 0; i < lines.length; i++) {
		var lno = UtilPadZeroes(i + 1, 3);
		var ln = lines[i];
		var r = 0;
		if (regex) {
			r = 1;
			ln = _SeSEscapeRegExp(ln);
		}
		data.push({
			n: lno,
			c: 1,
			r: r,
			t: ln
		});
	}
	return res;
}
/** @ignore */
function _LoadTextFile(path, asUtf8) {
	// assume it is a txt file for now
	var txt = "UNABLE TO READ " + path;
	if (asUtf8) {
		txt = File.Read(path);
	} else {
		var fso = new ActiveXObject('Scripting.FileSystemObject');
		path = Global.GetFullPath(path);
		if( File.Exists( path ) ) {
			var f = fso.OpenTextFile(path, /**ForReading*/ 1, false, /**TristateUseDefault*/ -2);
			txt = f.ReadAll();
			f.Close()
		} else {
			txt += ": FILE NOT FOUND";
		}
	}
	return txt;
}
/** @ignore */
function _LoadBinFile( /**string*/ binPath) {
	var bytesPerLine = 16;
	var path = File.ResolvePath(binPath);
	var bdata = Global.GetFileAsByteArray(path);
	var res = "";
	for (var i = 0; i < bdata.length; i++) {
		if (i > 0 && (i % bytesPerLine) == 0) {
			res += "\n";
		} else if(i>0) {
			res += " ";
		}
		var b = bdata[i];
		var h = ("00" + b.toString(16)).toUpperCase().substr(-2);
		res += h;
	}
	return res;
}
/** @ignore */
function _FileCompareString(cp, txt) {
	function ErrorReportFormatMono(s) {
		s = ("" + s).replace(/&/g, '&amp;').replace(/ /g, '&nbsp;').replace(/'/g, '&apos;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '\\n').replace(/\r>/g, '\\r');
		return '<font face="Courier">' + s + '</font>';
	}

	function PointToMatchErrorPos(s, p, html) {
		var op = "";
		for (var i = 0; i < p; i++) op += html ? " " : "_";
		op += '^';
		if (html) return ErrorReportFormatMono(s) + '<br/>\r\n' + ErrorReportFormatMono(op);
		return '' + s + '\r\n' + op;
	}

	function ReMatchErrorPos(restr, str) {
		var isre = false;
		if (restr.indexOf("regex:") == 0) {
			isre = true;
			restr = restr.substr("regex:".length);
		}
		var pos = restr.length;
		if (pos > 4096) return ""; // we just need to limit it.
		while (pos > 0) {
			pos--;
			restr = restr.substr(0, pos);
			if (isre) {
				try {
					var re = new RegExp(restr);
					var m = re.exec(str);
					if (m) {
						if (str.indexOf(m[0]) == 0) {
							return pos;
						}
					}
				} catch (ex) {
					// malformed regex - move on
				}
			} else {
				if (str.indexOf(restr) == 0) {
					return pos;
				}
			}
		}
		return 0;
	}

	function _CompareString(data, txt, fpath) {
		txt = "" + txt;
		// assume it is a txt file for now
		if (l2) Log2("File read, length: " + txt.length);
		var re = /\r\n|\n\r|\n|\r/g;
		var lines = txt.replace(re, "\n").split("\n");
		if (l2) Log2("File lines: " + lines.length);
		var errs = [];
		if (lines.length > data.length) {
			errs.push(fpath + ":1 " + "File contains more lines: " + (lines.length) + " than expected " + data.length);
		}
		if (lines.length < data.length) {
			errs.push(fpath + ":1 " + "File contains less lines: " + (lines.length) + " than expected " + data.length);
		}
		for (var i = 0; i < data.length; i++) {
			if (lines.length <= i) {
				errs.push(fpath + ":" + lines.length + " Missing line: " + (i + 1) + ": " + data[i].t);
				break;
			}
			if (data[i].c) {
				var expected = data[i].t;
				var method = "(exact)";
				if (data[i].r) {
					expected = "regex:" + expected;
					method = "(regex)";
				}
				if (!SeSCheckString(expected, lines[i])) {
					var e = fpath + ":" + (i + 1) + " Match failed " + method + " line: " + (i + 1) + "<br/>\n";
					e += ErrorReportFormatMono(lines[i]) + "<br/>\n";
					var p = ReMatchErrorPos(expected, lines[i]);
					if (p) {
						var epos = PointToMatchErrorPos(data[i].t, p, true);
						e += epos;
					} else {
						e += ErrorReportFormatMono(data[i].t);
					}
					errs.push(e);
					Log(e);
				}
			} else {
				// Ignore this line
				if (l2) Log2("Skip line: " + i);
			}
		}
		return errs;
	}
	var err = _CompareString(cp.data, txt, cp.path);
	var edata = [];
	if (err && err.length > 0) {
		for (var i = 0; i < err.length; i++) {
			if (l2) Log2(err[i]);
			edata.push(err[i]);
		}
	}
	var comment = "";
	if (err.length == 0) {
		comment = "Success";
	} else {
		comment = err.length + " mismtaches found";
	}
	edata.push(new SeSReportLink("" + cp.cppath))
	if( cp.path ) {
		var p = File.ResolvePath(cp.path);
		p = Global.GetFullPath(p);
		edata.push(new SeSReportLink("" + p))
	}
	Tester.SoftAssert("Checkpoint with: " + cp.path, err && err.length == 0, edata, { comment: comment });
	if (err && err.length > 0) {
		return false;
	} else {
		return true;
	}
	return err;
}
/** @ignore */
function _SaveToFile( /**object*/ cp, /**string*/ xlsxOrJson) {
	Tester.Message("Creating checkpoint: " + xlsxOrJson);
	var path = File.ResolvePath(g_helper.ResolveEnvironmentVariables(xlsxOrJson));
	if (File.Exists(path)) {
		File.Delete(path);
	}
	var arr = path.toLowerCase().split('.');
	var ext = arr[arr.length - 1];
	var i = 0;
	if (ext == 'xlsx' || ext == 'xls') {
		var sw = new ActiveXObject("SeSWrappers.Utils.SpreadsheetWrapper");
		sw.Create(path, "Data");
		sw.AddSheet("Checkpoint");
		sw.SetSheetByName("Checkpoint");
		sw.SetCellValue(0, 0, "File");
		sw.SetCellValue(0, 1, "" + cp.path);
		sw.SetCellValue(1, 0, "Format");
		sw.SetCellValue(1, 1, "" + cp.format);
		sw.SetCellValue(2, 0, "Lines");
		sw.SetCellValue(2, 1, cp.data.length);
		sw.SetSheetByName("Data");
		sw.SetCellValue(0, 0, "Compare");
		sw.SetCellValue(0, 1, "Regex");
		sw.SetCellValue(0, 2, "Line");
		sw.SetCellValue(0, 3, "TextOrRegex");
		for (i = 0; i < cp.data.length; i++) {
			sw.SetCellValue(i + 1, 0, cp.data[i].c);
			sw.SetCellValue(i + 1, 1, cp.data[i].r);
			sw.SetCellValue(i + 1, 2, cp.data[i].n);
			sw.SetCellValue(i + 1, 3, cp.data[i].t);
		}
		sw.Save();
		sw.Close();
	} else if (ext == 'txt') {
		var r = "";
		for (i = 0; i < cp.data.length; i++) {
			r += cp.data[i].c + ";" + cp.data[i].r + ";" + cp.data[i].n + ";" + cp.data[i].t + "\n";
		}
		File.Write(path, r);
	} else {
		File.Write(path, JSON.stringify(cp, null, '\t'));
	}
}
/** @ignore */
function _LoadFromFile( /**string*/ xlsxOrJson) {
	var path = File.ResolvePath(g_helper.ResolveEnvironmentVariables(xlsxOrJson));
	if (!File.Exists(path)) return null;
	var arr = path.toLowerCase().split('.');
	var ext = arr[arr.length - 1];
	var i = 0;
	var data = [];
	if (ext == 'xlsx' || ext == 'xls') {
		var sw = new ActiveXObject("SeSWrappers.Utils.SpreadsheetWrapper");
		sw.Open(path);
		sw.SetSheetByName("Data");
		for (i = 0; i < sw.GetRowCount(); i++) {
			var line = {};
			line.c = parseInt(sw.GetCellValue(i + 1, 0));
			line.r = parseInt(sw.GetCellValue(i + 1, 1));
			line.n = sw.GetCellValue(i + 1, 2);
			if (!line.n) break;
			line.t = sw.GetCellValue(i + 1, 3);
			data.push(line);
		}
		sw.Close();
		return { cppath: path, data: data };
	} else if (ext == 'txt') {
		var lns = File.Read(xlsxOrJson);
		var lines = lns.split('\n');
		var reMatch = /^(\d);(\d);(\d+);(.*)$/;
		for (i = 0; i < lines.length; i++) {
			var ln = lines[i];
			if (!ln) {
				// Last line ends with \n
				if (i == lines.length - 1) {
					continue;
				}
			}
			var m = reMatch.exec(ln);
			if (m) {
				var c = parseInt(m[1]);
				var r = parseInt(m[2]);
				var n = m[3];
				var t = m[4];
				data.push({ c: c, r: r, n: n, t: t });
			} else {
				Tester.Assert("Malformed checkpoint text file " + xlsxOrJson, false, ["Unexpected line was: ", ln]);
				return null;
			}
		}
		return { cppath: path, data: data };
	} else {
		var jsonData = File.Read(path);
		var cp = JSON.parse(jsonData);
		cp.cppath = path;
		return cp;
	}
}

function Checkpoint_AssertString( /**string*/ xlsxOrJson, /**string*/ str, /**string*/ assertionMessage) {
	Checkpoint_CreateFromString(xlsxOrJson, str);
	var cp = _LoadFromFile(xlsxOrJson);
	assertionMessage = assertionMessage || "STRING";
	cp.path = assertionMessage;
	return _FileCompareString(cp, str);
}
var _paramInfoCheckpoint_AssertString = {
	_: function () {
		/**
		 * Compare given `str` string using a checkpoint represented by `xlsxOrJson` file.
		 * If file `xlsxOrJson` is not found, new one is automatically created.
		 */
	},
	_type: "bool",
	_returns: "`true` if comparison is successfull. Also writes SoftAssert to the report.",
	xlsxOrJson: {
		description: "Checkpoint path. Checkpoint may be in Excel (.xlsx) or JSON (.json) format.",
		binding: "path",
		ext: "json"
	},
	str: {
		description: "String to compare with checkpoint"
	},
	assertionMessage: {
		description: "Additional message for assertion"
	}
}

function Checkpoint_AssertTextFile( /**string*/ xlsxOrJson, /**string*/ txtPath, /**bool*/ autoCreate) {
	Checkpoint_CreateFromTextFile(xlsxOrJson, txtPath);
	var cp = _LoadFromFile(xlsxOrJson);
	if (!cp && autoCreate) {
		cp = Checkpoint_CreateFromTextFile(txtPath, xlsxOrJson);
		_SaveToFile(cp, xlsxOrJson);
		cp = _LoadFromFile(xlsxOrJson);
	}
	var asUtf8 = false;
	if ((cp.format + "").toUpperCase() == "TEXTUTF8") asUtf8 = true;
	cp.path = txtPath;
	var txt = _LoadTextFile(txtPath, asUtf8);
	return _FileCompareString(cp, txt);
}
var _paramInfoCheckpoint_AssertTextFile = {
	_: function () {
		/**
		 * Compare a `txtPath` text file using a checkpoint represented by `xlsxOrJson` file. 
		 * The file is read as ASCII. If you want it to be UTF8, you may force it by creating a checkpoint 
		 * using Checkpoint.CreateFromTextFile and specifying `asUtf8` parameter as `true`.
		 * If file `xlsxOrJson` is not found, new one is automatically created when `autoCreate` is true.
		 */
	},
	_type: "bool",
	_returns: "`true` if comparison is successfull. Also writes SoftAssert to the report.",
	xlsxOrJson: _paramInfoCheckpoint_AssertString.xlsxOrJson,
	txtPath: {
		description: "Path to a text file to compare",
		binding: "path",
		ext: "txt"
	},
	autoCreate: {
		description: "Create new checkpoint if no existing checkopint found",
		type: "bool",
		defaultValue: true
	}
}

function Checkpoint_AssertPdf( /**string*/ xlsxOrJson, /**string*/ pdfPath, /**bool*/ autoCreate) {
	if(!Checkpoint_CreateFromPdf(xlsxOrJson, pdfPath)) return false;
	if (global.GetPdfFileFullText) {
		var cp = _LoadFromFile(xlsxOrJson);
		var txt = global.GetPdfFileFullText(pdfPath);
		if(!txt) return false;
		cp.path = pdfPath;
		return _FileCompareString(cp, txt);
	} else {
		Tester.Assert("You need to define global.GetPdfFileFullText(path)={....} function that reads PDF.");
	}
	return false;
}
var _paramInfoCheckpoint_AssertPdf = {
	_: function () {
		/**
		 * Compare a `pdfPath` PDF file using a checkpoint represented by `xlsxOrJson` file. 
		 * If file `xlsxOrJson` is not found, new one is automatically created when `autoCreate` is true.
		 */
	},
	_type: "bool",
	_returns: "`true` if comparison is successfull. Also writes SoftAssert to the report.",
	xlsxOrJson: _paramInfoCheckpoint_AssertString.xlsxOrJson,
	pdfPath: {
		description: "Path to a PDF file to compare",
		binding: "path",
		ext: "pdf"
	},
	autoCreate: _paramInfoCheckpoint_AssertTextFile.autoCreate
}

function Checkpoint_AssertBinary( /**string*/ xlsxOrJson, /**string*/ binPath, /**bool*/ autoCreate) {
	Checkpoint_CreateFromBinary(xlsxOrJson, binPath);
	var cp = _LoadFromFile(xlsxOrJson);
	cp.path = binPath;
	var txt = _LoadBinFile(binPath);
	return _FileCompareString(cp, txt);
}
var _paramInfoCheckpoint_AssertBinary = {
	_: function () {
		/**
		 * Byte-compare a `binPath` file using a checkpoint represented by `xlsxOrJson` file. 
		 * If file `xlsxOrJson` is not found, new one is automatically created when `autoCreate` is true.
		 */
	},
	_type: "bool",
	_returns: "`true` if comparison is successfull. Also writes SoftAssert to the report.",
	xlsxOrJson: _paramInfoCheckpoint_AssertString.xlsxOrJson,
	binPath: {
		description: "Path to any file to compare",
		binding: "path",
		ext: ""
	},
	autoCreate: _paramInfoCheckpoint_AssertTextFile.autoCreate
}

function Checkpoint_CreateFromString( /**string*/ xlsxOrJson, /**string*/ str, /**bool*/ regex) {
	if (File.Exists(xlsxOrJson)) {
		Log("Checkpoint file already exists: " + xlsxOrJson);
		return false;
	}
	var res = _CreateFromStringJson(str, regex);
	res.format = "TEXT";
	res.path = "";
	_SaveToFile(res, xlsxOrJson);
}
var _paramInfoCheckpoint_CreateFromString = {
	_: function () {
		/**
		 * Create a new checkpoint based on contents of the `str` text and save to the `xlsxOrJson` file.
		 * If file `xlsxOrJson` is found, no new new checkpoint is created. If you want to update a checkpoint delete `xlsxOrJson` file first.
		 */
	},
	xlsxOrJson: _paramInfoCheckpoint_AssertString.xlsxOrJson,
	str: {
		description: "String to use for creating a reference checkpoint"
	},
	regex: {
		description: "When `true` generate each comparison line as a regular expression",
		type: "bool",
		defaultValue: false
	}
}

function Checkpoint_CreateFromTextFile( /**string*/ xlsxOrJson, /**string*/ txtPath, /**bool*/ asUtf8, /**bool*/ regex) {
	if (File.Exists(xlsxOrJson)) {
		Log("Checkpoint file already exists: " + xlsxOrJson);
		return false;
	}
	var path = File.ResolvePath(g_helper.ResolveEnvironmentVariables(txtPath));
	if (!File.Exists(path)) {
		Tester.SoftAssert('Checkpoint.CreateFromText file. File not found: ' + txtPath, false);
		return false;
	}
	// assume it is a txt file for now
	var txt = "UNABLE TO READ " + path;
	var format = "TEXT";
	if (asUtf8) {
		txt = File.Read(path);
		format = "TEXTUTF8";
	} else {
		var fso = new ActiveXObject('Scripting.FileSystemObject');
		var f = fso.OpenTextFile(path, /**ForReading*/ 1, false, /**TristateUseDefault*/ -2);
		txt = f.ReadAll();
		f.Close()
	}
	var res = _CreateFromStringJson(txt, regex);
	res.format = format;
	res.path = path;
	_SaveToFile(res, xlsxOrJson);
}
var _paramInfoCheckpoint_CreateFromTextFile = {
	_: function () {
		/**
		 * Create a new checkpoint based on contents of the `txtPath` text and save to the `xlsxOrJson` file.
		 * If file `xlsxOrJson` is found, no new new checkpoint is created. If you want to update a checkpoint delete `xlsxOrJson` file first.
		 */
	},
	xlsxOrJson: _paramInfoCheckpoint_AssertString.xlsxOrJson,
	txtPath: {
		description: "Path to a text file to create a checkpoint",
		binding: "path",
		ext: "txt"
	},
	asUtf8: {
		description: "Use UTF8 instead of default ASCII",
		type: "bool",
		defaultValue: true
	},
	regex: _paramInfoCheckpoint_CreateFromString.regex
}

function Checkpoint_CreateFromPdf( /**string*/ xlsxOrJson, /**string*/ pdfPath, /**bool*/ regex) {
	if (File.Exists(xlsxOrJson)) {
		Log("Checkpoint file already exists: " + xlsxOrJson);
		return false;
	}
	if (global.GetPdfFileFullText) {
		var txt = global.GetPdfFileFullText(pdfPath);
		if(!txt) return null;
		var res = _CreateFromStringJson(txt, regex);
		res.format = "PDF";
		res.path = pdfPath;
		_SaveToFile(res, xlsxOrJson);
		return true;
	} else {
		Tester.Assert("You need to define global.GetPdfFileFullText(path)={....} function that reads PDF.");
	}
}
var _paramInfoCheckpoint_CreateFromPdf = {
	_: function () {
		/**
		 * Create a new checkpoint based on contents of the `pdfPath` text and save to the `xlsxOrJson` file.
		 * If file `xlsxOrJson` is found, no new new checkpoint is created. If you want to update a checkpoint delete `xlsxOrJson` file first.
		 */
	},
	xlsxOrJson: _paramInfoCheckpoint_AssertString.xlsxOrJson,
	pdfPath: {
		description: "Path to a PDF file to create a checkpoint",
		type: "string",
		binding: "path",
		ext: "pdf"
	},
	regex: _paramInfoCheckpoint_CreateFromString.regex
}

function Checkpoint_CreateFromBinary( /**string*/ xlsxOrJson, /**string*/ binPath, /**bool*/ regex) {
	if (File.Exists(xlsxOrJson)) {
		Log("Checkpoint file already exists: " + xlsxOrJson);
		return false;
	}
	var binStr = _LoadBinFile(binPath);
	var res = _CreateFromStringJson(binStr, regex);
	res.format = "BIN";
	res.path = binPath;
	_SaveToFile(res, xlsxOrJson);
}
var _paramInfoCheckpoint_CreateFromBinary = {
	_: function () {
		/**
		 * Create a new byte checkpoint based on contents of the `binPath` and save to the `xlsxOrJson` file.
		 * If file `xlsxOrJson` is found, no new new checkpoint is created. If you want to update a checkpoint delete `xlsxOrJson` file first.
		 */
	},
	xlsxOrJson: _paramInfoCheckpoint_AssertString.xlsxOrJson,
	binPath: {
		description: "Path to any file to create a byte-by-byte checkpoint",
		type: "string",
		binding: "path"
	},
	regex: _paramInfoCheckpoint_CreateFromString.regex
}

SeSGlobalObject("Checkpoint");