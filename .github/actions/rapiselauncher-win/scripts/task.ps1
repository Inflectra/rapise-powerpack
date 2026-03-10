[CmdletBinding()]
param()

Write-Host "Entering script rapiselauncher-win/task.ps1"

Function Execute-Command ($commandPath, $commandArguments, $timeoutMinutes = 0)
{
    $pinfo = New-Object System.Diagnostics.ProcessStartInfo
    $pinfo.FileName = $commandPath
    $pinfo.UseShellExecute = $false
    $pinfo.Arguments = $commandArguments
    $p = New-Object System.Diagnostics.Process
    $p.StartInfo = $pinfo
    $p.Start() | Out-Null

    $timedOut = $false
    if ($timeoutMinutes -gt 0) {
        $timeoutMs = $timeoutMinutes * 60 * 1000
        $exited = $p.WaitForExit($timeoutMs)
        if (-not $exited) {
            Write-Host "::warning::RapiseLauncher exceeded timeout of $timeoutMinutes minutes. Killing process."
            $p.Kill()
            $p.WaitForExit()
            $timedOut = $true
        }
    } else {
        $p.WaitForExit()
    }

    [pscustomobject]@{
        ExitCode = $p.ExitCode
        TimedOut = $timedOut
    }
}

try {
    # Read inputs from environment variables
    $spiraConfig = $env:INPUT_SPIRA_CONFIG
    $spiraUrl = $env:INPUT_SPIRA_URL
    $username = $env:INPUT_SPIRA_USERNAME
    $password = $env:INPUT_SPIRA_API_KEY
    $spiraProjectId = $env:INPUT_SPIRA_PROJECT_ID
    $spiraTestSetId = $env:INPUT_SPIRA_TEST_SET_ID

    # Parse project ID and test set ID from spira_url if it contains the full path
    # Full form: https://server/9/TestSet/925.aspx
    # Short form: https://server/ (requires explicit project_id and test_set_id)
    if ($spiraUrl -match '^(https?://.+?)/(\d+)/TestSet/(\d+)\.aspx$') {
        $spiraUrl = $Matches[1] + '/'
        if (-not $spiraProjectId) { $spiraProjectId = $Matches[2] }
        if (-not $spiraTestSetId) { $spiraTestSetId = $Matches[3] }
        Write-Host "Parsed from spira_url: server=$spiraUrl, project=$spiraProjectId, testset=$spiraTestSetId"
    }

    if (-not $spiraTestSetId) {
        Write-Host "::error::spira_test_set_id required. Provide it explicitly or use the full spira_url form (e.g. https://server/9/TestSet/925.aspx)."
        exit 1
    }
    $spiraAutomationHost = $env:INPUT_SPIRA_AUTOMATION_HOST
    if (-not $spiraAutomationHost) {
        $spiraAutomationHost = $env:COMPUTERNAME
        if (-not $spiraAutomationHost) { $spiraAutomationHost = [System.Net.Dns]::GetHostName() }
        Write-Host "spira_automation_host not set, using hostname: $spiraAutomationHost"
    }
    $setScreenSize = $env:INPUT_SET_SCREEN_SIZE -eq 'true'
    $screenWidth = [int]$env:INPUT_SCREEN_WIDTH
    $screenHeight = [int]$env:INPUT_SCREEN_HEIGHT
    $recordVideo = $env:INPUT_RECORD_VIDEO -eq 'true'
    $recordVideoOptions = $env:INPUT_RECORD_VIDEO_OPTIONS
    $publishRapiseLauncherLog = $env:INPUT_PUBLISH_RAPISE_LAUNCHER_LOG -eq 'true'
    $timeoutMinutes = 0
    if ($env:INPUT_TIMEOUT_MINUTES) { $timeoutMinutes = [int]$env:INPUT_TIMEOUT_MINUTES }
    $gitRoot = $env:INPUT_GIT_ROOT

    Write-Host "spiraProjectId: $spiraProjectId"
    Write-Host "spiraTestSetId: $spiraTestSetId"
    Write-Host "setScreenSize: $setScreenSize ($screenWidth x $screenHeight)"
    Write-Host "recordVideo: $recordVideo options: $recordVideoOptions"
    Write-Host "publishRapiseLauncherLog: $publishRapiseLauncherLog"

    $workdir = $env:RUNNER_TEMP
    if (-not $workdir) { $workdir = $env:TEMP }

    if ($spiraConfig) {
        # Use existing config file path
        $RLConfigPath = $spiraConfig
        Write-Host "Using existing Spira config: $RLConfigPath"
        if (-not (Test-Path $RLConfigPath)) {
            Write-Host "::error::Spira config file not found: $RLConfigPath"
            exit 1
        }
    } else {
        # Generate config from individual inputs
        if (-not $spiraUrl -or -not $username -or -not $password) {
            Write-Host "::error::Either spira_config or spira_url+spira_username+spira_api_key must be provided."
            exit 1
        }

        Write-Host "spiraUrl: $spiraUrl"
        Write-Host "spiraAutomationHost: $spiraAutomationHost"

        $RLConfigPath = Join-Path $workdir "RepositoryConnection.xml"
        Write-Host "RLConfigPath: $RLConfigPath"

        $RLConfigContent = @"
<?xml version="1.0" encoding="utf-8"?>
<SpiraConfig xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
<Launcher_PollingFreq>7</Launcher_PollingFreq>
<Launcher_PollAhead>240</Launcher_PollAhead>
<Launcher_RunOverdue>true</Launcher_RunOverdue>
<Launcher_CaptureScreenshots>false</Launcher_CaptureScreenshots>
<Launcher_StartAtLogon>false</Launcher_StartAtLogon>
<Launcher_UseTempFolder>true</Launcher_UseTempFolder>
<AutomationHost>$spiraAutomationHost</AutomationHost>
<SpiraServer>$spiraUrl</SpiraServer>
<SpiraUser>$username</SpiraUser>
<SpiraPassword>$password</SpiraPassword>
<DefaultRepositoryPath>$workdir</DefaultRepositoryPath>
<DefaultTempRepositoryPath>$workdir</DefaultTempRepositoryPath>
<RootFolder />
<IgnoreExtensions>tap, trp, log, user, cmd, rmt, rmtpng, \Reports\</IgnoreExtensions>
<QueryProjects />
</SpiraConfig>
"@

        Write-Host "Saving $RLConfigPath"
        Set-Content -Path $RLConfigPath -Value $RLConfigContent
    }

    if ($gitRoot) {
        Write-Host "Setting GITROOT=$gitRoot"
        $env:GITROOT = $gitRoot
    } elseif ($env:GITHUB_WORKSPACE) {
        Write-Host "Setting GITROOT=$($env:GITHUB_WORKSPACE)"
        $env:GITROOT = $env:GITHUB_WORKSPACE
    }

    Write-Host "Running TX$spiraTestSetId in $spiraProjectId"

    $RLPath = "C:\Program Files (x86)\Inflectra\Rapise\bin\RapiseLauncher.exe"
    $ArgumentList = @(
        "-config:$RLConfigPath",
        "-project:$spiraProjectId",
        "-testset:$spiraTestSetId",
        "-minimized"
    )

    if ($setScreenSize) {
        $ArgumentList += "-width:$screenWidth"
        $ArgumentList += "-height:$screenHeight"
    }

    if ($recordVideo) {
        $ArgumentList += "-param:g_enableVideoRecording=true"
        $ArgumentList += "-param:g_videoRecorderArguments=$recordVideoOptions"
    }

    $ArgumentListStr = '"' + ($ArgumentList -join '" "') + '"'

    Write-Host "Executing: $RLPath $ArgumentListStr"
    $process = Execute-Command $RLPath $ArgumentListStr $timeoutMinutes

    $exitCode = $process.ExitCode
    $RLLogPath = "C:\ProgramData\Inflectra\Rapise\Logs\rapise_launcher.log"

    if ($process.TimedOut) {
        Write-Host "::error::RapiseLauncher timed out after $timeoutMinutes minutes."
        if (Test-Path $RLLogPath) {
            Write-Host "--- RapiseLauncher Log ---"
            Get-Content $RLLogPath
            Write-Host "--- End Log ---"
        }
        exit 1
    } elseif ($exitCode -eq 0) {
        Write-Host "Execution Successful"
    } else {
        Write-Host "::error::Non zero exit code returned by RapiseLauncher: $exitCode"
        if (Test-Path $RLLogPath) {
            Write-Host "--- RapiseLauncher Log ---"
            Get-Content $RLLogPath
            Write-Host "--- End Log ---"
        }
        exit $exitCode
    }
} catch {
    Write-Host "::error::$($_.Exception.Message)"
    exit 1
}
