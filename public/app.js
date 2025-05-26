var cart = [];
let produtosCarregados = []; // Para armazenar os produtos originais

// Função para adicionar o produto ao carrinho (no banco de dados)
async function addItemToDatabaseCart(produtoId, quantidade) {
    try {
        const response = await fetch('/api/carrinho', {
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
        // Usando um modal customizado em vez de alert()
        showCustomAlert('Por favor, insira uma quantidade ou valor válido.');
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
    // Usando um modal customizado em vez de alert()
    showCustomAlert(`${selectedProduct.nome} adicionado ao carrinho!`);

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

async function finalizeOrder() {
    const address = document.getElementById('address').value;
    const payment = document.getElementById('payment').value;
    const nomeCliente = document.getElementById('nome-cliente').value;

    if (!address || !payment || !nomeCliente) {
        showCustomAlert('Por favor, preencha todos os campos: nome, endereço e forma de pagamento.');
        return;
    }

    const valorTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

    try {
        const response = await fetch('/api/finalizar-pedido', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                endereco: address,
                pagamento: payment,
                cliente_nome: nomeCliente,
                valor_total: valorTotal,
                itens: cart
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.error || 'Erro desconhecido.';
            throw new Error(errorMessage);
        }

        const data = await response.json();

        let orderMessage = 'Gostaria de fazer o seguinte pedido:\n';
        cart.forEach(item => {
            orderMessage += `${item.quantity} x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}\n`;
        });
        orderMessage += `\nCliente: ${nomeCliente}\nEndereço: ${address}\nForma de pagamento: ${payment}\nTotal: R$ ${valorTotal.toFixed(2)}`;

        const whatsappLink = `https://api.whatsapp.com/send?phone=5562986030093&text=${encodeURIComponent(orderMessage)}`;
        window.open(whatsappLink, '_blank');

        cart = [];
        updateCartCount();
        closePopup();
        closeCart();
        showCustomAlert('Pedido finalizado com sucesso!');
    } catch (error) {
        console.error('Erro ao finalizar pedido:', error);
        showCustomAlert(`Erro ao finalizar pedido: ${error.message}`);
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
            response = await fetch(`/api/produtos/${produtoId}`, {
                method: 'PUT',
                body: formData
            });
        } else {
            response = await fetch('/api/produtos', {
                method: 'POST',
                body: formData
            });
        }

        const data = await response.json();

        if (response.ok) {
            // Usando um modal customizado em vez de alert()
            showCustomAlert(data.message);
            form.reset();
            document.getElementById('produto-id').value = '';
            carregarProdutos();
        } else {
            // Usando um modal customizado em vez de alert()
            showCustomAlert(data.error || 'Erro ao salvar o produto.');
        }
    } catch (error) {
        console.error('Erro ao salvar o produto:', error);
        // Usando um modal customizado em vez de alert()
        showCustomAlert('Erro ao salvar o produto.');
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
        categoriaProdutoField.value = 'Promoção do dia';   // Define uma categoria padrão
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
        // Usando um modal customizado em vez de alert()
        showCustomAlert('Erro ao buscar produto.');
    }
}

// Funções de pop-up
function showPopup() {
    if (cart.length === 0) {
        // Usando um modal customizado em vez de alert()
        showCustomAlert('Adicione itens ao carrinho antes de finalizar o pedido.');
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
        const response = await fetch('/api/produtos');
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
            <img src="${produto.imagem}" alt="${produto.nome}" class="produto-imagem">
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
        const response = await fetch('/api/login', {
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
            // Usando um modal customizado em vez de alert()
            showCustomAlert(data.error || 'Erro ao fazer login.');
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        // Usando um modal customizado em vez de alert()
        showCustomAlert('Erro ao fazer login.');
    }
}
async function registerUser(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, role: 'cliente' })
        });

        const data = await response.json();
        if (response.ok) {
            // Usando um modal customizado em vez de alert()
            showCustomAlert('Cadastro realizado com sucesso!');
            window.location.href = "index.html";   // Redireciona para a tela de login
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
        const response = await fetch(`/api/produtos/${id}`);
        if (!response.ok) throw new Error('Produto não encontrado.');
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
    }
}

async function excluirProduto(id) {
    // Usando um modal customizado em vez de confirm()
    showCustomConfirm('Tem certeza que deseja excluir este produto?', async () => {
        try {
            const response = await fetch(`/api/produtos/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Erro ao excluir o produto.');

            // Usando um modal customizado em vez de alert()
            showCustomAlert('Produto excluído com sucesso');
            carregarProdutos();
        } catch (error) {
            console.error('Erro ao excluir o produto:', error);
            // Usando um modal customizado em vez de alert()
            showCustomAlert('Erro ao excluir o produto.');
        }
    });
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

function renderizarPedidos(pedidos) {
  const container = document.getElementById('pedidos-container');
  if (!container) return;

  container.innerHTML = '';

  // Filtra apenas os pedidos relevantes
  const pedidosVisiveis = pedidos.filter(p =>
    p.status !== 'Cancelado' && p.status !== 'Finalizado'
  );

  pedidosVisiveis.forEach(pedido => {
    const div = document.createElement('div');
    div.className = 'pedido-item';
    div.innerHTML = `
      <h3>Pedido #${pedido.id}</h3>
      <p><strong>Cliente:</strong> ${pedido.clienteNome}</p>
      <p><strong>Endereço:</strong> ${pedido.endereco}</p>
      <p><strong>Valor Total:</strong> R$ ${pedido.valorTotal.toFixed(2)}</p>
      <p>
        <strong>Status:</strong>
        <select onchange="atualizarStatus(${pedido.id}, this.value)">
          <option ${pedido.status === 'Pendente'       ? 'selected' : ''}>Pendente</option>
          <option ${pedido.status === 'Aceito'         ? 'selected' : ''}>Aceito</option>
          <option ${pedido.status === 'Em separação'   ? 'selected' : ''}>Em separação</option>
          <option ${pedido.status === 'Enviado'        ? 'selected' : ''}>Enviado</option>
          <option ${pedido.status === 'Finalizado'    ? 'selected' : ''}>Finalizado</option>
          <option ${pedido.status === 'Cancelado'     ? 'selected' : ''}>Cancelado</option>
        </select>
      </p>
      <ul>
        ${pedido.itens
          .map(item => `<li>${item.quantidade}x ${item.nome}</li>`)
          .join('')}
      </ul>
    `;
    container.appendChild(div);
  });
}


// Função para carregar o relatório de vendas (MODIFICADA)
async function carregarRelatorio() {
  const inicio = document.getElementById('data-inicio').value;
  const fim = document.getElementById('data-fim').value;
  const hIni = document.getElementById('hora-inicio').value;
  const hFim = document.getElementById('hora-fim').value;
  const categoria = document.getElementById('categoria').value;

  const params = new URLSearchParams();
  if (inicio) params.append('dataInicio', inicio);
  if (fim) params.append('dataFim', fim);
  if (hIni) params.append('horaInicio', hIni);
  if (hFim) params.append('horaFim', hFim);
  if (categoria) params.append('categoria', categoria);

  try {
    const response = await fetch(`${baseURL}/api/relatorio-vendas?${params}`);
    const relatorio = await response.json();

    const container = document.getElementById('relatorio-container');
    container.innerHTML = '';

    let total = 0;

    relatorio.forEach(r => {
      const subtotal = r.preco * r.quantidade;
      total += subtotal;

      container.innerHTML += `
        <div class="produto-item">
          <p><strong>Produto:</strong> ${r.nome}</p>
          <p><strong>Categoria:</strong> ${r.categoria}</p>
          <p><strong>Quantidade:</strong> ${r.quantidade}</p>
          <p><strong>Preço unitário:</strong> R$ ${Number(r.preco).toFixed(2)}</p>
          <p><strong>Subtotal:</strong> R$ ${subtotal.toFixed(2)}</p>
          <p><strong>Data/Hora:</strong> ${new Date(r.criado_em).toLocaleString()}</p>
        </div>
      `;
    });

    document.getElementById('total-vendas').innerText = `Total: R$ ${total.toFixed(2)}`;
  } catch (err) {
    console.error('Erro ao carregar relatório:', err);
    showCustomAlert('Erro ao carregar relatório de vendas.');
  }
}

// Carrega os produtos na inicialização da página (MODIFICADA)
window.onload = () => {
  if (window.location.pathname.includes('comerciante.html') || window.location.pathname.includes('cliente.html')) {
    carregarProdutos();
  }
  if (window.location.pathname.includes('pedidos.html')) {
    carregarPedidos();
  }
  if (window.location.pathname.includes('relatorios.html')) {
    carregarRelatorio();
  }
};

// Event listener de login e formulário de produto
document.getElementById('login-form')?.addEventListener('submit', login);
