
//Definition of formats not appearing as a Case in GetRandStrForToken
var TemplateData = {
	"#": function(){return ""+(Math.floor(Math.random() * 10));},
	"dd":function(){return ""+(Math.floor(Math.random() * 28 + 1));},
	"mm":function(){return ""+(Math.floor(Math.random() * 12 + 1));},
	"yy":function(){return ""+(Math.floor(Math.random() * 10)) + ""+(Math.floor(Math.random() * 10));},
	"yyyy":function(){return ""+(1950 + Math.floor(Math.random() * 50));},
	"GUID":	function () {
	  function s4() {
	    return Math.floor((1 + Math.random()) * 0x10000)
	      .toString(16)
	      .substring(1);
	  }
	  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
	    s4() + '-' + s4() + s4() + s4();
	},
    "DAY": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    "NAME": ["Ochoa","Rosales","Burch","Massey","Greer","Hines","Selma","Shelby","Stein","Belinda","Macdonald","Robbie","Lelia","Silva","Patterson","Kenya","Nancy","Alisha","Beryl","Florine","Joseph","Frazier","Virginia","Cotton","Rowena","Jamie","Gay","Latoya","Singleton","Robin","Coffey","Jannie","Quinn","Rasmussen","Gena","Carson","Lawson","Kline","Teri","Nichole","Orr","Booth","Francesca","Kari","Graciela","Koch","Coleen","Russell","Cabrera","Stefanie","Rowland","Evans","Marcy","Herrera","Mayo","Alexandra","Rosalinda","Carolyn","Young","Mullen","Gomez","Benson","Witt","Frances","Laurel","Rosie","Beulah","Carolina","Serrano","Elinor","Clemons","Graves","Dotson","Marie","Calhoun","Fernandez","Freeman","Leah","Cheri","Barbra","Latasha","Pate","King","Ball","Rachael","Beasley","Juliana","Serena","Mildred","Bell","Palmer","Georgette","Shelton","Sherri","Louise","Day","Berger","Reid","Maura","Wilkins","Hendricks","Hawkins","Decker","Ronda","Cora","Barlow","Summer","Walter","Jenna","Knight","Cassie","Twila","Marquez","Elaine","Doyle","Margie","Sondra","Burris","Sawyer","Lorna"],
    "BOYNAMES":["Liam","Noah","William","James","Oliver","Benjamin","Elijah","Lucas","Mason","Logan","Alexander","Ethan","Jacob","Michael","Daniel","Henry","Jackson","Sebastian","Aiden","Matthew","Samuel","David","Joseph","Carter","Owen","Wyatt","John","Jack","Luke","Jayden","Dylan","Grayson","Levi","Issac","Gabriel","Julian","Mateo","Anthony","Jaxon","Lincoln","Joshua","Christopher","Andrew","Theodore","Caleb","Ryan","Asher","Nathan","Thomas","Leo","Isaiah","Charles","Josiah","Hudson","Christian","Hunter","Connor","Eli","Ezra","Aaron","Landon","Adrian","Jonathan","Nolan","Jeremiah","Easton","Elias","Colton","Cameron","Carson","Robert","Angel","Maverick","Nicholas","Dominic","Jaxson","Greyson","Adam","Ian","Austin","Santiago","Jordan","Cooper","Brayden","Roman","Evan","Ezekiel","Xavier","Jose","Jace","Jameson","Leonardo","Bryson","Axel","Everett","Parker","Kayden","Miles","Sawyer","Jason"],
    "GIRLNAMES":["Emma","Olivia","Ava","Isabella","Sophia","Charlotte","Mia","Amelia","Harper","Evelyn","Abigail","Emily","Elizabeth","Mila","Ella","Avery","Sofia","Camila","Aria","Scarlett","Victoria","Madison","Luna","Grace","Chloe","Penelope","Layla","Riley","Zoey","Nora","Lily","Eleanor","Hannah","Lillian","Addison","Aubrey","Ellie","Stella","Natalie","Zoe","Leah","Hazel","Violet","Aurora","Savannah","Audrey","Brooklyn","Bella","Claire","Skylar","Lucy","Paisley","Everly","Anna","Caroline","Nova","Genesis","Emilia","Kennedy","Samantha","Maya","Willow","Kinsley","Naomi","Aaliyah","Elena","Sarah","Ariana","Allison","Gabriella","Alice","Madelyn","Cora","Ruby","Eva","Serenity","Autumn","Adeline","Hailey","Gianna","Valentina","Isla","Eliana","Quinn","Nevaeh","Ivy","Sadie","Piper","Lydia","Alexa","Josephine","Emery","Julia","Delilah","Arianna","Vivian","Kaylee","Sophie","Brielle","Madeline"],
    "SURNAME": ["Keller","Padilla","Webb","Mccall","Stein","Walters","Jimenez","Rodriquez","Santana","Langley","Sherman","Rivas","Arnold","Whitley","Barr","Gonzales","Dunlap","Quinn","Fuentes","Rowland","Reynolds","Crane","Bowen","Fields","Conley","West","Buchanan","Buck","Pearson","Alexander","Welch","White","Mcintyre","Griffin","Bates","Mckay","Farrell","Nguyen","Stokes","Atkinson","Mullen","Swanson","Love","Hoffman","Pollard","Mcfarland","Carver","Gardner","Dixon","Page","Spence","Espinoza","Carrillo","Melendez","Mcmahon","Davidson","Cain","Merrill","Kidd","Mcconnell","Hicks","Burris","Wall","Aguilar","Perry","Fulton","Huffman","Summers","George","Abbott","Washington","Christian","Zamora","Ochoa","Hurley","Sharpe","Daugherty","Bryant","Landry","Watson","Underwood","Lee","Solomon","Patterson","York","Stanley","Walton","Christensen","Simpson","Shields","Chavez","Mcgee","Williams","Britt","Waters","Mckinney","Dillard","Frederick","Hughes","Salas","Stephenson","Lucas","Hardin","Sharp","Baldwin","Shepard","Williamson","Levine","Strickland","Stafford","Schultz","Shelton","Edwards","Reilly","Joyner","Carroll","Estrada","Kirk","Boyer","Burns","Benson","Charles","Hooper","Oconnor","Donaldson","Barron","Maynard","Holland","Trevino","Byers","Rasmussen","Leon","Harding","Petersen","Mcleod","Mckee","Pickett","Crosby","Lopez","Wilkerson","Carr","Walsh","Pennington","Hutchinson","Miller","Wolfe","Porter","Garrison","David","Mclaughlin","Sexton","Sloan","Ball","Leblanc","Coleman","Herman","Wood","Rutledge","Fernandez","Sellers","Hull","Cameron","Carpenter","Raymond","Guerrero","Wyatt","Anthony","Whitfield","Young","Obrien","Olsen","Robinson","Short","Wong","Allison","Hubbard","Gross","Avila","Wolf","Ferguson","Koch","Matthews","Clarke","Bauer","Sparks","Rosa","Steele","Marks","Mcgowan","Lawrence","Campos","Oneal","Allen","Macdonald","Olson","Holden","Humphrey","Floyd","Horton","Nieves","Kelly","Baird","Dickerson","Holman","Pacheco","Wiggins","Combs","Vaughn","Park","Moss","Heath","Tanner","Morrow","Cardenas","Silva","Webster","Madden","Ratliff","Kline","Mccoy","Gray","Bartlett","Chan","Jenkins","Foley","Duran","Schneider","Reyes","Maldonado","Duncan","Lamb","Blankenship","Clemons","Rich","Rodriguez","Jacobs","Rosales","Leonard","Barlow","Evans","Blair","Mcdaniel","Keith","Potts"],
    "MONTH": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    "COLOR": ["Red", "Yellow", "Blue", "Green"],
    "CAR": ["Ford", "Toyota", "Lexus", "Mazda", "Tesla", "BMW", "Mercedes"],
    "STREET": ["Main Street","Church Street","Main Street North","Main Street South","Elm Street","High Street","Main Street West","Washington Street","Main Street East","Park Avenue","2nd Street","Walnut Street","Chestnut Street","Maple Avenue","Maple Street","Broad Street","Oak Street","Center Street","Pine Street","River Road","Market Street","Water Street","Union Street","South Street","Park Street","3rd Street","Washington Avenue","Cherry Street","North Street","4th Street","Court Street","Highland Avenue","Mill Street","Franklin Street","Prospect Street","School Street","Spring Street","Central Avenue","1st Street","State Street","Front Street","West Street","Jefferson Street","Cedar Street","Jackson Street","Park Place","Bridge Street","Locust Street","Madison Avenue","Meadow Lane","Spruce Street","Grove Street","Ridge Road","5th Street","Pearl Street","Lincoln Street","Madison Street","Dogwood Drive","Lincoln Avenue","Pennsylvania Avenue","Pleasant Street","4th Street West","Adams Street","Jefferson Avenue","3rd Street West","7th Street","Academy Street","11th Street","2nd Avenue","East Street","Green Street","Hickory Lane","Route 1","Summit Avenue","Virginia Avenue","12th Street","5th Avenue","6th Street","9th Street","Charles Street","Cherry Lane","Elizabeth Street","Hill Street","River Street","10th Street","Colonial Drive","Monroe Street","Valley Road","Winding Way","1st Avenue","Fairway Drive","Liberty Street","2nd Street West","3rd Avenue","Broadway","Church Road","Delaware Avenue","Prospect Avenue","Route 30","Sunset Drive","Vine Street","Woodland Drive","6th Street West","Brookside Drive","Hillside Avenue","Lake Street","13th Street","4th Avenue","5th Street North","College Street","Dogwood Lane","Mill Road","7th Avenue","8th Street","Beech Street","Division Street","Harrison Street","Heather Lane","Lakeview Drive","Laurel Lane","New Street","Oak Lane","Primrose Lane","Railroad Street","Willow Street","4th Street North","5th Street West","6th Avenue","Berkshire Drive","Buckingham Drive","Circle Drive","Clinton Street","George Street","Hillcrest Drive","Hillside Drive","Laurel Street","Park Drive","Penn Street","Railroad Avenue","Riverside Drive","Route 32","Route 6","Sherwood Drive","Summit Street","2nd Street East","6th Street North","Cedar Lane","Creek Road","Durham Road","Elm Avenue","Fairview Avenue","Front Street North","Grant Street","Hamilton Street","Highland Drive","Holly Drive","King Street","Lafayette Avenue","Linden Street","Mulberry Street","Poplar Street","Ridge Avenue","7th Street East","Belmont Avenue","Cambridge Court","Cambridge Drive","Clark Street","College Avenue","Essex Court","Franklin Avenue","Hilltop Road","James Street","Magnolia Drive","Myrtle Avenue","Route 10","Route 29","Shady Lane","Surrey Lane","Walnut Avenue","Warren Street","Williams Street","Wood Street","Woodland Avenue"],
    "STATE": ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"],
    "STATECODE": ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"],
    "CITY":["Ruffin","Grandview","Esmont","Harviell","Veyo","Sylvanite","Wilsonia","Blandburg","Stonybrook","Bison","Leyner","Elwood","Boomer","Cucumber","Woodruff","Gadsden","Dargan","Sultana","Craig","Sunwest","Taft","Savage","Kempton","Toftrees","Castleton","Farmers","Henrietta","Chical","Blackgum","Norwood","Waterloo","Oretta","Lydia","Madrid","Centerville","Hollins","Herald","Sparkill","Suitland","Davenport","Tooleville","Eden","Hasty","Libertytown","Nescatunga","Riviera","Downsville","Stewart","Tedrow","Gulf","Villarreal","Bluetown","Wanship","Williston"],
    "COMPANY": ["Cytrex","Kage","Ontagene","Overfork","Veraq","Apex","Earthmark","Cipromox","Sustenza","Adornica","Vurbo","Blurrybus","Autograte","Eargo","Pearlesex","Megall","Xinware","Ozean","Aquoavo","Cogentry","Snips","Honotron","Orbin","Kegular","Idealis","Optyk","Vortexaco","Reversus","Micronaut","Viocular","Ginkogene","Digique","Utarian","Enormo","Slambda","Katakana","Ludak","Remold","Savvy","Ecrater","Aquacine","Moltonic","Dragbot","Hinway","Rugstars","Cuizine","Opticall","Isoswitch","Spacewax","Mobildata","Candecor","Pyramax","Qimonk","Ziore","Trasola","Velos","Ronelon","Exozent","Fiberox","Insurety","Daido","Zentix","Duoflex","Zilch","Elentrix","Roughies","Zillanet","Enquility","Chorizon","Musaphics","Terascape","Liquicom","Buzzness","Syntac","Marvane","Zoarere","Cujo","Isosphere","Applidec","Quarex","Genekom","Suremax","Futurity","Ewaves","Neurocell","Anarco","Enaut","Plasmox","Liquidoc","Qualitern","Orbiflex","Omnigog","Hyplex","Gynko","Deminimum","Amtas","Nitracyr","Exiand","Lyria","Orbalix"]
};

var PersonTemplate={
	IND: 0,
	GUID:"GUID",
	PHONEMOBILE:"(###) ###-####",
	PHONEHOME:"(###) ###-####",
	PHONEWORK:"(###) ###-#### ext ###",
	SSN: "###-##-####",
	BIRTHDAY: "mm/dd/yyyy",
	GENDER:["F","M"], // M / F
	GENDERFULL:function(){return (this.GENDER=="F")?"Female":"Male";}, // Male / Female
	FIRST:function(){return (this.GENDER=="F")?GetRandStrForToken("GIRLNAMES"):GetRandStrForToken("BOYNAMES");},
	LAST:"SURNAME",
	STATECODE:"STATECODE",
	STATE:function(){return TemplateData["STATE"][ArrayInd(TemplateData["STATECODE"], this.STATECODE)];},
	STREET: "STREET",
	CITY: "CITY",
	APPARTMENT: "####",
	ZIP: "#####",
	ADDRESS: function(){return this.APPARTMENT+' '+this.STREET+', '+this.CITY+', '+this.STATECODE+', '+this.ZIP;},
	COMPANY: "COMPANY",
	EMAIL: function(){return this.FIRST.toLowerCase() + '.'+this.LAST.toLowerCase() + '@'+this.COMPANY.toLowerCase()+'.com';},
	
	_:function(){ 
		PersonTemplate.IND++; 
		this.IND=PersonTemplate.IND; 
	}
}

var LastPerson={
	IND: "Call GenNextContact first to fill first contact"
};

function ArrayInd(arr, val)
{
	for(var i=0;i<arr.length;i++)
	{
		if(arr[i]==val) return val;
	}
	return -1;
}

function GenObjectByTemplate(/**object*/tpl)
{
	var res = {
		toString:function()
		{
			var r = "";
			for(var i in this)
			{
				r+=i+":"+this[i]+"\n";
			}
			return r;
		}
	};
	for(var f in tpl)
	{
		if(tpl.hasOwnProperty(f))
		{
			var v = tpl[f];
			if(typeof v=='function')
			{
				var ret = tpl[f].apply(res,[]);
				if(f!='_'&&ret!=undefined)
				{
					res[f] = ret;
				}
			} else if(typeof v=='string') {
				res[f] = GenData(tpl[f]);
			} else if(typeof v=='object' && 'length' in tpl[f]) {
				res[f] = tpl[f][Math.floor(Math.random() * tpl[f].length)];
			} else {
				res[f] = tpl[f];
			}
			Log(f+'='+res[f]);
		}
	}
	return res;
}

function GetRandStrForToken(sToken, dataObj)
{
	dataObj = dataObj || {};
	if( sToken in dataObj )
	{
		return dataObj[sToken];
	}
	
	if( sToken in TemplateData )
	{
		var gen = TemplateData[sToken];
		if(typeof gen == 'function')
		{
			return gen.call();
		} else {

			var ind = Math.floor(Math.random() * gen.length);

			return gen[ind];
		}
	}


    return "<Unknown: "+sToken+">";
}

/**
 * Generate next contact record based on PersonTemplate templa and save it 
 * into the LastPerson object
 */
function GenNextContact()
{
	LastPerson = GenObjectByTemplate(PersonTemplate);
	return LastPerson;
}

/** 
 * Generate a random data given a format string. For example:
 * 
 */
function GenData(/**string*/Format, /**object*/dataObj)
{
	dataObj = dataObj || {};
    var /**string*/res="";
    
    var inBracket = false;
    
    var tdSorted = [];
    
    for(var t in dataObj) 
    {
    	var st = 0;
    	for(st in tdSorted)
    	{
    		var tt = tdSorted[st];
    		if( tt.length < t.length ) break;
    		if( tt.length > t.length ) continue;
    		if( tt>t ) break;
    	}
    	tdSorted.splice(st, 0, t)
    }
    
    for(var t in TemplateData) 
    {
    	var st = 0;
    	for(st in tdSorted)
    	{
    		var tt = tdSorted[st];
    		if( tt.length < t.length ) break;
    		if( tt.length > t.length ) continue;
    		if( tt>t ) break;
    	}
    	tdSorted.splice(st, 0, t)
    }
    
    while(Format.length>0)
    {
    	var foundToken = null;
    	
		if(Format.charAt(0)=='[')
		{
			inBracket = true;
		} else if(inBracket && Format.charAt(0)==']' )
		{
			inBracket = false;
		}
		
		if( !inBracket )
		{
			for(var ti in tdSorted)
			{
				var t = tdSorted[ti];
				if(!inBracket&&Format.indexOf(t)==0)
				{
					foundToken = t;
					break;
				}
			}
		}
	    				
		if(foundToken)
		{
			res += GetRandStrForToken(t, dataObj);
			Format = Format.substr(t.length);
		} else {
			res += Format.charAt(0);
			Format = Format.substr(1);
		}
		
    }
    
    return res;
}


/**
 * Generate spreadsheet of quasi-random user data based on template defined in
 * 'srcXlsx' and save it into 'dstXlsx'. Save result into 'countRows'.
 */
function GenDataSpreadsheet(/**string*/srcXlsx, /**string*/dstXlsx, /**number*/countRows)
{
	g_helper.Copy(srcXlsx, dstXlsx);
	
	Spreadsheet.DoAttach(dstXlsx);
	
	var tpls = [];
	for(var i=0;i<Spreadsheet.GetColumnCount();i++)
	{
		tpls.push( Spreadsheet.GetCell(i) );
	}
	
	for(var i=0;i<countRows;i++)
	{
		var dataObj = GenNextContact();
		for(var c=0;c<tpls.length;c++)
		{
			Spreadsheet.SetCell(
				GenData(tpls[c], dataObj),
				c
			);
		}
		Spreadsheet.DoAddRow();
	}
	Spreadsheet._SpreadSheet.Save();
}