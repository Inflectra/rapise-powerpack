  function RvlScriptSyntax(snippetInterface) {
    return {
      build: function build (opts) {
        var implementation = "";
        var defExpr = "";
        var definitionChoices = opts.generatedExpressions.map(
          function (generatedExpression, index) {
          
            var isRvl = false;
            if(typeof(g_rvlScriptPath)!='undefined' && g_rvlScriptPath )
            {
              isRvl = true;
            }
            var prefix = index === 0 ? '' : '// ';
            var allParameterNames = generatedExpression.parameterNames.concat(opts.stepParameterNames);
            var parametersStr = allParameterNames.join(', ');
            var expr = generatedExpression.source.replace(/'/g, '\\\'');
            if( index===0 )
            {
                defExpr = expr;
                var parametersObj = allParameterNames.map(function(par){
                    return par+":"+par
                }).join(', ');
                var parametersRvl = allParameterNames.map(function(par){
                    return "\tVariable\t\t\t"+par+"\tstring\t"+par
                }).join('\n');
                if(isRvl)
                {
                    implementation = 
                        //"/*\n"+
                        "#"+opts.functionName+"\t"+expr+"\n" +
                        //"\n*/\n\n"+
                        "    RVLPlaySection(__filename, 'RVL', '"+expr+"', {"+parametersObj+"}, this);" +
                        "";
                }
            }
            return prefix + '' + opts.functionName + "('" + expr + "', function (" + parametersStr + ') { \n';
          }
        )
        var impl = definitionChoices[0] +
          implementation +
          '\n});';
        if( typeof(CucumberRegisterMissingImpl)!='undefined' )
        {
        	CucumberRegisterMissingImpl(defExpr, opts.functionNam, impl);
        }
        return "";
      }
    };
  }
  module.exports = RvlScriptSyntax;
  