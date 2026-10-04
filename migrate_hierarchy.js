const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = fs.statSync(dirFile).isDirectory()
        ? walkSync(dirFile, filelist)
        : filelist.concat(dirFile);
    } catch (err) {
      if (err.code === 'OOM' || err.code === 'EISDIR') {
        console.log(`Skipping ${dirFile}`);
      }
    }
  });
  return filelist;
};

const directories = ['src', 'supabase/migrations'];
let files = [];
directories.forEach(d => {
    const fullPath = path.join(__dirname, d);
    if(fs.existsSync(fullPath)) {
        files = files.concat(walkSync(fullPath));
    }
});

files = files.filter(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.sql'));

let count = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // TypeScript & JS specific replacements
    if(file.endsWith('.ts') || file.endsWith('.tsx')) {
        content = content.replace(/vendedor_id/g, 'gerente_id');
        content = content.replace(/VendedorFilter/g, 'GerenteFilter');
        content = content.replace(/VendedoresFilter/g, 'GerentesFilter');
        content = content.replace(/vendedoresFilter/g, 'gerentesFilter');
        content = content.replace(/setFilterVendedor/g, 'setFilterGerente');
        content = content.replace(/filterVendedor/g, 'filterGerente');
        content = content.replace(/vendedores/g, 'gerentes');
        content = content.replace(/vendedor/g, 'gerente');
        content = content.replace(/Vendedor/g, 'GerenteNegocio');
        content = content.replace(/Vendedores/g, 'Gerentes de Negócios');
        
        // Fix some specific cases that might be messed up by the above broad replacements
        content = content.replace(/GerenteNegocios/g, 'GerenteNegocio'); // In case Vendedores -> GerenteNegocios already happened
        content = content.replace(/gerente_id_id/g, 'gerente_id'); // Just in case
        
        // Replace role strings
        content = content.replace(/'gerente'/g, "'gerente_negocio'");
        content = content.replace(/"gerente"/g, '"gerente_negocio"');
        content = content.replace(/role === 'gerente'/g, "role === 'gerente_negocio'");
        
        // UI Labels
        content = content.replace(/GerenteNegocio Responsável/g, 'Gerente de Negócios');
        content = content.replace(/Gerente Responsável/g, 'Gerente de Negócios');
        content = content.replace(/GerenteNegocio/g, 'Gerente de Negócios'); 
        
        // Re-adjust type names to follow PascalCase without spaces
        // If we replaced `interface Vendedor` it became `interface Gerente de Negócios` which is a syntax error.
        content = content.replace(/interface Gerente de Negócios/g, 'interface GerenteNegocio');
        content = content.replace(/type Gerente de Negócios/g, 'type GerenteNegocio');
        content = content.replace(/<Gerente de Negócios/g, '<GerenteNegocio');
        content = content.replace(/Gerente de Negócios\[/g, 'GerenteNegocio[');
        content = content.replace(/Gerente de Negócios \(/g, 'GerenteNegocio(');
        content = content.replace(/: Gerente de Negócios/g, ': GerenteNegocio');
        content = content.replace(/Gerente de Negócios\[\]/g, 'GerenteNegocio[]');
        
        // Import fix
        content = content.replace(/Gerente de NegóciosFilter/g, 'GerentesFilter');
    }
    
    if (original !== content) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
        count++;
    }
});

console.log(`Done. Updated ${count} files.`);
