# Motor de Cálculos - Consórcio Rodobens

Este documento descreve detalhadamente toda a lógica matemática, financeira e de regras de negócio embutidas no motor de cálculos da **Rodobens**. Esta documentação serve como guia definitivo para replicação em outras plataformas ou para consultas de engenharia.

---

## 1. Composição Básica de uma Parcela

Qualquer cota da Rodobens é fundamentada em quatro pilares principais, baseados no crédito bruto:
- **FC (Fundo Comum):** O valor real do crédito dividido pelo prazo da cota.
- **TA (Taxa de Administração):** O percentual de taxa diluído linearmente ou alterado por modalidade.
- **FR (Fundo de Reserva):** Geralmente cobrado na mesma proporção do prazo.
- **SE (Seguro Prestamista):** Seguro obrigatório ou opcional cobrado ao longo do prazo.

**Fórmula Linear Base:**
`Parcela = FC + TA + FR + SE`

> **Nota Crítica:** Em quase todas as modalidades (exceto Degrau), a Taxa de Administração (TA), Fundo de Reserva (FR) e Seguro (SE) mantêm o comportamento de cálculo linear e fixo baseado no crédito cheio.

---

## 2. Modalidades de Planos

O motor sustenta diversas lógicas de pagamento de parcelas antes e depois da contemplação.

### 2.1. Plano Linear (100%)
O cliente paga 100% da parcela cheia (FC + TA + FR + SE) desde o início até o fim.

### 2.2. Linear 70% (Redução 30%)
- **Antes da Contemplação:** O cliente tem um desconto de 30% **apenas sobre o FC e a TA**. FR e Seguro não sofrem redução.
- **Déficit Acumulado:** Toda diferença de valor não paga (os 30%) vai se acumulando mês a mês num saldo chamado `diferencaAcumulada`.
- **Após Contemplação:** A `diferencaAcumulada` é somada ao saldo devedor e diluída nas parcelas restantes. O cliente passa a pagar 100% da parcela base + a diluição do déficit.

### 2.3. Redução 50%
Exatamente a mesma arquitetura do Linear 70%, porém o cliente paga apenas **50% do FC e da TA** até a contemplação. O acúmulo da diferença também é cobrado diluído após a contemplação.

### 2.4. Degrau e Degrau 70%
- **Metade do Prazo:** A Taxa de Administração (TA) **toda** é cobrada de forma superdimensionada apenas na primeira metade do prazo.
- `TA_efetiva = (Credito * (TaxaAdm / 100)) / (Prazo / 2)` (apenas para meses <= metade do prazo).
- Na segunda metade do plano, a Taxa de Administração zera, e o cliente paga apenas FC + Seguro + FR.
- Se for **Degrau 70%**, o FC e essa TA superdimensionada sofrem redução de 30% antes da contemplação, gerando déficit acumulado.

### 2.5. Plano Pontual (Adiantamento)
O plano Pontual é uma modalidade de compra antecipada garantida, sem assembleia de lance competitivo.
- **Regra dos 40%:** Para obter o bem no mês `X` estipulado, o cliente deve ter pago o equivalente a **40% do plano** até lá.
- **Adiantamento Pontual:** O cliente escolhe um mês (ex: 6º mês). O sistema verifica quantas parcelas base ele vai ter pago. A diferença para os 40% é o valor cobrado como uma **parcela balão (adiantamento)** no momento da entrega do bem.

---

## 3. O "Furo" (Paradoxo do Prazo Misto)

O Furo é uma regra severa e fundamental da Rodobens quando a Cota é vendida com prazo menor que o Grupo original.
- Exemplo: Prazo Máximo do Grupo = 216 meses. Prazo da Cota do Cliente = 180 meses.
- **Diferença (Furo):** 216 - 180 = 36 meses.
- **Regra de Amortização Obrigatória:** Qualquer oferta de lance na cota do cliente vai PRIMEIRO pagar esse Furo (parcelas abstratas). 

**Cálculo:**
1. Acha-se o `Valor do Furo em Reais` = `Furo (meses)` × `Parcela Linear Base`.
2. Do valor do lance ofertado, abate-se primeiramente o Furo.
3. Isso causa uma **redução de prazo matemática**, abaixando o tempo do contrato em exatos meses do furo quitado, mas sem baixar a parcela do cliente.
4. Só o excesso de lance (`excessoLance = Lance Total - Valor Furo`) será usado para a escolha de abatimento de Parcela ou Prazo pelo cliente.

---

## 4. Dinâmica e Matemática dos Lances

### 4.1. Lance Total e Composição
- `Lance Total` = `Lance Embutido` (pego do crédito) + `Recursos Próprios`.
- **Percentual do Lance no Grupo:** Ao contrário de outras administradoras que dividem o lance pelo Crédito Bruto, a Rodobens calcula o peso do lance no grupo assim: 
  `Percentual Lance Grupo = (Lance Total Reais / (Prazo Máx Grupo × Parcela Base Grupo)) × 100`

### 4.2. Formas de Abatimento do Excesso de Lance (Pós-Furo)
O lance restante (`excessoLance`) pode seguir 3 direções:
1. **Em Prazo:**
   - O lance divide pela Parcela Final Seca (Sem Seguro/Taxas variáveis).
   - O resultado inteiro = Quantidade de parcelas aniquiladas do final do contrato.
   - Resto (dízima) permanece no Saldo Devedor.
2. **Em Parcela:**
   - O lance não tira meses do fim. Ele é dividido homogeneamente pelos meses restantes efetivos.
   - Isso joga a mensalidade final para baixo violentamente.
3. **Misto (50% / 50%):**
   - Metade do valor vai para cálculo matemático "Em Prazo" (encurtando os meses finais).
   - A outra metade vai para "Em Parcela" (reduzindo o valor do boleto mensal).

---

## 5. Saldo Devedor e Cronograma

O motor roda um laço iterativo rigoroso mês a mês simulando a conta financeira.
1. O `Saldo Devedor` inicia contendo `(FC + TA + FR + SE) * prazo`.
2. A cada mês pago normalmente, debita-se o valor cobrado do Saldo.
3. No mês exato da **Contemplação**, injeta-se o `Lance Aplicado Total` reduzindo violentamente o Saldo Devedor.
4. As parcelas futuras são instantaneamente recalculadas com base nos Prazos Restantes e Déficits acumulados.
5. Se o abatimento for Prazo/Misto, o Saldo Devedor despencará tão rápido que vai atingir **zero** dezenas de meses antes do prazo estipulado.
6. Quando o Saldo Devedor bate em `0`, o loop não para. Ele renderiza todas as parcelas fantasmas e marca-as internamente como `quitadaPorLance: true`, garantindo consistência visual de amortização ao usuário.

---

> _Esta modelagem previne que qualquer furo ou lance quebrado afete as somatórias lineares em auditorias fiscais ou plataformas de simulação, garantindo 100% de compatibilidade com os espelhos da administradora._
