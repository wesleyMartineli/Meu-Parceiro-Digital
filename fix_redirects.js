const fs = require('fs');
const files = [
  'src/app/admin-master/page.tsx',
  'src/app/admin-master/empresas/page.tsx',
  'src/app/admin-master/planos/page.tsx',
  'src/app/admin-master/relatorios/page.tsx',
  'src/app/admin-master/usuarios/page.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/if \(user\.role !== 'master'\) \{/g, "if (user.role !== 'master' && user.role !== 'platform_admin') {");
  fs.writeFileSync(f, content, 'utf8');
  console.log('Updated ' + f);
});
