
pushd "%WORKDIR:"=%"
call "%SES_ENGINE_HOME:"=%\InstrumentJS\nodevars.bat"
call "%SES_ENGINE_HOME:"=%\InstrumentJS\npm.cmd" install sharp deasync --prefix "%WORKDIR:"=%"
popd

