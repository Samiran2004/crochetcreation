const fs = require('fs');
const path = require('path');

const files = [
  'app/page.tsx',
  'app/components/CartDrawer.tsx',
  'app/components/ServerPerformanceChart.tsx',
  'app/components/ReviewDrawer.tsx',
  'app/shop/page.tsx',
  'app/admin/dashboard/page.tsx',
  'app/admin/dashboard/components/InventoryTable.tsx',
  'app/admin/dashboard/components/AddProductDrawer.tsx',
  'app/admin/products/page.tsx',
  'app/admin/orders/page.tsx',
  'app/admin/orders/new/page.tsx',
  'app/admin/customers/page.tsx',
  'app/admin/settings/page.tsx',
  'app/admin/customizer/page.tsx',
  'app/admin/diagnostics/page.tsx',
  'app/product/[id]/page.tsx',
  'app/dashboard/page.tsx'
];

for (const file of files) {
  const filePath = path.join('/home/samiransamanta/Projects/crochetcreation/crochetcreation_web', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if it already has apiFetch
    if (!content.includes('apiFetch')) {
      // Find the relative path depth for import
      const depth = file.split('/').length - 2;
      const relativePath = depth > 0 ? '../'.repeat(depth) + 'utils/apiFetch' : './utils/apiFetch';
      
      // Import apiFetch at top
      content = `import { apiFetch } from '${relativePath}';\n` + content;
      
      // Replace fetch calls to the API with apiFetch
      // (This regex handles simple cases but might need manual checks, we will replace mostly just fetch to apiFetch)
      // Since apiFetch drops in exactly like fetch, we can just replace 'await fetch(' with 'await apiFetch(' 
      // but only if it involves API_URL, apiUrl, or relative /api
      
      content = content.replace(/await fetch\(/g, 'await apiFetch(');
      
      // we also have a few `fetch(` without await
      content = content.replace(/ fetch\(/g, ' apiFetch(');
      
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${file}`);
    }
  }
}
