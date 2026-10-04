import assert from 'node:assert';
import { FinancingComparisonService } from './src/lib/financing/FinancingComparisonService.js';

// Simulador rudimentar de testes
console.log("Iniciando testes do Comparativo de Financiamento...\n");

try {
  // Teste 1: Cálculo Price - Conversão de taxa (1% ao mês -> 0.01)
  console.log("Teste 1: Cálculo Price Básico (1% a.m., 12 meses, R$ 10.000,00)");
  const result1 = FinancingComparisonService.calculatePriceFinancing(10000, 1.0, 12);
  // PMT esperado: ~888.49
  assert.ok(Math.abs(result1.monthlyPayment - 888.487) < 0.01, `Parcela incorreta: ${result1.monthlyPayment}`);
  console.log("✔ Passou");

  // Teste 2: Cálculo com entrada Zero
  console.log("Teste 2: Cálculo Price Básico (1.5% a.m., 48 meses, R$ 50.000,00)");
  const result2 = FinancingComparisonService.calculatePriceFinancing(50000, 1.5, 48);
  // PMT esperado: ~1468.75
  assert.ok(Math.abs(result2.monthlyPayment - 1468.75) < 0.01, `Parcela incorreta: ${result2.monthlyPayment}`);
  console.log("✔ Passou");

  // Teste 3: Prazos diferentes e entradas diferentes
  // R$ 100.000,00 bem, entrada 20.000 -> principal 80.000,00, 60 meses, 2%
  console.log("Teste 3: Com entrada de 20k (2% a.m., 60 meses, R$ 80.000,00 financiado)");
  const result3 = FinancingComparisonService.calculatePriceFinancing(80000, 2.0, 60);
  // PMT esperado: ~2301.45
  assert.ok(Math.abs(result3.monthlyPayment - 2301.45) < 0.01, `Parcela incorreta: ${result3.monthlyPayment}`);
  console.log("✔ Passou");

  // Teste 4: Taxa Zero (edge case)
  console.log("Teste 4: Taxa Zero (0% a.m., 10 meses, R$ 10.000,00)");
  const result4 = FinancingComparisonService.calculatePriceFinancing(10000, 0, 10);
  assert.strictEqual(result4.monthlyPayment, 1000, "Parcela deveria ser 1000");
  assert.strictEqual(result4.interestCost, 0, "Custo de juros deveria ser 0");
  console.log("✔ Passou");

  console.log("\nTodos os testes matemáticos do Sistema Price passaram com sucesso!");
} catch (err) {
  console.error("❌ Teste falhou:", err.message);
  process.exit(1);
}
