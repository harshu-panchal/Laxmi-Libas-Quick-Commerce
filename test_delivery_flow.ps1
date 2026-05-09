# test_delivery_flow.ps1
# Interactive/Automated Courier Delivery Simulation Script
# Automatically simulates status updates from Delhivery to the local backend.

param (
    [string]$TrackingId = "DLV1778234751214161",
    [string]$BaseUrl = "http://localhost:5000",
    [string]$Action = "" # "IT", "OFD", "DL", "Complete", or leave empty for Interactive
)

Clear-Host

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host " 🚚  DELHIVERY COURIER DELIVERY SIMULATOR v1.0  🚚" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "Tracking ID / Waybill : $TrackingId" -ForegroundColor Yellow
Write-Host "Backend Endpoint      : $BaseUrl/api/webhook/courier" -ForegroundColor Yellow
Write-Host "=========================================================" -ForegroundColor Cyan

function Send-WebhookUpdate {
    param (
        [string]$Status,
        [string]$Location,
        [string]$Description
    )

    $Uri = "$BaseUrl/api/webhook/courier"
    $Payload = @{
        waybill = $TrackingId
        status = $Status
        location = $Location
        description = $Description
        status_time = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    } | ConvertTo-Json

    Write-Host "`n🔄 Sending Courier Update -> [$Status] ..." -ForegroundColor Cyan
    Write-Host "Payload: $Payload" -ForegroundColor DarkGray

    try {
        $Response = Invoke-RestMethod -Uri $Uri -Method Post -Body $Payload -ContentType "application/json" -ErrorAction Stop
        Write-Host "✅ Webhook Succeeded! Backend Response:" -ForegroundColor Green
        Write-Host ($Response | ConvertTo-Json -Depth 5) -ForegroundColor Gray
        return $true
    }
    catch {
        Write-Host "❌ Webhook Failed!" -ForegroundColor Red
        if ($_.Exception.Response) {
            $Reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $ErrorBody = $Reader.ReadToEnd()
            Write-Host "Error details: $ErrorBody" -ForegroundColor Red
        } else {
            Write-Host $_.Exception.Message -ForegroundColor Red
        }
        return $false
    }
}

$SelectedAction = $Action

if ([string]::IsNullOrEmpty($SelectedAction)) {
    Write-Host "Choose an action to perform:" -ForegroundColor White
    Write-Host "  [1] Simulate 'In Transit' (IT)" -ForegroundColor Yellow
    Write-Host "  [2] Simulate 'Out For Delivery' (OFD)" -ForegroundColor Yellow
    Write-Host "  [3] Simulate 'Delivered' (DL) [Triggers Settlement!]" -ForegroundColor Yellow
    Write-Host "  [4] Run Complete Journey (IT -> OFD -> DL with 5s delays)" -ForegroundColor Magenta
    Write-Host "  [5] Exit" -ForegroundColor White
    Write-Host ""

    $Choice = Read-Host "Enter choice (1-5)"
    switch ($Choice) {
        "1" { $SelectedAction = "IT" }
        "2" { $SelectedAction = "OFD" }
        "3" { $SelectedAction = "DL" }
        "4" { $SelectedAction = "Complete" }
        "5" { $SelectedAction = "Exit" }
        default { 
            Write-Host "Invalid option selected." -ForegroundColor Red
            exit
        }
    }
}

switch ($SelectedAction) {
    "IT" {
        Send-WebhookUpdate -Status "IT" -Location "Indore Sorting Hub" -Description "Shipment is in-transit between sorting hubs."
    }
    "OFD" {
        Send-WebhookUpdate -Status "OFD" -Location "Indore Delivery Center" -Description "Out for delivery. Courier executive will reach you shortly."
    }
    "DL" {
        Send-WebhookUpdate -Status "DL" -Location "Indore Destination" -Description "Shipment successfully delivered to consignee."
    }
    "Complete" {
        Write-Host "`n🚀 Starting Full Journey Simulation..." -ForegroundColor Magenta
        
        $s1 = Send-WebhookUpdate -Status "IT" -Location "Delhi Hub" -Description "Package received and sorted at Delhi dispatch hub."
        if (-not $s1) { exit }
        
        Write-Host "`n⏳ Waiting 5 seconds before Out For Delivery..." -ForegroundColor DarkGray
        Start-Sleep -Seconds 5

        $s2 = Send-WebhookUpdate -Status "OFD" -Location "Indore Distribution Center" -Description "Package assigned to Indore delivery agent."
        if (-not $s2) { exit }

        Write-Host "`n⏳ Waiting 5 seconds before Delivering..." -ForegroundColor DarkGray
        Start-Sleep -Seconds 5

        $s3 = Send-WebhookUpdate -Status "DL" -Location "Indore Customer Doorstep" -Description "Package delivered. Status: DELIVERED"
        if (-not $s3) { Write-Host "❌ Delivered simulation failed!" -ForegroundColor Red }
        else {
            Write-Host "`n🎉 COMPLETE JOURNEY COMPLETED PERFECTLY! 🎉" -ForegroundColor Green
        }
    }
    "Exit" {
        Write-Host "Exiting. Have a great day!" -ForegroundColor Green
    }
    default {
        Write-Host "Unknown action: $SelectedAction" -ForegroundColor Red
    }
}
