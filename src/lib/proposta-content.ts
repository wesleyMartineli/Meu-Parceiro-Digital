export type ProdutoType = "imovel" | "auto" | "moto" | "pesado" | "servico" | string;

export const PROPOSTA_CONTENT = {
  imovel: {
    label: "Imóvel",
    heroImage: "/images/propostas/Capa Proposta/Capa Consorcio Imoveis.png",
    slogan: "Seu planejamento para conquistar seu próximo imóvel com estratégia e previsibilidade.",
    quemSomosBg: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1200",
    beneficios: [
      { titulo: "Sem Juros", desc: "Aproveite o poder de compra à vista sem as altas taxas de financiamento." },
      { titulo: "Poder de Compra", desc: "Carta de crédito que equivale a dinheiro vivo na negociação do seu imóvel." },
      { titulo: "Alavancagem Patrimonial", desc: "Use seu capital de forma inteligente para aumentar seu patrimônio imobiliário." }
    ]
  },
  auto: {
    label: "Automóvel",
    heroImage: "/images/propostas/Capa Proposta/Capa Consorcio Automoveis.png",
    slogan: "A forma mais inteligente e econômica de renovar a sua garagem.",
    quemSomosBg: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1200",
    beneficios: [
      { titulo: "Sem Juros", desc: "Troque de carro sem pagar o dobro no final." },
      { titulo: "Planejamento", desc: "Programa a troca do seu veículo de forma sustentável." },
      { titulo: "Flexibilidade", desc: "Escolha qualquer marca ou modelo na hora da contemplação." }
    ]
  },
  moto: {
    label: "Motocicleta",
    heroImage: "/images/propostas/Capa Proposta/Capa Consorcio Motos.png",
    slogan: "Acelere a conquista da sua moto dos sonhos com parcelas que cabem no bolso.",
    quemSomosBg: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1200",
    beneficios: [
      { titulo: "Sem Juros", desc: "Acesso à sua moto nova sem taxas de financiamento." },
      { titulo: "Parcelas Baixas", desc: "As melhores condições e prazos para o seu orçamento." },
      { titulo: "Poder de Compra", desc: "Liberdade para comprar com qualquer concessionária." }
    ]
  },
  pesado: {
    label: "Veículo Pesado",
    heroImage: "/images/propostas/Capa Proposta/Capa Consorcio Caminhão.png",
    slogan: "Expanda sua frota e potencialize seus negócios com o menor custo financeiro.",
    quemSomosBg: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1200",
    beneficios: [
      { titulo: "Redução de Custo", desc: "Aumente a frota sem comprometer o fluxo de caixa." },
      { titulo: "Compra Estratégica", desc: "Renove seus caminhões com previsibilidade." },
      { titulo: "Sem Juros", desc: "Maior retorno sobre o investimento sem juros abusivos." }
    ]
  },
  servico: {
    label: "Serviços",
    heroImage: "/images/propostas/Capa Proposta/Capa Consorcio Serviço.png",
    slogan: "Realize aquele grande projeto, festa ou cirurgia com planejamento total.",
    quemSomosBg: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1200",
    beneficios: [
      { titulo: "Realização", desc: "Tire seus projetos do papel de forma programada." },
      { titulo: "Sem Juros", desc: "Evite empréstimos caros e cartões de crédito." },
      { titulo: "Liberdade", desc: "Contrate qualquer serviço mediante a nota fiscal." }
    ]
  },
  default: {
    label: "Consórcio",
    heroImage: "/images/propostas/Capa Proposta/Capa Consorcio Automoveis.png",
    slogan: "Uma alternativa inteligente para ampliar seu patrimônio com segurança.",
    quemSomosBg: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1200",
    beneficios: [
      { titulo: "Economia", desc: "A forma mais barata de adquirir grandes bens." },
      { titulo: "Sem Juros", desc: "Pague apenas a taxa de administração." },
      { titulo: "Poder de Compra", desc: "Equivale a um pagamento à vista após a contemplação." }
    ]
  }
};

export function getPropostaContent(produto: ProdutoType) {
  return PROPOSTA_CONTENT[produto as keyof typeof PROPOSTA_CONTENT] || PROPOSTA_CONTENT.default;
}
