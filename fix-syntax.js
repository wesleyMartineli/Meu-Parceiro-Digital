const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = fs.statSync(dirFile).isDirectory()
        ? walkSync(dirFile, filelist)
        : filelist.concat(dirFile);
    } catch (err) {}
  });
  return filelist;
};

const directories = ['src'];
let files = [];
directories.forEach(d => {
    const fullPath = path.join(__dirname, d);
    if(fs.existsSync(fullPath)) {
        files = files.concat(walkSync(fullPath));
    }
});

files = files.filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

let count = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/targetGerente de NegóciosId/g, 'targetGerenteId');
    content = content.replace(/selectedGerente de Negócioses/g, 'selectedGerentes');
    content = content.replace(/leadsDoGerente de Negócios/g, 'leadsDoGerente');
    content = content.replace(/negociosDoGerente de Negócios/g, 'negociosDoGerente');
    content = content.replace(/tarefasDoGerente de Negócios/g, 'tarefasDoGerente');
    content = content.replace(/oGerente de Negócios/g, 'oGerente');
    content = content.replace(/<Gerente de Negócios/g, '<GerenteNegocio');
    content = content.replace(/Gerente de Negócios>/g, 'GerenteNegocio>');
    content = content.replace(/Gerente de Negócioses/g, 'Gerentes');
    content = content.replace(/Gerente de NegóciosesFilter/g, 'GerentesFilter');
    content = content.replace(/Gerente de NegóciosFilter/g, 'GerenteFilter');
    
    // Fix imports
    content = content.replace(/import \{ Gerente de Negócios \} /g, 'import { GerenteNegocio } ');
    content = content.replace(/import Gerente de Negócios /g, 'import GerenteNegocio ');
    
    // Fix interfaces and types
    content = content.replace(/interface Gerente de Negócios/g, 'interface GerenteNegocio');
    content = content.replace(/type Gerente de Negócios/g, 'type GerenteNegocio');
    content = content.replace(/Gerente de Negócios\./g, 'GerenteNegocio.');
    
    // Any remaining `[a-z]Gerente de Negócios` should be fixed. 
    // E.g. `meuGerente de Negócios` -> `meuGerenteNegocio`
    content = content.replace(/([a-z])Gerente de Negócios/g, '$1GerenteNegocio');
    // `Gerente de Negócios[A-Z]` -> `GerenteNegocio[A-Z]`
    content = content.replace(/Gerente de Negócios([A-Z])/g, 'GerenteNegocio$1');

    if (original !== content) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
        count++;
    }
});

console.log(`Done. Updated ${count} files.`);
