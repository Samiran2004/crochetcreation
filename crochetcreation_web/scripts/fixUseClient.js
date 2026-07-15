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
    
    // Check if 'use client' or "use client" is not on the first line
    const lines = content.split('\n');
    let useClientIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('use client')) {
        useClientIndex = i;
        break;
      }
    }
    
    if (useClientIndex > 0) {
      // Remove it from current position
      const useClientLine = lines.splice(useClientIndex, 1)[0];
      // Put it at the top
      lines.unshift(useClientLine);
      fs.writeFileSync(filePath, lines.join('\n'));
      console.log(`Fixed use client in ${file}`);
    }
  }
}
