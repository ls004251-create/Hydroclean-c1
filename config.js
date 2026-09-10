/* ============================================================================
   HydroClean — CONFIGURAÇÃO CENTRAL
   ----------------------------------------------------------------------------
   Único arquivo que precisa ser editado para atualizar contatos, catálogo de
   produtos, regras de preço do configurador e dados demonstrativos.
   ========================================================================== */

window.HYDROCLEAN_CONFIG = {

  /* --------------------------------------------------------------------------
     1) CONTATOS
     -------------------------------------------------------------------------- */
  contato: {
    whatsapp: "5500000000000",                 // DDI+DDD+número, só dígitos
    whatsappMensagem: "Olá! Vim pelo site do HydroClean e gostaria de solicitar um orçamento.",
    instagram: "hydroclean",                    // sem @
    email: "contato@hydroclean.eco",
    telefone: "5500000000000",
    telefoneLabel: "(00) 00000-0000",
    endereco: "Brasil"
  },

  /* --------------------------------------------------------------------------
     2) FORMULÁRIO / ORÇAMENTO
     modo "demo"  -> mostra confirmação visual sem backend (experiência funcional)
     modo "whatsapp" -> abre o WhatsApp com os dados
     modo "email" -> abre o app de e-mail com os dados
     -------------------------------------------------------------------------- */
  formulario: { modo: "demo" },

  /* --------------------------------------------------------------------------
     3) CATÁLOGO DE PRODUTOS
     "base" = preço base do modelo (R$). Os modelos maiores têm base maior,
     garantindo que nunca custem menos que os menores.
     -------------------------------------------------------------------------- */
  produtos: [
    {
      id: "compact",
      nome: "HydroClean Compact",
      base: 3900,
      publico: "Residências e pequenos espaços",
      capacidadePadrao: "Até 250 L/dia",
      dimensoes: "0,6 × 0,6 × 1,1 m",
      destaque: "Compacto",
      recursos: ["Microalgas em cartucho", "1 painel solar", "Sensores essenciais", "Instalação simples"],
      tecnologia: ["microalgas", "solar", "sensores"]
    },
    {
      id: "community",
      nome: "HydroClean Community",
      base: 11500,
      publico: "Espaços coletivos e comunidades",
      capacidadePadrao: "Até 900 L/dia",
      dimensoes: "1,2 × 0,9 × 1,6 m",
      destaque: "Mais escolhido",
      recursos: ["Reator de microalgas", "2 painéis solares", "Circulação assistida", "Monitoramento ampliado"],
      tecnologia: ["microalgas", "solar", "circulacao", "sensores", "filtragem"]
    },
    {
      id: "pro",
      nome: "HydroClean Pro",
      base: 26900,
      publico: "Aplicações comerciais de maior demanda",
      capacidadePadrao: "Até 3.000 L/dia",
      dimensoes: "2,0 × 1,2 × 1,8 m",
      destaque: "Alta capacidade",
      recursos: ["Reator de alto volume", "4+ painéis solares", "Circulação contínua", "Telemetria avançada", "Filtragem multicamada"],
      tecnologia: ["microalgas", "solar", "circulacao", "sensores", "filtragem"]
    }
  ],

  /* --------------------------------------------------------------------------
     4) CONFIGURADOR DE ORÇAMENTO — regras de preço COERENTES
     Preço = base(modelo) + custoCapacidade + custoEnergia + custoSensores + custoInstalacao
     -------------------------------------------------------------------------- */
  configurador: {
    moeda: "R$",

    // Aplicação -> modelo recomendado
    aplicacao: {
      residencial: { label: "Residencial", modelo: "compact" },
      comunitaria: { label: "Comunitária", modelo: "community" },
      comercial:   { label: "Comercial",   modelo: "pro" }
    },

    // Ordem dos modelos (menor -> maior), usada para recomendar o modelo.
    ordemModelos: ["compact", "community", "pro"],

    // Capacidade (L/dia). "custo" é somado ao preço e "modeloMin" garante que
    // capacidades maiores exijam pelo menos o modelo indicado (evita inversões).
    capacidade: [
      { label: "250 L/dia",   valor: 250,  custo: 0,    modeloMin: "compact" },
      { label: "500 L/dia",   valor: 500,  custo: 1800, modeloMin: "compact" },
      { label: "1.000 L/dia", valor: 1000, custo: 4200, modeloMin: "community" },
      { label: "3.000 L/dia", valor: 3000, custo: 9800, modeloMin: "pro" }
    ],

    // Energia
    energia: {
      solar:   { label: "Solar",   custo: 0,    nota: "Sistema 100% solar incluso" },
      hibrida: { label: "Híbrida", custo: 2600, nota: "Solar + rede como reserva" }
    },

    // Monitoramento / sensores
    monitoramento: {
      basico:   { label: "Básico",   custo: 0,    nota: "Parâmetros essenciais" },
      avancado: { label: "Avançado", custo: 3400, nota: "Telemetria e alertas em tempo real" }
    },

    // Instalação
    instalacao: {
      nao: { label: "Não",  custo: 0,    nota: "Retirada / autoinstalação" },
      sim: { label: "Sim",  custo: 1500, nota: "Instalação completa por equipe técnica" }
    },

    observacao: "Os valores apresentados são estimativas e podem variar conforme a configuração e a instalação."
  },

  /* --------------------------------------------------------------------------
     5) RESULTADOS / DESEMPENHO (dados demonstrativos)
     Rotulados como demonstrativos para a simulação comercial.
     -------------------------------------------------------------------------- */
  resultados: {
    rotulo: "Dados demonstrativos",
    observacao: "Valores demonstrativos utilizados para ilustrar o funcionamento da tecnologia. Substitua pelos resultados reais dos testes quando disponíveis.",
    parametros: [
      { nome: "Turbidez",       unidade: "NTU",  antes: 42,  depois: 6,   melhor: "menor" },
      { nome: "pH",             unidade: "",     antes: 5.4, depois: 7.1, melhor: "neutro", alvo: 7 },
      { nome: "Condutividade",  unidade: "µS/cm", antes: 780, depois: 410, melhor: "menor" },
      { nome: "Oxigênio dissolvido", unidade: "mg/L", antes: 3.1, depois: 7.8, melhor: "maior" }
    ]
  },

  /* --------------------------------------------------------------------------
     6) INDICADORES DE IMPACTO (demonstrativos)
     -------------------------------------------------------------------------- */
  impacto: [
    { valor: 100, sufixo: "%", titulo: "Energia solar", texto: "Operação projetada para funcionar com energia renovável." },
    { valor: 85,  sufixo: "%", titulo: "Redução de turbidez", texto: "Resultado demonstrativo em testes de bancada." },
    { valor: 0,   sufixo: "",  titulo: "Produtos químicos agressivos", texto: "Processo baseado em microalgas e filtragem." },
    { valor: 24,  sufixo: "/7", titulo: "Monitoramento", texto: "Acompanhamento contínuo dos parâmetros da água." }
  ]
};
