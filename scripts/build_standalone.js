const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const cssPath = path.join(rootDir, 'styles.css');
const bundlePath = path.join(rootDir, 'bundle.js');
const indexPath = path.join(rootDir, 'index.html');

const css = fs.readFileSync(cssPath, 'utf8');
const bundle = fs.readFileSync(bundlePath, 'utf8');

// Standalone template
const standaloneHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0d1417" />
    <title>KERYX — AI Church Presentation & Ministry OS</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <style>
${css}
    </style>
    <script>
      // Global error listener to display diagnostic notices instead of blank screen
      window.addEventListener('error', function(e) {
        console.error('[KERYX ERROR]', e.error || e.message);
        const errDiv = document.createElement('div');
        errDiv.id = 'keryx-fatal-error';
        errDiv.style.cssText = 'position:fixed;bottom:20px;right:20px;max-width:440px;padding:16px 20px;background:#1a252c;border:1px solid #df654e;border-radius:10px;color:#fff;z-index:999999;font-family:sans-serif;font-size:13px;box-shadow:0 10px 30px rgba(0,0,0,0.6);';
        errDiv.innerHTML = '<strong style="color:#df654e;display:block;margin-bottom:6px;">KERYX Runtime Notice</strong><span>' + (e.message || 'Operation recovered safely.') + '</span>';
        if (document.body) {
          document.body.appendChild(errDiv);
        } else {
          window.addEventListener('DOMContentLoaded', function() {
            document.body.appendChild(errDiv);
          });
        }
        setTimeout(function() { if (errDiv.parentNode) errDiv.remove(); }, 8000);
      });
      window.addEventListener('unhandledrejection', function(e) {
        console.warn('[KERYX UNHANDLED REJECTION]', e.reason);
      });
    </script>
  </head>
  <body>
    <div id="app">
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#080710;color:#f1f0fb;font-family:'Plus Jakarta Sans',system-ui,sans-serif;">
        <div style="width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#8b5cf6,#6366f1);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:26px;box-shadow:0 0 30px rgba(139,92,246,0.5);margin-bottom:16px;color:#fff;">K</div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;letter-spacing:0.5px;">KERYX CHURCH OS</h2>
        <p style="margin:0;color:#9490b8;font-size:13px;">Initializing Ministry Presentation Engine...</p>
      </div>
    </div>
    <script type="module">
${bundle}
    </script>
  </body>
</html>
`;

fs.writeFileSync(indexPath, standaloneHtml, 'utf8');
console.log('Successfully generated standalone index.html! Size: ' + (Buffer.byteLength(standaloneHtml, 'utf8') / 1024).toFixed(2) + ' KB');
