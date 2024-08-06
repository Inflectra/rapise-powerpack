pushd %~dp0
RegAsm.exe /codebase ExtentReportsWrapper.dll
TlbExp.exe ExtentReportsWrapper.dll
regtlibv12 ExtentReportsWrapper.tlb
popd
