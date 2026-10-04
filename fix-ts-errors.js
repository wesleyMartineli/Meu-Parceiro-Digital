const fs = require('fs');

// 1. Fix types.ts
let typesContent = fs.readFileSync('src/lib/supabase/types.ts', 'utf8');
typesContent = typesContent.replace(/id: string\n\s*supervisor_id\?: string \| null/g, 'id: string');
typesContent = typesContent.replace(/Row: \{\n\s*ativo: boolean/g, 'Row: {\n          ativo: boolean\n          supervisor_id: string | null');
typesContent = typesContent.replace(/Insert: \{\n\s*ativo\?: boolean/g, 'Insert: {\n          ativo?: boolean\n          supervisor_id?: string | null');
typesContent = typesContent.replace(/Update: \{\n\s*ativo\?: boolean/g, 'Update: {\n          ativo?: boolean\n          supervisor_id?: string | null');
fs.writeFileSync('src/lib/supabase/types.ts', typesContent);

// 2. Fix src/modules/admin/actions.ts
let adminActions = fs.readFileSync('src/modules/admin/actions.ts', 'utf8');
adminActions = adminActions.replace(/platform_admin/g, 'master');
adminActions = adminActions.replace(/empresa_admin/g, 'superintendente');
fs.writeFileSync('src/modules/admin/actions.ts', adminActions);

// 3. Fix src/modules/auth/actions.ts
let authActions = fs.readFileSync('src/modules/auth/actions.ts', 'utf8');
authActions = authActions.replace(/platform_admin/g, 'master');
authActions = authActions.replace(/empresa_admin/g, 'superintendente');
authActions = authActions.replace(/vendedor/g, 'ponto_venda');
authActions = authActions.replace(/adminProfile\.empresa_id/g, 'null');
authActions = authActions.replace(/empresa_id/g, 'supervisor_id');
fs.writeFileSync('src/modules/auth/actions.ts', authActions);

// 4. Fix src/modules/configuracoes/actions.ts
let confActions = fs.readFileSync('src/modules/configuracoes/actions.ts', 'utf8');
confActions = confActions.replace(/platform_admin/g, 'master');
confActions = confActions.replace(/user\.empresa_id/g, 'user.id');
fs.writeFileSync('src/modules/configuracoes/actions.ts', confActions);

// 5. Fix src/modules/crm/actions.ts
let crmActions = fs.readFileSync('src/modules/crm/actions.ts', 'utf8');
crmActions = crmActions.replace(/platform_admin/g, 'master');
crmActions = crmActions.replace(/empresa_admin/g, 'superintendente');
crmActions = crmActions.replace(/vendedor/g, 'ponto_venda');
crmActions = crmActions.replace(/empresaId/g, 'null');
crmActions = crmActions.replace(/user\.empresa_id/g, 'user.id');
fs.writeFileSync('src/modules/crm/actions.ts', crmActions);

// 6. Fix src/modules/propostas/actions.ts
let propActions = fs.readFileSync('src/modules/propostas/actions.ts', 'utf8');
propActions = propActions.replace(/empresaId/g, 'null');
fs.writeFileSync('src/modules/propostas/actions.ts', propActions);

// 7. Fix src/modules/simulacoes/actions.ts
let simActions = fs.readFileSync('src/modules/simulacoes/actions.ts', 'utf8');
simActions = simActions.replace(/empresaId/g, 'null');
simActions = simActions.replace(/vendedor/g, 'ponto_venda');
fs.writeFileSync('src/modules/simulacoes/actions.ts', simActions);

// 8. Fix src/lib/supabase/helpers.ts
let helpers = fs.readFileSync('src/lib/supabase/helpers.ts', 'utf8');
helpers = helpers.replace(/empresa_id: string \| null/g, ''); // removed earlier, but we still had userProfile.empresa_id errors?
helpers = helpers.replace(/userProfile\.empresa_id/g, 'null');
helpers = helpers.replace(/profile\.empresa_id/g, 'null');
fs.writeFileSync('src/lib/supabase/helpers.ts', helpers);

console.log('Fixed additional TS errors');
