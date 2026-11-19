# Прогон критериев спеки §4 для POST /api/booking
param(
  [string]$BaseUrl = "http://localhost:8080/api/booking",
  [string]$Origin = "http://localhost:5173"
)

$ErrorActionPreference = "Stop"
$passed = 0
$failed = 0

function Assert-Case($name, $ok, $detail) {
  if ($ok) {
    Write-Host "PASS  $name" -ForegroundColor Green
    $script:passed++
  } else {
    Write-Host "FAIL  $name — $detail" -ForegroundColor Red
    $script:failed++
  }
}

function Invoke-Booking([hashtable]$Body, [int]$ExpectStatus) {
  $json = $Body | ConvertTo-Json -Compress
  try {
    $resp = Invoke-WebRequest -Uri $BaseUrl -Method POST `
      -Headers @{ Origin = $Origin; Accept = "application/json" } `
      -ContentType "application/json; charset=utf-8" `
      -Body ([System.Text.Encoding]::UTF8.GetBytes($json)) `
      -SkipHttpErrorCheck
  } catch {
    # PowerShell 5 may throw on non-2xx
    $resp = $_.Exception.Response
    if (-not $resp) { throw }
  }

  $status = [int]$resp.StatusCode
  $text = $resp.Content
  if (-not $text -and $resp.RawContentStream) {
    $reader = New-Object System.IO.StreamReader($resp.RawContentStream)
    $text = $reader.ReadToEnd()
  }

  $parsed = $null
  try { $parsed = $text | ConvertFrom-Json } catch {}

  return @{ Status = $status; Body = $parsed; Raw = $text; Expect = $ExpectStatus }
}

Write-Host "=== Booking acceptance against $BaseUrl ==="

# 1) Valid → 201 { id, status: ok }
$valid = Invoke-Booking @{
  name = "Иван"
  phone = "+79001234567"
  car = "Toyota Camry"
  datetime = "2030-06-15T10:00"
  consent = $true
  comment = "тест"
} 201

Assert-Case "201 valid booking" (
  $valid.Status -eq 201 -and
  $valid.Body.status -eq "ok" -and
  $valid.Body.id -match '^МТ-\d{4,}$'
) "status=$($valid.Status) body=$($valid.Raw)"

$firstId = $valid.Body.id

# 2) Invalid phone → 422 fields.phone (после нормализации не проходит /^\+7\d{10}$/)
$badPhone = Invoke-Booking @{
  name = "Иван"
  phone = "+7900123"
  car = "Toyota Camry"
  datetime = "2030-06-15T10:00"
  consent = $true
} 422

Assert-Case "422 invalid phone" (
  $badPhone.Status -eq 422 -and
  $badPhone.Body.error -eq "validation" -and
  $badPhone.Body.fields.phone -eq "Введите телефон в формате +7 XXX XXX-XX-XX"
) "status=$($badPhone.Status) body=$($badPhone.Raw)"

# 3) Missing consent → 422
$noConsent = Invoke-Booking @{
  name = "Иван"
  phone = "+79001234567"
  car = "Toyota Camry"
  datetime = "2030-06-15T10:00"
  consent = $false
} 422

Assert-Case "422 without consent" (
  $noConsent.Status -eq 422 -and
  $noConsent.Body.error -eq "validation" -and
  $null -ne $noConsent.Body.fields.consent
) "status=$($noConsent.Status) body=$($noConsent.Raw)"

# 4) Past datetime → 422
$past = Invoke-Booking @{
  name = "Иван"
  phone = "+79001234567"
  car = "Toyota Camry"
  datetime = "2020-01-01T10:00"
  consent = $true
} 422

Assert-Case "422 past datetime" (
  $past.Status -eq 422 -and
  $past.Body.error -eq "validation" -and
  $null -ne $past.Body.fields.datetime
) "status=$($past.Status) body=$($past.Raw)"

# 5) Honeypot → 200, no new booking id growth check via second valid after
$honey = Invoke-Booking @{
  name = "Spam"
  phone = "+79001234567"
  car = "Spam Car"
  datetime = "2030-06-15T10:00"
  consent = $true
  website = "http://spam.test"
} 200

Assert-Case "200 honeypot no save" (
  $honey.Status -eq 200 -and
  $honey.Body.status -eq "ok" -and
  -not $honey.Body.id
) "status=$($honey.Status) body=$($honey.Raw)"

# 6) Another valid → id increments (honeypot did not consume id)
$valid2 = Invoke-Booking @{
  name = "Пётр"
  phone = "+79007654321"
  car = "Kia Rio"
  datetime = "2030-07-01T12:00"
  consent = $true
} 201

Assert-Case "201 after honeypot still increments" (
  $valid2.Status -eq 201 -and
  $valid2.Body.id -match '^МТ-\d{4,}$' -and
  $valid2.Body.id -ne $firstId
) "first=$firstId second=$($valid2.Body.id) body=$($valid2.Raw)"

# 7) CORS header for allowed origin
$cors = Invoke-WebRequest -Uri $BaseUrl -Method OPTIONS `
  -Headers @{
    Origin = $Origin
    "Access-Control-Request-Method" = "POST"
    "Access-Control-Request-Headers" = "content-type"
  } -SkipHttpErrorCheck

$allowOrigin = $cors.Headers["Access-Control-Allow-Origin"]
Assert-Case "CORS allows configured origin" (
  $allowOrigin -eq $Origin
) "got='$allowOrigin'"

Write-Host ""
Write-Host "Result: $passed passed, $failed failed"
if ($failed -gt 0) { exit 1 }
exit 0
