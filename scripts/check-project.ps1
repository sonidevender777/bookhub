param(
  [string]$ApiBaseUrl = "http://localhost:5000/api"
)

$ErrorActionPreference = "Stop"

Push-Location "$PSScriptRoot\..\server"
$env:API_BASE_URL = $ApiBaseUrl
npm test
Pop-Location

Push-Location "$PSScriptRoot\..\client"
npm run lint
npm run build
Pop-Location

Write-Host "BookHub project checks completed."
