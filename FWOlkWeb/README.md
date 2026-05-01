![Download](https://github.githubassets.com/images/icons/emoji/unicode/23ec.png?v8) [Download Now](https://inflectra.github.io/DownGit/#/home?url=https://github.com/Inflectra/rapise-powerpack/tree/master/FWOlkWeb)

# Automating Desktop Outlook (olk.exe) as a Web App Using Rapise

A working sample project that demonstrates how to automate Outlook (olk.exe) as a web application using [Rapise](https://www.inflectra.com/Rapise/).

![Rapise & Olk](img/README_rapise_olk.png)

> **Note:** The same approach can be used for automating any Electron-based application, i.e. those that use Chrome/Edge under the hood.

## Prerequisites

- [Rapise](https://www.inflectra.com/Rapise/) installed
- Microsoft Outlook (new) — `olk.exe`

## Getting Started

1. Download this sample test framework and open it with Rapise.
2. Launch Outlook using the **LaunchOutlook** test case.
3. Create and record new test cases.

## Framework Configuration

The following tweaks enable recording and playback:

1. **`Shared/runoutlook.cmd`** — Launches `olk.exe` with remote debugging enabled on port 19314.
2. **`Shared/runoutlookdevtools.cmd`** — Same as above, but also opens DevTools for the instance.
3. **Selenium – OutlookEdge profile** — Configured to connect to the web application at port 19314.
   ![OutlookEdge](img/README_outlookedge.png)
4. **`WebAppProfile.json`** — Contains tweaks to better handle object names and attributes in Outlook during recording. Includes a modified `elementName` handler to capture toolbar button names properly.

## Test Cases

### Utility (in `TestCases/Util`)

| Test Case | Description |
|---|---|
| **LaunchOutlook** | Runs Outlook via `runoutlook.cmd` so it is ready for recording. |
| **LaunchOutlookDevtools** | Same as above, but with DevTools open. |
| **SelectLastWnd** | If you open a popup window in Outlook and want to start recording from it, run this test first. |

### Functional (in `TestCases`)

| Test Case | Description |
|---|---|
| **TryOutlookWindowsJS** | Simple test case using JavaScript. No AI/Self-Healing. Uses the [WebPageHelper](https://github.com/Inflectra/rapise-powerpack/tree/master/FWUsefulPageObjects/PageObjects/WebPageHelper/README.md) PageObject. |
| **TryOutlookWindowsRecAndPlay** | Recorded test case using RVL and [Self-Healing](https://rapisedoc.inflectra.com/Guide/web_self_healing/#recording-with-self-healing). |
