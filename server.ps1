# KERYX Local Development & Broadcast Server
param([int]$Port = 8080)

$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Prefixes.Add("http://127.0.0.1:$Port/")

try {
    $listener.Start()
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host "  KERYX CHURCH OS -- Local Web Server Running     " -ForegroundColor Green
    Write-Host "  URL: http://localhost:$Port/                    " -ForegroundColor Yellow
    Write-Host "  Serving from: $root                            " -ForegroundColor White
    Write-Host "=================================================" -ForegroundColor Cyan
} catch {
    Write-Host "Failed to start listener: $_" -ForegroundColor Red
    exit 1
}

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".mjs"  = "application/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".ttf"  = "font/ttf"
}

try {
    while ($listener.IsListening) {
        try {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response

            $path = $request.Url.LocalPath
            if ($path -eq "/" -or $path -eq "") {
                $path = "/index.html"
            }

            # Clean URL path
            $decodedPath = [System.Uri]::UnescapeDataString($path).TrimStart('/')
            $filePath = Join-Path $root $decodedPath.Replace('/', [System.IO.Path]::DirectorySeparatorChar)

            if (Test-Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $mime = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
                $response.ContentType = $mime
                
                # Enable CORS for local development
                $response.AddHeader("Access-Control-Allow-Origin", "*")
                $response.AddHeader("Cache-Control", "no-cache")

                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentLength64 = $bytes.Length
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                }
            } else {
                $response.StatusCode = 404
                $notFoundMsg = "404 Not Found: " + $path
                $notFound = [System.Text.Encoding]::UTF8.GetBytes($notFoundMsg)
                $response.ContentLength64 = $notFound.Length
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($notFound, 0, $notFound.Length)
                }
            }
            $response.OutputStream.Close()
        } catch {
            # Catch transient request errors without killing the server
            try { $response.OutputStream.Close() } catch {}
        }
    }
} finally {
    $listener.Stop()
}

