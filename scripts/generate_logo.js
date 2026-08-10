import fs from 'fs';
import sharp from 'sharp';

// Precise vector representation of the official JalalVisuals logo
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 160" width="2000" height="320">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&amp;display=swap');
      .brand-red {
        font-family: 'Montserrat', 'Liberation Sans', 'Arial Black', sans-serif;
        font-weight: 900;
        font-size: 104px;
        fill: #E52328;
        letter-spacing: -2.5px;
      }
      .brand-navy {
        font-family: 'Montserrat', 'Liberation Sans', 'Arial Black', sans-serif;
        font-weight: 900;
        font-size: 104px;
        fill: #202636;
        letter-spacing: -2.5px;
      }
    </style>
  </defs>

  <!-- High-Res JalalVisuals Camera Lens Aperture Icon -->
  <g transform="translate(80, 80)">
    <!-- Solid Red Outer Circle -->
    <circle cx="0" cy="0" r="70" fill="#E52328" />

    <!-- 6 White Curved Pinwheel Aperture Blades -->
    <g fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round">
      <path d="M 0 -68 C 36 -36 33 16 12 23" />
      <path d="M 58.89 -34 C 30 38 -2 36 -13.91 20.36" />
      <path d="M 58.89 34 C -6 64 -34 25 -25.91 -2.64" />
      <path d="M 0 68 C -36 36 -33 -16 -12 -23" />
      <path d="M -58.89 34 C -30 -38 2 -36 13.91 -20.36" />
      <path d="M -58.89 -34 C 6 -64 34 -25 25.91 2.64" />
    </g>

    <!-- White Center Aperture Hole -->
    <path d="M 12 23 L -13.91 20.36 L -25.91 -2.64 L -12 -23 L 13.91 -20.36 L 25.91 2.64 Z" fill="#FFFFFF" />
  </g>

  <!-- Brand Text: JalalVisuals -->
  <g transform="translate(175, 118)">
    <!-- "Jalal" in bold red -->
    <text x="0" y="0" class="brand-red">Jalal</text>

    <!-- "V" in dark navy -->
    <text x="250" y="0" class="brand-navy">V</text>

    <!-- "i" stem in dark navy + Red Square Dot -->
    <g transform="translate(325, 0)">
      <!-- 'i' stem -->
      <rect x="2" y="-74" width="20" height="74" fill="#202636" />
      <!-- Red Square Dot for 'i' -->
      <rect x="2" y="-100" width="20" height="20" fill="#E52328" />
    </g>

    <!-- "suals" in dark navy -->
    <text x="357" y="0" class="brand-navy">suals</text>
  </g>
</svg>`;

if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
}

fs.writeFileSync('public/jalalvisuals-logo.svg', svgContent);

sharp(Buffer.from(svgContent))
  .resize(2000, 320)
  .png()
  .toFile('public/jalalvisuals-logo.png')
  .then(() => {
    // Copy to dist as well if dist exists
    if (fs.existsSync('dist')) {
      fs.copyFileSync('public/jalalvisuals-logo.png', 'dist/jalalvisuals-logo.png');
    }
    console.log('Successfully generated public/jalalvisuals-logo.png and dist/jalalvisuals-logo.png!');
  })
  .catch((err) => console.error('Error generating PNG with sharp:', err));
