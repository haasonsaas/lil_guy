#!/bin/bash

# Create output directory if it doesn't exist
mkdir -p public/favicons

# Convert SVG to PNG in various sizes
convert -background none -resize 16x16 public/favicon.svg public/favicons/favicon-16x16.png
convert -background none -resize 32x32 public/favicon.svg public/favicons/favicon-32x32.png
convert -background none -resize 48x48 public/favicon.svg public/favicons/favicon-48x48.png
convert -background none -resize 72x72 public/favicon.svg public/favicons/android-chrome-72x72.png
convert -background none -resize 96x96 public/favicon.svg public/favicons/android-chrome-96x96.png
convert -background none -resize 144x144 public/favicon.svg public/favicons/android-chrome-144x144.png
convert -background none -resize 192x192 public/favicon.svg public/favicons/android-chrome-192x192.png
convert -background none -resize 256x256 public/favicon.svg public/favicons/android-chrome-256x256.png
convert -background none -resize 384x384 public/favicon.svg public/favicons/android-chrome-384x384.png
convert -background none -resize 512x512 public/favicon.svg public/favicons/android-chrome-512x512.png

# Generate Apple Touch Icons
convert -background none -resize 57x57 public/favicon.svg public/favicons/apple-touch-icon-57x57.png
convert -background none -resize 60x60 public/favicon.svg public/favicons/apple-touch-icon-60x60.png
convert -background none -resize 72x72 public/favicon.svg public/favicons/apple-touch-icon-72x72.png
convert -background none -resize 76x76 public/favicon.svg public/favicons/apple-touch-icon-76x76.png
convert -background none -resize 114x114 public/favicon.svg public/favicons/apple-touch-icon-114x114.png
convert -background none -resize 120x120 public/favicon.svg public/favicons/apple-touch-icon-120x120.png
convert -background none -resize 144x144 public/favicon.svg public/favicons/apple-touch-icon-144x144.png
convert -background none -resize 152x152 public/favicon.svg public/favicons/apple-touch-icon-152x152.png
convert -background none -resize 180x180 public/favicon.svg public/favicons/apple-touch-icon-180x180.png

# Generate ICO file (combining multiple sizes)
convert public/favicons/favicon-16x16.png public/favicons/favicon-32x32.png public/favicons/favicon-48x48.png public/favicon.ico

# Generate manifest.json
cat > public/favicons/manifest.json << EOF
{
  "name": "Haas on SaaS",
  "short_name": "Haas on SaaS",
  "icons": [
    {
      "src": "/favicons/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/favicons/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#2563EB",
  "background_color": "#ffffff",
  "display": "standalone"
}
EOF

echo "Favicons generated successfully!" 