//chat bot de fluxo

// 1. Seu fluxo definido
const flow = {
  start: {
    text: "Olá! Sou seu assistente de cortes. Para qual tipo de preparo você busca indicação?",
    options: [
      { label: "Carne moída", next: "moerCarne" },
      { label: "Churrasco", next: "churrasco" },
      { label: "Fritar/Grelhar/Strogonoff", next: "fritar" },
      { label: "Assados no forno", next: "assadosForno" },
      { label: "Ensopado/Carne de panela", next: "ensopado" },
      { label: "Bifes", next: "bife" }
    ]
  },

  /* ====== CARNE MOÍDA ====== */
  moerCarne: {
    text: "Para carne moída, qual teor de gordura você prefere?",
    options: [
      { label: "Pouca gordura", next: "moerPouca" },
      { label: "Gordura média", next: "moerMedia" },
      { label: "Muita gordura", next: "moerAlta" },
      { label: "Menu principal", next: "start" }
    ]
  },
  moerPouca: {
    text: "Patinho: corte magro e macio, ideal para quem busca pouca gordura na carne moída.",
    options: [
      { label: "Outra opção de moer", next: "moerCarne" },
      { label: "Menu principal", next: "start" }
    ]
  },
  moerMedia: {
    text: "Fraldinha: bom equilíbrio entre gordura e sabor, garante suculência média na moagem.",
    options: [
      { label: "Outra opção de moer", next: "moerCarne" },
      { label: "Menu principal", next: "start" }
    ]
  },
  moerAlta: {
    text: "Acém e Músculo: cortes com mais gordura e colágeno, deixam a carne moída bem suculenta.",
    options: [
      { label: "Outra opção de moer", next: "moerCarne" },
      { label: "Menu principal", next: "start" }
    ]
  },

  /* ====== CHURRASCO ====== */
  churrasco: {
    text: "Para churrasco, qual corte você quer conhecer melhor?",
    options: [
      { label: "Picanha", next: "churrascoPicanha" },
      { label: "Alcatra", next: "churrascoAlcatra" },
      { label: "Contrafilé", next: "churrascoContrafile" },
      { label: "Menu principal", next: "start" }
    ]
  },
  churrascoPicanha: {
    text: "Picanha: corte suculento com capa de gordura que confere sabor marcante. Tempere com sal grosso e asse em altas temperaturas.",
    options: [
      { label: "Outra opção de churrasco", next: "churrasco" },
      { label: "Menu principal", next: "start" }
    ]
  },
  churrascoAlcatra: {
    text: "Alcatra: carne magra e saborosa, perfeita no espeto ou na grelha. Evite fatias muito finas para não ressecar.",
    options: [
      { label: "Outra opção de churrasco", next: "churrasco" },
      { label: "Menu principal", next: "start" }
    ]
  },
  churrascoContrafile: {
    text: "Contrafilé: bom custo-benefício, macio e saboroso. Remova o nervo lateral e asse em temperatura alta para um ponto perfeito.",
    options: [
      { label: "Outra opção de churrasco", next: "churrasco" },
      { label: "Menu principal", next: "start" }
    ]
  },

  /* ====== FRITAR/GRELHAR/STROGONOFF ====== */
  fritar: {
    text: "Para fritar, grelhar na frigideira ou preparar strogonoff, escolha o corte:",
    options: [
      { label: "Filé Mignon", next: "fritarFileMignon" },
      { label: "Contrafilé", next: "fritarContrafile" },
      { label: "Alcatra", next: "fritarAlcatra" },
      { label: "Bisteca", next: "fritarBisteca" },
      { label: "Menu principal", next: "start" }
    ]
  },
  fritarFileMignon: {
    text: "Filé Mignon: muito macio, ideal em bifes rápidos, tiras para strogonoff ou grelhados rápidos.",
    options: [
      { label: "Outra opção de fritar", next: "fritar" },
      { label: "Menu principal", next: "start" }
    ]
  },
  fritarContrafile: {
    text: "Contrafilé: versátil e suculento, ótimo em bifes grossos ou fatias para receitas em frigideira.",
    options: [
      { label: "Outra opção de fritar", next: "fritar" },
      { label: "Menu principal", next: "start" }
    ]
  },
  fritarAlcatra: {
    text: "Alcatra: corte magro e saboroso, funciona bem em bifes, escalopes e strogonoff.",
    options: [
      { label: "Outra opção de fritar", next: "fritar" },
      { label: "Menu principal", next: "start" }
    ]
  },
  fritarBisteca: {
    text: "Bisteca: corte com osso, sabor intenso; aconselhável fritar em manteiga ou óleo bem quente.",
    options: [
      { label: "Outra opção de fritar", next: "fritar" },
      { label: "Menu principal", next: "start" }
    ]
  },

  /* ====== ASSADOS NO FORNO ====== */
  assadosForno: {
    text: "Para assados no forno, escolha o corte:",
    options: [
      { label: "Coxão Duro", next: "assarCoxaoDuro" },
      { label: "Coxão Mole", next: "assarCoxaoMole" },
      { label: "Cupim", next: "assarCupim" },
      { label: "Lagarto", next: "assarLagarto" },
      { label: "Costela", next: "assarCostela" },
      { label: "Filé Mignon", next: "assarFileMignon" },
      { label: "Alcatra", next: "assarAlcatra" },
      { label: "Maminha", next: "assarMaminha" },
      { label: "Menu principal", next: "start" }
    ]
  },
  assarCoxaoDuro: {
    text: "Coxão Duro: ideal para cozimento lento, rosbife e carnes recheadas no forno.",
    options: [
      { label: "Outra opção de assado", next: "assadosForno" },
      { label: "Menu principal", next: "start" }
    ]
  },
  assarCoxaoMole: {
    text: "Coxão Mole: fibras curtas e maciez, ótimo para assados finos (paillard) ou à milanesa.",
    options: [
      { label: "Outra opção de assado", next: "assadosForno" },
      { label: "Menu principal", next: "start" }
    ]
  },
  assarCupim: {
    text: "Cupim: corte com bastante gordura entremeada, perfeito para assados lentos e suculentos.",
    options: [
      { label: "Outra opção de assado", next: "assadosForno" },
      { label: "Menu principal", next: "start" }
    ]
  },
  assarLagarto: {
    text: "Lagarto: carne magra, ótima para assados recheados e fatias finas com molho.",
    options: [
      { label: "Outra opção de assado", next: "assadosForno" },
      { label: "Menu principal", next: "start" }
    ]
  },
  assarCostela: {
    text: "Costela: mais gordura e osso, fica perfeita em assados longos e suculentos.",
    options: [
      { label: "Outra opção de assado", next: "assadosForno" },
      { label: "Menu principal", next: "start" }
    ]
  },
  assarFileMignon: {
    text: "Filé Mignon: nobre e magro, ideal em medalhões ou bifes ao forno.",
    options: [
      { label: "Outra opção de assado", next: "assadosForno" },
      { label: "Menu principal", next: "start" }
    ]
  },
  assarAlcatra: {
    text: "Alcatra: versátil também no forno, em peça inteira ou bifes grossos.",
    options: [
      { label: "Outra opção de assado", next: "assadosForno" },
      { label: "Menu principal", next: "start" }
    ]
  },
  assarMaminha: {
    text: "Maminha: suculenta e macia, perfeita em peça única ou fatias grossas.",
    options: [
      { label: "Outra opção de assado", next: "assadosForno" },
      { label: "Menu principal", next: "start" }
    ]
  },

  /* ====== ENSOPADOS/CARNE DE PANELA ====== */
  ensopado: {
    text: "Para ensopados e carne de panela, escolha o corte:",
    options: [
      { label: "Fraldinha", next: "ensopadoFraldinha" },
      { label: "Acém", next: "ensopadoAcem" },
      { label: "Costela", next: "ensopadoCostela" },
      { label: "Menu principal", next: "start" }
    ]
  },
  ensopadoFraldinha: {
    text: "Fraldinha: fibras soltas, ideal para ensopados, carne louca e caldos.",
    options: [
      { label: "Outra opção de ensopado", next: "ensopado" },
      { label: "Menu principal", next: "start" }
    ]
  },
  ensopadoAcem: {
    text: "Acém: rico em colágeno, fica macio em cozimentos longos na panela.",
    options: [
      { label: "Outra opção de ensopado", next: "ensopado" },
      { label: "Menu principal", next: "start" }
    ]
  },
  ensopadoCostela: {
    text: "Costela: gordurosa e saborosa, exige panela de pressão ou cozimento lento.",
    options: [
      { label: "Outra opção de ensopado", next: "ensopado" },
      { label: "Menu principal", next: "start" }
    ]
  },

  /* ====== BIFES ====== */
  bife: {
    text: "Para bifes rápidos, escolha o corte:",
    options: [
      { label: "Contrafilé", next: "bifeContrafile" },
      { label: "Alcatra", next: "bifeAlcatra" },
      { label: "Coxão Mole", next: "bifeCoxaoMole" },
      { label: "Menu principal", next: "start" }
    ]
  },
  bifeContrafile: {
    text: "Contrafilé: macio e suculento, perfeito em bifes grossos e rápidos na frigideira.",
    options: [
      { label: "Outra opção de bife", next: "bife" },
      { label: "Menu principal", next: "start" }
    ]
  },
  bifeAlcatra: {
    text: "Alcatra: corte magro e versátil, ótimo em bifes finos ou escalopes.",
    options: [
      { label: "Outra opção de bife", next: "bife" },
      { label: "Menu principal", next: "start" }
    ]
  },
  bifeCoxaoMole: {
    text: "Coxão Mole: fibras curtas e maciez, indicado para bifes finos e milanesas.",
    options: [
      { label: "Outra opção de bife", next: "bife" },
      { label: "Menu principal", next: "start" }
    ]
  },

  /* ====== FIM ====== */
  fim: {
    text: "Obrigado! Se precisar de mais ajuda, é só chamar.",
    options: []
  }
};

let current = 'start';
function renderBot() {
  // Aqui você renderiza flow[current].text e cria botões para cada flow[current].options,
  // atualizando `current` para option.next ao clicar e chamando renderBot() novamente.
}

// 2. Função que renderiza uma mensagem do bot + opções
function renderBot() {
  const body = document.getElementById('chat-body');
  body.innerHTML = ''; // limpa
  const node = flow[current];
  
  // Mensagem do bot
  const msg = document.createElement('div');
  msg.className = 'bot-message';
  msg.textContent = node.text;
  body.appendChild(msg);

  // Opções
  node.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-button';
    btn.textContent = opt.label;
    btn.onclick = () => {
      current = opt.next;
      renderBot();
      body.scrollTop = body.scrollHeight;
    };
    body.appendChild(btn);
  });
}

// 3. Toggle do chat
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('chat-toggle')?.addEventListener('click', () => {
    document.getElementById('chatbot').classList.toggle('hidden');
    if (!document.getElementById('chatbot').classList.contains('hidden')) {
      renderBot();
    }
  });

  document.getElementById('chat-close')?.addEventListener('click', () => {
    document.getElementById('chatbot').classList.add('hidden');
  });
});

