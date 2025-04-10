// This is a helper script to create a golden cookie image programmatically

document.addEventListener('DOMContentLoaded', function() {
  // Create a canvas element to generate the golden cookie image
  const canvas = document.createElement('canvas');
  canvas.width = 60;
  canvas.height = 60;
  const ctx = canvas.getContext('2d');
  
  // Draw a golden cookie
  ctx.beginPath();
  ctx.arc(30, 30, 25, 0, Math.PI * 2);
  
  // Golden gradient
  const gradient = ctx.createRadialGradient(20, 20, 5, 30, 30, 25);
  gradient.addColorStop(0, '#ffffc0');  // Light gold center
  gradient.addColorStop(0.5, '#ffd700'); // Gold
  gradient.addColorStop(1, '#b8860b');  // Dark gold edge
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Add some cookie "chips"
  ctx.fillStyle = '#8B4513'; // Brown color for chips
  for (let i = 0; i < 8; i++) {
    const x = 15 + Math.random() * 30;
    const y = 15 + Math.random() * 30;
    const size = 2 + Math.random() * 4;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Add a glow effect
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(30, 30, 25, 0, Math.PI * 2);
  ctx.stroke();
  
  // Convert to image and download
  const img = document.createElement('img');
  img.src = canvas.toDataURL('image/png');
  img.style.position = 'fixed';
  img.style.top = '10px';
  img.style.left = '10px';
  img.style.zIndex = '9999';
  document.body.appendChild(img);
  
  // Add a download link
  const link = document.createElement('a');
  link.download = 'golden-cookie.png';
  link.href = canvas.toDataURL('image/png');
  link.textContent = "Download golden-cookie.png";
  link.style.position = 'fixed';
  link.style.top = '80px';
  link.style.left = '10px';
  link.style.zIndex = '9999';
  document.body.appendChild(link);
  
  console.log("Golden cookie image created. Click the link to download it.");
});
