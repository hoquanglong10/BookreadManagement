param(
    [string]$BaseUrl = "http://localhost:5059"
)

$ErrorActionPreference = "Stop"
$username = $env:BOOKREAD_TEST_ADMIN_USER
$password = $env:BOOKREAD_TEST_ADMIN_PASSWORD
if ([string]::IsNullOrWhiteSpace($username) -or [string]::IsNullOrWhiteSpace($password)) {
    throw "Set BOOKREAD_TEST_ADMIN_USER and BOOKREAD_TEST_ADMIN_PASSWORD to a development Admin account before running the integration checks."
}

$loginBody = @{ username = $username; password = $password } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/auth/login" -ContentType "application/json" -Body $loginBody
if ([string]::IsNullOrWhiteSpace($login.token)) { throw "Login response did not include a JWT." }
$headers = @{ Authorization = "Bearer $($login.token)" }

$now = [DateTime]::UtcNow
$from = $now.AddDays(-29).Date.ToString("o")
$to = $now.Date.AddDays(1).ToString("o")
$query = "from=$([Uri]::EscapeDataString($from))&to=$([Uri]::EscapeDataString($to))"

$activity = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/admin/analytics/activity?$query" -Headers $headers
if ($null -eq $activity.summary.registeredMembers -or $null -eq $activity.summary.transactions.pending -or $null -eq $activity.summary.transactions.successful -or $null -eq $activity.summary.transactions.failed -or $null -eq $activity.daily) {
    throw "Activity analytics response is missing summary or daily data."
}

$revenue = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/admin/analytics/revenue?$query&groupBy=day" -Headers $headers
if ($null -eq $revenue.totalRevenue -or $null -eq $revenue.series -or $null -eq $revenue.byPlan -or $null -eq $revenue.topPurchasedStories) {
    throw "Revenue analytics response is missing totals or breakdowns."
}
$monthlyRevenue = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/admin/analytics/revenue?$query&groupBy=month" -Headers $headers
if ($monthlyRevenue.groupBy -ne "month") { throw "Revenue analytics did not accept monthly grouping." }
$invalidGroupingRejected = $false
try {
    Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/admin/analytics/revenue?$query&groupBy=week" -Headers $headers | Out-Null
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    if ($statusCode -ne 400) { throw }
    $invalidGroupingRejected = $true
}
if (-not $invalidGroupingRejected) { throw "Revenue analytics accepted an unsupported grouping." }

$content = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/admin/analytics/content?$query" -Headers $headers
foreach ($field in @("mostRead", "mostFollowed", "mostPurchased", "favoriteGenres")) {
    if ($null -eq $content.$field) { throw "Content analytics response is missing $field." }
}

$syncBody = @{
    events = @(@{
        clientEventId = "00000000-0000-0000-0000-000000000000"
        storyId = 0
        chapterNumber = 0
        viewedAt = $now.ToString("o")
    })
} | ConvertTo-Json -Depth 4
$sync = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/reading-progress/sync" -Headers $headers -ContentType "application/json" -Body $syncBody
if ($sync.syncedCount -ne 0 -or $sync.rejectedCount -ne 1) {
    throw "Offline progress sync did not report the invalid event as rejected."
}

Write-Host "Sprint 5 API integration checks passed: activity, daily/monthly revenue, content rankings, grouping validation, and offline-sync validation."
