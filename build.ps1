# Bundles the app into one self-contained file: cook-along-mode.html
# Usage: powershell -ExecutionPolicy Bypass -File build.ps1
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$utf8 = New-Object Text.UTF8Encoding $false
function Read-Text($p) { [IO.File]::ReadAllText((Join-Path $root $p), [Text.Encoding]::UTF8).TrimStart([char]0xFEFF) }

# Modules in dependency order; import lines dropped, "export" keywords removed.
$js = foreach ($m in 'config', 'commands', 'voice', 'alarm', 'distance', 'art', 'intro', 'app') {
  $src = Read-Text "js\$m.js"
  $src = [regex]::Replace($src, '(?m)^import .*?;\r?\n', '')
  $src = [regex]::Replace($src, '(?m)^export ', '')
  "// ===== $m.js =====`n$src"
}
$js = ($js -join "`n") -replace '</script', '<\/script'

$data = "window.INLINE_RECIPE = $(Read-Text 'data\dal-tadka.json');`nwindow.INLINE_CATALOG = $(Read-Text 'data\recipes.json');"
$css = Read-Text 'styles.css'

$html = Read-Text 'index.html'
$html = $html.Replace('<link rel="stylesheet" href="styles.css">', "<style>`n$css`n</style>")
$html = $html.Replace('<script type="module" src="js/app.js"></script>', "<script>`n$data`n</script>`n<script type=`"module`">`n$js`n</script>")

$out = Join-Path $root 'cook-along-mode.html'
[IO.File]::WriteAllText($out, $html, $utf8)
Write-Host "Built $out ($([math]::Round((Get-Item $out).Length / 1KB)) KB)"
