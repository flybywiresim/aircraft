# Input and output file paths
$inputFile  = "..\..\..\..\base\flybywire-aircraft-a380-842\SimObjects\AirPlanes\FlyByWire_A380_842\flight_model.cfg"
$outputFile = "FuelSystemData.h"

# Regex to extract the Name: field
$namePattern = 'Name:([^#]+)'

# Regex to detect definition type and index (e.g., Tank.1, Line.57)
$typePattern = '^([A-Za-z]+)\.(\d+)\s*='

# Allowed types
$allowedTypes = @("tank", "line", "junction", "valve", "pump", "trigger")

# Function to convert "CamelCase" → "camel_case" with your special rules
function Convert-NameFormat {
    param([string]$name)

    # Replace ampersand with _and_
    $name = $name -replace '&', '_and_'

    # Ensure APU, LP, CG stay as one word by making only the first character uppercase
    # before we add underscores (so regex never splits them)
    $name = $name `
        -replace 'APU', 'Apu' `
        -replace 'LP',  'Lp' `
        -replace 'CG',  'Cg'

    # Insert underscore before capital letters except the first character
    $name = [regex]::Replace($name, '(?<!^)([A-Z])', '_$1')

    # Convert everything to lowercase
    return $name.ToLower()
}

# Collect all transformed names
$entries = @()

# Process file line by line
Get-Content $inputFile | ForEach-Object {
    $line = $_

    # Extract type and index (e.g., Tank.1 = ...)
    if ($line -match $typePattern) {
        $type  = $matches[1].ToLower()
        $index = $matches[2]

        # Only process allowed types
        if ($allowedTypes -contains $type) {

            # Extract Name: field
            if ($line -match $namePattern) {
                $rawName = $matches[1].Trim()
                $converted = Convert-NameFormat $rawName

                # Build final identifier
                if ($type -eq "tank") {
                    $prefix = "tank_quantity_${index}_"
                } else {
                    $prefix = "${type}_${index}_"
                }

                $finalName = $prefix + $converted
                $entries += $finalName
            }
        }
    }
}

# Write struct definition
$startStruct = @'
#pragma once

struct FuelSystemData {
'@
$startStruct | Out-File $outputFile
foreach ($e in $entries) {
    "  double $e;" | Out-File $outputFile -Append
}
"};" | Out-File $outputFile -Append
