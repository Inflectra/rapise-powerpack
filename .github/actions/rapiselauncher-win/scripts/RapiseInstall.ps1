[CmdletBinding()]
param (
    $RapiseVersion
)

function Install-Binary
{
    <#
    .SYNOPSIS
        A helper function to install executables.
    .DESCRIPTION
        Download and install .exe or .msi binaries from specified URL.
    .PARAMETER Url
        The URL from which the binary will be downloaded. Required parameter.
    .PARAMETER Name
        The Name with which binary will be downloaded. Required parameter.
    .PARAMETER ArgumentList
        The list of arguments that will be passed to the installer. Required for .exe binaries.
    .EXAMPLE
        Install-Binary -Url "https://go.microsoft.com/fwlink/p/?linkid=2083338" -Name "winsdksetup.exe" -ArgumentList ("/features", "+", "/quiet")
    #>

    Param
    (
        [Parameter(Mandatory)]
        [String] $Url,
        [Parameter(Mandatory)]
        [String] $Name,
        [String[]] $ArgumentList
    )

    Write-Host "Downloading $Name..."
    $filePath = Start-DownloadWithRetry -Url $Url -Name $Name

    # MSI binaries should be installed via msiexec.exe
    $fileExtension = ([System.IO.Path]::GetExtension($Name)).Replace(".", "")
    if ($fileExtension -eq "msi")
    {
        $ArgumentList = ('/i', $filePath, '/QN', '/norestart')
        $filePath = "msiexec.exe"
    }

    try
    {
        Write-Host "Starting Install $Name..."
        $process = Start-Process -FilePath $filePath -ArgumentList $ArgumentList -Wait -PassThru

        $exitCode = $process.ExitCode
        if ($exitCode -eq 0 -or $exitCode -eq 3010)
        {
            Write-Host "Installation successful"
        }
        else
        {
            Write-Host "Non zero exit code returned by the installation process: $exitCode"
            exit $exitCode
        }
    }
    catch
    {
        Write-Host "Failed to install the $fileExtension ${Name}: $($_.Exception.Message)"
        exit 1
    }
}

function Start-DownloadWithRetry
{
    Param
    (
        [Parameter(Mandatory)]
        [string] $Url,
        [string] $Name,
        [string] $DownloadPath = "${env:Temp}",
        [int] $Retries = 20
    )

    if ([String]::IsNullOrEmpty($Name)) {
        $Name = [IO.Path]::GetFileName($Url)
    }

    $filePath = Join-Path -Path $DownloadPath -ChildPath $Name

    #Default retry logic for the package.
    while ($Retries -gt 0)
    {
        try
        {
            Write-Host "Downloading package from: $Url to path $filePath ."
            (New-Object System.Net.WebClient).DownloadFile($Url, $filePath)
            break
        }
        catch
        {
            Write-Host "There is an error during package downloading:`n $_"
            $Retries--

            if ($Retries -eq 0)
            {
                Write-Host "File can't be downloaded. Please try later or check that file exists by url: $Url"
                exit 1
            }

            Write-Host "Waiting 30 seconds before retrying. Retries left: $Retries"
            Start-Sleep -Seconds 30
        }
    }

    return $filePath
}

function Close-ProcessIfRunning
{
  Param
  (
      [Parameter(Mandatory)]
      [string] $progName
  )
  Write-Host "Closing process $progName"
  
  $prog = Get-Process $progName -EV Err -ErrorAction SilentlyContinue
  if ($prog) {
    # try gracefully first
    $prog.CloseMainWindow()
    # kill after five seconds
    Sleep 5
    $prog = Get-Process $progName -EV Err -ErrorAction SilentlyContinue
    if (!$prog.HasExited) {
      $prog | Stop-Process -Force
    }
  }
  
  Remove-Variable prog
}

# Download and install latest Rapise
$RapiseInstallerFile = "Rapise-v${RapiseVersion}.exe"
$RapiseInstallerUrl = "https://inflectra-rapise-nightly-installers.s3.eu-north-1.amazonaws.com/Rapise_${RapiseVersion}/${RapiseInstallerFile}"
Install-Binary -Url $RapiseInstallerUrl -Name $RapiseInstallerFile -ArgumentList ("/silent", "/install","DISABLE_IDE_FEATURES=1")

# Close Rapise instance launched by setup
Close-ProcessIfRunning "Rapise"

# Disable execution monitor
$RapiseConfigPath = Join-Path $env:ProgramData "Inflectra\Rapise\Basic.config"
Set-Content -Path $RapiseConfigPath -Value '<?xml version="1.0" encoding="utf-8"?>
<EngineSettings xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <EnableExecutionMonitor>false</EnableExecutionMonitor>
</EngineSettings>'

# Stop processes probably showing welcome screen
Close-ProcessIfRunning "Chrome"
Close-ProcessIfRunning "MSEdge"
Close-ProcessIfRunning "Firefox"
Close-ProcessIfRunning "iexplore"

# return 1 when successfull
1