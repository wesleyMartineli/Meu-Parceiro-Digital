$files = @(
  "C:\Users\Wesle\OneDrive\Desktop\Sistema Rodobens\facitcon\src\modules\relatorios\components\KpiCards.tsx",
  "C:\Users\Wesle\OneDrive\Desktop\Sistema Rodobens\facitcon\src\modules\relatorios\components\PeriodoFilter.tsx",
  "C:\Users\Wesle\OneDrive\Desktop\Sistema Rodobens\facitcon\src\modules\relatorios\components\RelatoriosDashboard.tsx",
  "C:\Users\Wesle\OneDrive\Desktop\Sistema Rodobens\facitcon\src\modules\relatorios\components\VendedoresFilter.tsx",
  "C:\Users\Wesle\OneDrive\Desktop\Sistema Rodobens\facitcon\src\components\modals\NovaTarefaModal.tsx",
  "C:\Users\Wesle\OneDrive\Desktop\Sistema Rodobens\facitcon\src\components\proposta-pdf\CapaProposta.tsx",
  "C:\Users\Wesle\OneDrive\Desktop\Sistema Rodobens\facitcon\src\components\proposta-pdf\ComoFuncionaProposta.tsx",
  "C:\Users\Wesle\OneDrive\Desktop\Sistema Rodobens\facitcon\src\components\proposta-pdf\CronogramaProposta.tsx",
  "C:\Users\Wesle\OneDrive\Desktop\Sistema Rodobens\facitcon\src\components\proposta-pdf\EstrategiaLanceProposta.tsx",
  "C:\Users\Wesle\OneDrive\Desktop\Sistema Rodobens\facitcon\src\components\proposta-pdf\PlanejamentoProposta.tsx",
  "C:\Users\Wesle\OneDrive\Desktop\Sistema Rodobens\facitcon\src\components\proposta-pdf\PropostaPDFDocument.tsx",
  "C:\Users\Wesle\OneDrive\Desktop\Sistema Rodobens\facitcon\src\components\proposta-pdf\ProximosPassosProposta.tsx",
  "C:\Users\Wesle\OneDrive\Desktop\Sistema Rodobens\facitcon\src\components\proposta-pdf\QuemSomosProposta.tsx",
  "C:\Users\Wesle\OneDrive\Desktop\Sistema Rodobens\facitcon\src\components\proposta-pdf\ResumoOperacaoProposta.tsx",
  "C:\Users\Wesle\OneDrive\Desktop\Sistema Rodobens\facitcon\src\app\admin-master\page.tsx",
  "C:\Users\Wesle\OneDrive\Desktop\Sistema Rodobens\facitcon\src\app\admin-master\empresas\EmpresasClient.tsx",
  "C:\Users\Wesle\OneDrive\Desktop\Sistema Rodobens\facitcon\src\app\admin-master\planos\PlanosClient.tsx",
  "C:\Users\Wesle\OneDrive\Desktop\Sistema Rodobens\facitcon\src\app\admin-master\relatorios\RelatoriosMasterClient.tsx",
  "C:\Users\Wesle\OneDrive\Desktop\Sistema Rodobens\facitcon\src\app\admin-master\usuarios\UsuariosClient.tsx",
  "C:\Users\Wesle\OneDrive\Desktop\Sistema Rodobens\facitcon\src\app\proposta-publica\[id]\PublicPropostaClient.tsx",
  "C:\Users\Wesle\OneDrive\Desktop\Sistema Rodobens\facitcon\src\app\politica-de-privacidade\page.tsx",
  "C:\Users\Wesle\OneDrive\Desktop\Sistema Rodobens\facitcon\src\app\termos-de-uso\page.tsx",
  "C:\Users\Wesle\OneDrive\Desktop\Sistema Rodobens\facitcon\src\lib\supabase\helpers.ts",
  "C:\Users\Wesle\OneDrive\Desktop\Sistema Rodobens\facitcon\src\modules\auth\actions.ts"
)

foreach ($f in $files) {
    if (Test-Path $f) {
        $content = Get-Content -Path $f -Raw -Encoding UTF8
        
        # Text replacements
        $content = $content -replace 'FacitCon - CRM & Consórcio', 'Meu Parceiro Digital | Rodobens'
        $content = $content -replace 'FacitCon', 'Meu Parceiro Digital'
        $content = $content -replace 'Se torne um Meu Parceiro Digital', 'Solicite seu acesso'
        $content = $content -replace 'highOctaneOrange', ''
        
        # Primary mapping
        $content = $content -replace 'hover:bg-\[#FF7A00\]', 'hover:bg-[#FF7A40]'
        $content = $content -replace 'hover:text-\[#FF7A00\]', 'hover:text-[#FF7A40]'
        $content = $content -replace 'hover:bg-\[#F57C00\]', 'hover:bg-[#FF7A40]'
        $content = $content -replace 'hover:text-\[#F57C00\]', 'hover:text-[#FF7A40]'
        
        $content = $content -replace 'from-\[#FF7900\] to-\[#F57C00\]', 'from-[#00441F] to-[#00CF7B]'
        $content = $content -replace 'from-\[#FF7900\]/10 to-\[#F57C00\]/5', 'from-[#00441F]/10 to-[#00CF7B]/5'
        
        $content = $content -replace '#FF7A00', '#00CF7B'
        $content = $content -replace '#FF7900', '#00CF7B'
        $content = $content -replace '#994700', '#00441F'
        $content = $content -replace '#F57C00', '#00CF7B'
        
        # Backgrounds, text, borders
        $content = $content -replace 'bg-\[#F8F9FB\]', 'bg-[#F7F8F5]'
        $content = $content -replace 'text-\[#191C1E\]', 'text-[#00441F]'
        $content = $content -replace 'text-\[#584235\]', 'text-[#00441F]'
        $content = $content -replace 'border-\[#E6E7EB\]', 'border-[#E0E5CF]'
        $content = $content -replace 'border-\[#E1E2E4\]', 'border-[#E0E5CF]'
        
        # Focus rings
        $content = $content -replace 'focus:border-\[#FF7A00\]', 'focus:border-[#00CF7B]'
        $content = $content -replace 'focus:ring-\[#FF7A00\]', 'focus:ring-[#00CF7B]'
        
        Set-Content -Path $f -Value $content -Encoding UTF8
        Write-Host "Modified $f"
    } else {
        Write-Host "File not found: $f"
    }
}
