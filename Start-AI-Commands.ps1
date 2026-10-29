param([switch]$CheckOnly)
$ErrorActionPreference = 'Stop'
$projectDirectory = $PSScriptRoot
Set-Location -LiteralPath $projectDirectory
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js 22.22.2 or newer, then run this launcher again.' }
$nodeVersion = [version](& node -p 'process.versions.node')
if ($nodeVersion -lt [version]'22.22.2') { throw 'Node.js 22.22.2 or newer is required.' }
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw 'npm is required; install the standard Node.js distribution.' }
if ($CheckOnly) { Write-Output 'Prerequisites verified. No files or processes changed.'; exit 0 }
if (-not (Test-Path -LiteralPath (Join-Path $projectDirectory 'node_modules/.bin/ray.cmd'))) {
  & npm.cmd ci --no-fund
  if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed. Check the npm output and retry.' }
}
$runtimeDirectory = Join-Path $projectDirectory '.runtime'
New-Item -ItemType Directory -Force -Path $runtimeDirectory | Out-Null
$process = Start-Process -FilePath $env:ComSpec -ArgumentList '/d /c npm run dev' -WorkingDirectory $projectDirectory -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeDirectory 'develop.out.log') -RedirectStandardError (Join-Path $runtimeDirectory 'develop.err.log') -PassThru
Set-Content -LiteralPath (Join-Path $runtimeDirectory 'launcher.pid') -Value $process.Id
Write-Output 'AI Commands local builder started in the background.'
Write-Output 'Open Raycast and search for AI Commands or Models & Providers.'
Write-Output 'The builder must remain running for newly saved commands to appear in native Settings.'
Write-Output ('Logs: ' + $runtimeDirectory)
