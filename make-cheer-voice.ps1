# Compatibility entrypoint: the approved E recording replaces rejected SAPI voices.
node (Join-Path $PSScriptRoot 'prepare-cheer-voice.cjs')
if ($LASTEXITCODE -ne 0) { throw 'Unable to prepare approved E cheer assets' }
