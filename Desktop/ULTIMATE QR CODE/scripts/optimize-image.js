import sharp from 'sharp';

// Optimize QR.png to og-image.png
sharp('public/QR.png')
  .resize(1920, 1080, {
    fit: 'contain',
    background: { r: 255, g: 255, b: 255, alpha: 1 }
  })
  .png({ quality: 100, compressionLevel: 6 })
  .toFile('public/og-image.png')
  .then(info => {
    console.log('Image optimized successfully:', info);
  })
  .catch(err => {
    console.error('Error optimizing image:', err);
  }); 