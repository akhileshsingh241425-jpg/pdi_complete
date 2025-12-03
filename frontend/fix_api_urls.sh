#!/bin/bash

# Script to replace hardcoded backend.gspl.cloud URLs with getApiUrl helper
# This fixes the ERR_CERT_COMMON_NAME_INVALID errors

echo "Fixing hardcoded API URLs in frontend components..."

cd "$(dirname "$0")/src/components"

# Add import statement and replace URLs in each file
FILES=(
  "FTRDeliveredUpload.js"
  "MasterDataViewer.js"
  "PeelTestReport.js"
  "FTRDownload.js"
  "MasterDataUpload.js"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Check if import already exists
    if ! grep -q "import { getApiUrl }" "$file"; then
      # Add import after the first import line
      sed -i "2i import { getApiUrl } from '../services/apiService';" "$file"
    fi
    
    # Replace all hardcoded URLs
    sed -i "s|'https://backend.gspl.cloud/api/|getApiUrl('|g" "$file"
    sed -i 's|\`https://backend.gspl.cloud/api/|`${getApiUrl("|g' "$file"
    
    echo "✅ Fixed $file"
  fi
done

echo ""
echo "All files processed!"
