# Cook-Along Mode - tiny static server for local preview (no install needed).
# Usage: powershell -ExecutionPolicy Bypass -File serve.ps1 [-Port 5173]
param([int]$Port = 5173)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootWithSep = $root.TrimEnd('\') + '\'
$prefix = "http://localhost:$Port/"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
try { $listener.Start() } catch {
  Write-Host "Could not start on port $Port. Is something else already using it?"
  exit 1
}
Write-Host "Cook-Along Mode is running at $prefix"
Write-Host "Press Ctrl+C (or close this window) to stop."

$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'
  '.mjs' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'; '.svg' = 'image/svg+xml'
  '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.webp' = 'image/webp'
  '.ico' = 'image/x-icon'; '.txt' = 'text/plain; charset=utf-8'; '.mp3' = 'audio/mpeg'
  '.wav' = 'audio/wav'; '.woff2' = 'font/woff2'
}

try {
  while ($listener.IsListening) {
    $task = $listener.GetContextAsync()
    while (-not $task.AsyncWaitHandle.WaitOne(200)) { }
    $ctx = $task.GetAwaiter().GetResult()
    $res = $ctx.Response
    try {
      $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
      if ($path.EndsWith('/')) { $path += 'index.html' }   # /deck/ -> /deck/index.html
      $full = [IO.Path]::GetFullPath((Join-Path $root $path.TrimStart('/')))
      if (-not $full.StartsWith($rootWithSep, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $full -PathType Leaf)) {
        $res.StatusCode = 404
        $bytes = [Text.Encoding]::UTF8.GetBytes('Not found')
        $res.ContentType = 'text/plain; charset=utf-8'
      } else {
        $ext = [IO.Path]::GetExtension($full).ToLower()
        if ($mime.ContainsKey($ext)) { $res.ContentType = $mime[$ext] } else { $res.ContentType = 'application/octet-stream' }
        $bytes = [IO.File]::ReadAllBytes($full)
      }
      $res.Headers.Add('Cache-Control', 'no-store')
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } catch { } finally { try { $res.OutputStream.Close() } catch { } }
  }
} finally { $listener.Stop() }
