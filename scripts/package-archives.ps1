param(
  [Parameter(Mandatory=$true)][string]$StageDirectory,
  [Parameter(Mandatory=$true)][string]$ReleaseDirectory,
  [string]$BundlePath
)
$ErrorActionPreference = 'Stop'
$buildUserPath = $env:USERPROFILE.Replace('\','/')
$stage = (Resolve-Path -LiteralPath $StageDirectory).Path
$release = (Resolve-Path -LiteralPath $ReleaseDirectory).Path
$manifest = Get-Content -LiteralPath (Join-Path $stage 'package.json') -Raw | ConvertFrom-Json
$baseName = 'commands-' + $manifest.version
$bundle = if ($BundlePath) { (Resolve-Path -LiteralPath $BundlePath).Path } else { Join-Path $release ($baseName + '.rayext') }
$installZipPath = Join-Path $release ($baseName + '-windows.zip')
$zipPath = Join-Path $release ($baseName + '-source.zip')
if ((Test-Path -LiteralPath $zipPath) -or (Test-Path -LiteralPath $installZipPath)) { throw 'Release ZIP already exists; choose a fresh release directory.' }
Add-Type -AssemblyName System.IO.Compression.FileSystem

# Distribution does not need debug maps containing build-machine paths.
$archive = [IO.Compression.ZipFile]::Open($bundle, [IO.Compression.ZipArchiveMode]::Update)
try { @($archive.Entries | Where-Object FullName -Like '*.map') | ForEach-Object { $_.Delete() } }
finally { $archive.Dispose() }
$archive = [IO.Compression.ZipFile]::OpenRead($bundle)
try {
  $entry = $archive.GetEntry('package.json')
  if (!$entry) { throw 'Root manifest missing from bundle.' }
  $reader = [IO.StreamReader]::new($entry.Open())
  $bundledManifest = $reader.ReadToEnd() | ConvertFrom-Json
  $reader.Dispose()
  $slots = @($bundledManifest.commands | Where-Object name -Match '^command-slot-\d+$')
  if ($slots.Count -ne 20) { throw 'Expected 20 predefined native slots.' }
  foreach ($command in $bundledManifest.commands) {
    if ($command.name -like 'custom-ai-*') { throw 'Personal generated entry found.' }
    if (!$archive.GetEntry($command.name + '.js')) { throw "Executable missing: $($command.name)" }
    foreach ($preference in $command.preferences) {
      if ($preference.name -eq 'aiProviderOverride' -and @($preference.data | Where-Object value -NotIn @('saved','default')).Count) { throw 'Personal provider choices found.' }
    }
  }
  foreach ($item in $archive.Entries) {
    if ($item.FullName -match 'local-project.json|custom-ai-|(^|/)\.env($|\.)') { throw "Unexpected private file: $($item.FullName)" }
    if ($item.FullName -match '\.(js|json|txt|md)$') {
      $reader = [IO.StreamReader]::new($item.Open())
      $content = $reader.ReadToEnd()
      $reader.Dispose()
      if ($content.Replace('\','/').IndexOf($buildUserPath, [StringComparison]::OrdinalIgnoreCase) -ge 0) { throw "Build-machine path found: $($item.FullName)" }
    }
  }
  Write-Output "Verified $($bundledManifest.commands.Count) executables including 20 slots."
} finally { $archive.Dispose() }

# Public Windows builds import directories; bundle-file import is internal-only.
$archive = [IO.Compression.ZipFile]::OpenRead($bundle)
$installZip = [IO.Compression.ZipFile]::Open($installZipPath, [IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($item in $archive.Entries) {
    if ($item.FullName.EndsWith('/')) { continue }
    $target = $installZip.CreateEntry('Commands/' + $item.FullName, [IO.Compression.CompressionLevel]::Optimal)
    $inputStream = $item.Open()
    $outputStream = $target.Open()
    try { $inputStream.CopyTo($outputStream) } finally { $inputStream.Dispose(); $outputStream.Dispose() }
  }
  foreach ($name in @('INSTALL.md','RELEASE-NOTES.md','VALIDATION.md','PROMPT-TEMPLATES.md','LICENSE','THIRD-PARTY-NOTICES.txt')) {
    [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($installZip, (Join-Path $stage $name), ('Commands/' + $name), [IO.Compression.CompressionLevel]::Optimal) | Out-Null
  }
} finally { $archive.Dispose(); $installZip.Dispose() }

$zip = [IO.Compression.ZipFile]::Open($zipPath, [IO.Compression.ZipArchiveMode]::Create)
try {
  Get-ChildItem -LiteralPath $stage -Recurse -File -Force | Where-Object {
    $relative = [IO.Path]::GetRelativePath($stage, $_.FullName)
    $relative -notmatch '^(node_modules|\.runtime|\.git)[\\/]|local-project.json$|raycast-env.d.ts$|custom-ai-[^\\/]+\.tsx$'
  } | ForEach-Object {
    $relative = [IO.Path]::GetRelativePath($stage, $_.FullName).Replace('\','/')
    if ($_.Extension -in @('.ts','.tsx','.js','.cjs','.json','.md','.ps1','.cmd')) {
      if ((Get-Content -LiteralPath $_.FullName -Raw).Replace('\','/').IndexOf($buildUserPath, [StringComparison]::OrdinalIgnoreCase) -ge 0) { throw "Build-machine path found: $relative" }
    }
    [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $relative, [IO.Compression.CompressionLevel]::Optimal) | Out-Null
  }
} finally { $zip.Dispose() }
foreach ($name in @('INSTALL.md','RELEASE-NOTES.md','VALIDATION.md','PROMPT-TEMPLATES.md')) {
  $file = Join-Path $stage $name
  if (Test-Path -LiteralPath $file) { Copy-Item -LiteralPath $file -Destination $release }
}
Get-FileHash -LiteralPath $installZipPath,$zipPath -Algorithm SHA256 | ForEach-Object { "$($_.Hash.ToLower())  $([IO.Path]::GetFileName($_.Path))" } | Set-Content -LiteralPath (Join-Path $release 'SHA256SUMS.txt')
Get-ChildItem -LiteralPath $release | Select-Object Name,Length
