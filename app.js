// Variável de carrinho e função de adicionar ao carrinho
var cart = [];
let produtosCarregados = []; // Para armazenar os produtos originais

// Função para adicionar o produto ao carrinho (no banco de dados)
async function addItemToDatabaseCart(produtoId, quantidade) {
    try {
        const response = await fetch('http://localhost:3000/api/carrinho', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                produto_id: produtoId,
                quantidade: quantidade
            })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao adicionar item ao carrinho no banco de dados.');
        }
    } catch (error) {
        console.error(error);
    }
}

// Variável para armazenar o produto selecionado no pop-up
let selectedProduct = null;

// Função para abrir o pop-up de adicionar ao carrinho
function showAddToCartPopup(produto) {
    selectedProduct = produto; // Armazena o produto selecionado
    document.getElementById('desired-value').value = ''; // Limpa os valores anteriores
    document.getElementById('quantity').value = ''; // Limpa os valores anteriores
    document.getElementById('total-price').innerText = 'Total: R$ 0,00'; // Reseta o total
    document.getElementById('cut').value = 'peça';
    document.getElementById('add-to-cart-popup').style.display = 'flex';
}

// Função para fechar o pop-up
function closeAddToCartPopup() {
    document.getElementById('add-to-cart-popup').style.display = 'none';
}

// Função para atualizar a quantidade com base no valor desejado
function updateQuantityFromValue() {
    const desiredValue = parseFloat(document.getElementById('desired-value').value) || 0;
    const pricePerKg = selectedProduct ? selectedProduct.preco : 0;
    const quantityKg = (desiredValue / pricePerKg).toFixed(2);

    document.getElementById('quantity').value = quantityKg;
    document.getElementById('total-price').innerText = `Total: R$ ${desiredValue.toFixed(2)}`;
}
// Função para atualizar o preço total com base na quantidade de kg
function updateTotalPriceFromKg() {
    const quantityKg = parseFloat(document.getElementById('quantity').value) || 0;
    const pricePerKg = selectedProduct ? selectedProduct.preco : 0;
    const total = (quantityKg * pricePerKg).toFixed(2);

    document.getElementById('desired-value').value = total > 0 ? total : '';
    document.getElementById('total-price').innerText = `Total: R$ ${total}`;
}

// Função para confirmar e adicionar o produto ao carrinho
function confirmAddToCart() {
    const quantityKg = parseFloat(document.getElementById('quantity').value) || 0;
    const desiredValue = parseFloat(document.getElementById('desired-value').value) || 0;
    const cut = document.getElementById('cut').value;

    if (quantityKg <= 0 && desiredValue <= 0) {
        alert('Por favor, insira uma quantidade ou valor válido.');
        return;
    }

    const item = {
        id: selectedProduct.id,
        name: selectedProduct.nome,
        price: selectedProduct.preco,
        quantity: parseFloat(quantityKg),
        cut: cut
    };

    cart.push(item);
    updateCartCount();
    closeAddToCartPopup();
    alert(`${selectedProduct.nome} adicionado ao carrinho!`);

    // Chama a função para adicionar o item no carrinho do banco de dados
    addItemToDatabaseCart(selectedProduct.id, parseFloat(quantityKg));
}
// Função para atualizar o contador de itens do carrinho
function updateCartCount() {
    document.getElementById('cart-count').innerText = cart.length;
}

// Função para exibir itens no carrinho em um modal
function showCart() {
    const cartDiv = document.getElementById('cart-items');
    cartDiv.innerHTML = ''; 

    if (cart.length === 0) {
        cartDiv.innerHTML = '<p>Seu carrinho está vazio.</p>';
    } else {
        cart.forEach((item, index) => {
            cartDiv.innerHTML += `
                <div class="cart-item">
                    <p>${item.quantity} x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}</p>
                    <button onclick="removeFromCart(${index})">Remover</button>
                </div>
            `;
        });
    }
    document.getElementById('cart-section').style.display = 'flex';
}

// Função para remover item do carrinho
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartCount();
    showCart();
}

// Função para fechar o carrinho
function closeCart() {
    document.getElementById('cart-section').style.display = 'none';
}

// Finalizar pedido pelo WhatsApp
async function finalizeOrder() {
    const address = document.getElementById('address').value;
    const payment = document.getElementById('payment').value;

    if (!address || !payment) {
        alert('Por favor, preencha o endereço e a forma de pagamento.');
        return;
    }

    try {
        // Chama a API para finalizar o pedido no banco de dados
        const response = await fetch('http://localhost:3000/api/finalizar-pedido', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            // Tenta extrair a mensagem de erro do servidor
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData && errorData.error ? errorData.error : 'Erro desconhecido.';
            throw new Error(errorMessage);
        }

        const data = await response.json();

        // Envia a mensagem para o WhatsApp após o pedido ser finalizado no banco
        let orderMessage = 'Gostaria de fazer o seguinte pedido:\n';
        cart.forEach(item => {
            orderMessage += `${item.quantity} x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}\n`;
        });
        orderMessage += `\nEndereço de entrega: ${address}\nForma de pagamento: ${payment}`;

        const whatsappLink = `https://api.whatsapp.com/send?phone=5562986030093&text=${encodeURIComponent(orderMessage)}`;
        window.open(whatsappLink, '_blank');

        // Limpa o carrinho local e a interface
        cart = [];
        updateCartCount();
        closePopup();
        closeCart();
        alert('Pedido finalizado com sucesso!');
    } catch (error) {
        console.error('Erro ao finalizar pedido:', error);
        alert(`Erro ao finalizar pedido: ${error.message}`);
    }
}


async function salvarProduto(event) {
    event.preventDefault();
    const form = document.getElementById('cadastro-produto');
    const formData = new FormData(form);
    const produtoId = document.getElementById('produto-id').value;

    try {
        let response;
        if (produtoId) {
            response = await fetch(`http://localhost:3000/api/produtos/${produtoId}`, {
                method: 'PUT',
                body: formData
            });
        } else {
            response = await fetch('http://localhost:3000/api/produtos', {
                method: 'POST',
                body: formData
            });
        }

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            form.reset();
            document.getElementById('produto-id').value = '';
            carregarProdutos();
        } else {
            alert(data.error || 'Erro ao salvar o produto.');
        }
    } catch (error) {
        console.error('Erro ao salvar o produto:', error);
        alert('Erro ao salvar o produto.');
    }
}
function showProductPopup(isEditing = false, produto = null) {
    const popupTitle = document.getElementById('popup-title');
    const produtoIdField = document.getElementById('produto-id');
    const nomeProdutoField = document.getElementById('nome-produto');
    const descricaoProdutoField = document.getElementById('descricao-produto');
    const precoProdutoField = document.getElementById('preco-produto');
    const categoriaProdutoField = document.getElementById('categoria-produto');
    const estoqueProdutoField = document.getElementById('estoque-produto');
    const imagemProdutoField = document.getElementById('imagem-produto');

    // Se for edição, preenche os campos com os dados do produto
    if (isEditing && produto) {
        popupTitle.textContent = 'Editar Produto';
        produtoIdField.value = produto.id;
        nomeProdutoField.value = produto.nome;
        descricaoProdutoField.value = produto.descricao;
        precoProdutoField.value = produto.preco;
        categoriaProdutoField.value = produto.categoria;
        estoqueProdutoField.value = produto.estoque;
    } else {
        popupTitle.textContent = 'Cadastrar Produto';
        produtoIdField.value = '';
        nomeProdutoField.value = '';
        descricaoProdutoField.value = '';
        precoProdutoField.value = '';
        categoriaProdutoField.value = 'Promoção do dia';  // Define uma categoria padrão
        estoqueProdutoField.value = '';
        imagemProdutoField.value = '';
    }

    document.getElementById('product-popup').style.display = 'flex';
}


// Função para fechar o pop-up
function closeProductPopup() {
    document.getElementById('product-popup').style.display = 'none';
}
async function editarProduto(id) {
    try {
        const produto = await buscarProduto(id);
        if (produto) {
            showProductPopup(true, produto); // Abre o pop-up no modo edição com os dados do produto
        }
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        alert('Erro ao buscar produto.');
    }
}

// Atualize a função editarProduto para abrir o pop-up com os dados do produto
async function editarProduto(id) {
    try {
        const produto = await buscarProduto(id);
        if (produto) {
            showProductPopup(true, produto); // Abre o pop-up no modo edição
        }
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        alert('Erro ao buscar produto.');
    }
}


// Funções de pop-up
function showPopup() {
    if (cart.length === 0) {
        alert('Adicione itens ao carrinho antes de finalizar o pedido.');
        return;
    }
    document.getElementById('popup').style.display = 'flex';
}

function closePopup() {
    document.getElementById('popup').style.display = 'none';
}

// Função para carregar produtos
async function carregarProdutos() {
    try {
        const response = await fetch('http://localhost:3000/api/produtos');
        if (!response.ok) throw new Error('Erro ao carregar produtos.');
        const produtos = await response.json();
        produtosCarregados = produtos; // Armazena os produtos originais
        renderizarProdutos(produtos);
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

function renderizarProdutos(produtos) {
    const listaProdutos = document.getElementById('produtos-container');
    if (!listaProdutos) {
        console.error('Elemento de lista de produtos não encontrado.');
        return;
    }

    const isComerciante = window.location.pathname.includes('comerciante.html');
    listaProdutos.innerHTML = '';

    produtos.forEach(produto => {
        const productItem = document.createElement('div');
        productItem.classList.add('produto-item');

        productItem.innerHTML = `
            <img src="http://localhost:3000/uploads/${produto.imagem}" alt="${produto.nome}" class="produto-imagem">
            <div class="produto-info">
                <p class="produto-nome">${produto.nome}</p>
                <p class="produto-descricao">${produto.descricao}</p>
                <p class="produto-categoria"><strong>Categoria:</strong> ${produto.categoria}</p>
                <p class="produto-estoque"><strong>Estoque:</strong> ${produto.estoque} kg</p>
                <p class="produto-preco">R$ ${Number(produto.preco).toFixed(2)}</p>
            </div>
            <div class="produto-botoes">
                ${isComerciante ? `
                    <button class="btn-acao" onclick="editarProduto(${produto.id})">Editar</button>
                    <button class="btn-acao" onclick="excluirProduto(${produto.id})">Excluir</button>
                ` : `
                    <button class="btn-carrinho" onclick='showAddToCartPopup(${JSON.stringify(produto)})'>
                        <i class="fa fa-cart-plus"></i> Adicionar ao Carrinho
                    </button>
                `}
            </div>
        `;
        listaProdutos.appendChild(productItem);
    });
}

// Função de login
async function login(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password, role }),
        });

        const data = await response.json();

        if (response.ok) {
            // Login bem-sucedido, redirecionar para a página correta
            if (role === "cliente") {
                window.location.href = "cliente.html";
            } else if (role === "comerciante") {
                window.location.href = "comerciante.html";
            }
        } else {
            // Mostra a mensagem de erro retornada pelo backend
            alert(data.error || 'Erro ao fazer login.');
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        alert('Erro ao fazer login.');
    }
}
async function registerUser(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, role: 'cliente' })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Cadastro realizado com sucesso!');
            window.location.href = "index.html";  // Redireciona para a tela de login
        } else {
            document.getElementById('register-error').innerText = data.error || 'Erro ao cadastrar usuário.';
        }
    } catch (error) {
        console.error('Erro ao cadastrar o usuário:', error);
        document.getElementById('register-error').innerText = 'Erro ao cadastrar usuário.';
    }
}

async function buscarProduto(id) {
    try {
        const response = await fetch(`http://localhost:3000/api/produtos/${id}`);
        if (!response.ok) throw new Error('Produto não encontrado.');
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
    }
}

async function excluirProduto(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        try {
            const response = await fetch(`http://localhost:3000/api/produtos/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Erro ao excluir o produto.');

            alert('Produto excluído com sucesso');
            carregarProdutos();
        } catch (error) {
            console.error('Erro ao excluir o produto:', error);
        }
    }
}
function filtrarProdutos() {
    const pesquisaTermo = document.getElementById('pesquisa-produto').value.toLowerCase();
    const categoriaSelecionada = document.getElementById('categoria-filtro').value;

    const produtosFiltrados = produtosCarregados.filter(produto => {
        const nomeMatch = produto.nome.toLowerCase().includes(pesquisaTermo);
        const categoriaMatch = categoriaSelecionada === "" || produto.categoria === categoriaSelecionada;

        return nomeMatch && categoriaMatch;
    });

    renderizarProdutos(produtosFiltrados);
}

// Carrega os produtos na inicialização da página
window.onload = carregarProdutos;

// Event listener de login e formulário de produto
document.getElementById('login-form')?.addEventListener('submit', login);







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
document.getElementById('chat-toggle').addEventListener('click', () => {
  document.getElementById('chatbot').classList.toggle('hidden');
  if (!document.getElementById('chatbot').classList.contains('hidden')) {
    renderBot();
  }
});
document.getElementById('chat-close').addEventListener('click', () => {
  document.getElementById('chatbot').classList.add('hidden');
});
