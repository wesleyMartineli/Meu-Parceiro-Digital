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
      
      let modified = false;

      // Check if it has the bug
      if (content.includes('if (!empresaId) {') && !content.includes('const empresaId = company?.id;')) {
        
        // Fix import
        if (!content.includes('getActiveCompany')) {
          content = content.replace(
            /import\s*\{\s*getCurrentUser\s*\}\s*from\s*["']@\/lib\/supabase\/helpers["'];?/,
            'import { getCurrentUser, getActiveCompany } from "@/lib/supabase/helpers";'
          );
        }

        // Define empresaId
        content = content.replace(
          /if\s*\(!user\)\s*\{\s*redirect\([^)]+\);\s*\}\s*if\s*\(!empresaId\)/,
          'if (!user) {\n    redirect("/login");\n  }\n\n  const company = await getActiveCompany();\n  const empresaId = company?.id;\n\n  if (!empresaId)'
        );

        fs.writeFileSync(fullPath, content);
        console.log('Fixed', fullPath);
      }
    }
  }
}

processDir('src/app');
console.log('Processed src/app directory');
