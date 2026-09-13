$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech

$work = Split-Path -Parent $MyInvocation.MyCommand.Path
$subtitle = Join-Path (Split-Path -Parent $work) '演示字幕-v1.srt'
$segments = Join-Path $work 'audio_segments'
New-Item -ItemType Directory -Path $segments -Force | Out-Null

$blocks = (Get-Content -LiteralPath $subtitle -Raw -Encoding UTF8) -split "\r?\n\s*\r?\n"
$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
$speaker.SelectVoice('Microsoft Huihui Desktop')
$speaker.Rate = 0
$speaker.Volume = 100

foreach ($block in $blocks) {
    $lines = @($block -split "\r?\n" | Where-Object { $_.Trim() -ne '' })
    if ($lines.Count -lt 3) { continue }
    $index = [int]$lines[0]
    $spoken = ($lines[2..($lines.Count - 1)] -join ' ').Trim()
    if ($index -eq 13) { $spoken = $lines[2].Trim() }
    $target = Join-Path $segments ('segment-{0:D2}.wav' -f $index)
    $speaker.SetOutputToWaveFile($target)
    $speaker.Speak($spoken)
    $speaker.SetOutputToNull()
    Write-Output "$index`t$target`t$spoken"
}
$speaker.Dispose()
