$ErrorActionPreference = "Stop"
$repo = "B-Divyesh/sf-db-file-sync-safety"
$base = "https://github.com/$repo/releases/latest/download"
$asset = "dbsync-safe-windows-x86_64.zip"
$work = Join-Path ([System.IO.Path]::GetTempPath()) ("dbsync-safe-" + [guid]::NewGuid())
New-Item -ItemType Directory -Path $work | Out-Null
try {
  Invoke-WebRequest "$base/$asset" -OutFile (Join-Path $work $asset)
  Invoke-WebRequest "$base/SHA256SUMS" -OutFile (Join-Path $work "SHA256SUMS")
  $line = Get-Content (Join-Path $work "SHA256SUMS") | Where-Object { $_ -match ([regex]::Escape($asset) + '$') }
  if (-not $line) { throw "The checksum was not published. Nothing was installed." }
  $expected = ($line -split '\s+')[0].ToLowerInvariant()
  $actual = (Get-FileHash (Join-Path $work $asset) -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actual -ne $expected) { throw "The checksum failed. Nothing was installed." }
  Expand-Archive (Join-Path $work $asset) -DestinationPath $work
  $install = Join-Path $env:LOCALAPPDATA "dbsync-safe\bin"
  New-Item -ItemType Directory -Force -Path $install | Out-Null
  Copy-Item (Join-Path $work "dbsync-safe.exe") (Join-Path $install "dbsync-safe.exe") -Force
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  if (($userPath -split ';') -notcontains $install) {
    [Environment]::SetEnvironmentVariable("Path", ($userPath.TrimEnd(';') + ";" + $install), "User")
  }
  Write-Host "Installed dbsync-safe to $install\dbsync-safe.exe"
  Write-Host "Open a new terminal, then run: dbsync-safe --demo"
} finally {
  Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue
}

