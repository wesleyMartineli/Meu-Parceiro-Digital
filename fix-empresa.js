const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Remove .eq('empresa_id', ...) 
      content = content.replace(/\.eq\('empresa_id',\s*[^)]+\)/g, '');
      
      // Remove empresa_id: ... in inserts/updates
      content = content.replace(/empresa_id\s*:\s*[^,]+,\n?/g, '');
      
      // Remove const empresaId = user.empresa_id;
      content = content.replace(/const\s+empresaId\s*=\s*user\.empresa_id;?\n?/g, '');
      
      // Replace if (!user || !user.empresa_id)
      content = content.replace(/if\s*\(!user\s*\|\|\s*!user\.empresa_id\)/g, 'if (!user)');
      
      // Replace if (user.empresa_id) { query = query.eq... }
      content = content.replace(/if\s*\(user\.empresa_id\)\s*\{\s*[^}]+\s*\}/g, '');
      
      // Replace adminProfile.empresa_id references
      content = content.replace(/adminProfile\.empresa_id/g, 'null');
      
      // Fix SidebarLinks (role check)
      if (fullPath.includes('SidebarLinks')) {
         content = content.replace(/role === 'empresa_admin'/g, "role === 'superintendente' || role === 'regional'");
         content = content.replace(/role === 'platform_admin'/g, "role === 'master'");
      }
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir('src');
console.log('Processed src directory');
