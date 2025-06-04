require('dotenv').config();
const express = require('express');
const app     = express();
const multer  = require('multer');
const bodyParser = require('body-parser');
const cors    = require('cors');
const path    = require('path');
const { Pool } = require('pg');

// 1) Middlewares globais
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 2) Conexão com o banco Postgres (Railway)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
pool.on('connect', () => console.log('Conectado ao banco de dados Postgres!'));

// 3) Configuração do Cloudinary
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true
});

// 4) Storage Multer para Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'produtos',
    allowed_formats: ['jpg','jpeg','png','webp','gif','bmp'],
    transformation: [{ width: 800, crop: 'limit' }]
  }
});
const upload = multer({ storage });

// 5) Rotas de API

// Carrinho
app.post('/api/carrinho', async (req, res) => {
  const { produto_id, quantidade } = req.body;
  if (!produto_id || !quantidade || quantidade <= 0) {
    return res.status(400).json({ error: 'Dados inválidos fornecidos.' });
  }
  try {
    await pool.query(
      'INSERT INTO carrinho (produto_id, quantidade) VALUES ($1, $2)',
      [produto_id, quantidade]
    );
    res.status(201).json({ message: 'Item adicionado ao carrinho com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao adicionar item ao carrinho.' });
  }
});

app.post('/api/finalizar-pedido', async (req, res) => {
  const { endereco, pagamento, itens, cliente_nome } = req.body;

  if (!endereco || !pagamento || !cliente_nome || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ error: 'Dados incompletos para o pedido.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let valor_total = 0;

    // Calcular o valor total com base no preço real do banco
    for (const item of itens) {
      const { id: produto_id, quantity } = item;

      const result = await client.query(
        'SELECT preco FROM produtos WHERE id = $1',
        [produto_id]
      );

      const preco = parseFloat(result.rows[0]?.preco || 0);
      valor_total += preco * quantity;
    }

    // Criar pedido
    const pedidoResult = await client.query(
      'INSERT INTO pedidos (status, cliente_nome, endereco, valor_total) VALUES ($1, $2, $3, $4) RETURNING id',
      ['Pendente', cliente_nome, endereco, valor_total]
    );

    const pedidoId = pedidoResult.rows[0].id;

    // Processar os itens do pedido e atualizar o estoque
    for (const item of itens) {
      const { id: produto_id, quantity } = item;

      // Verifica o estoque
      const estoqueRes = await client.query(
        'SELECT estoque FROM produtos WHERE id = $1',
        [produto_id]
      );
      const estoqueAtual = parseFloat(estoqueRes.rows[0]?.estoque || 0);

      if (estoqueAtual < quantity) {
        throw new Error(`Estoque insuficiente para o produto ID ${produto_id}.`);
      }

      // Atualiza o estoque
      await client.query(
        'UPDATE produtos SET estoque = estoque - $1 WHERE id = $2',
        [quantity, produto_id]
      );

      // Registra item
      await client.query(
        'INSERT INTO pedido_item (pedido_id, produto_id, quantidade) VALUES ($1, $2, $3)',
        [pedidoId, produto_id, quantity]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Pedido finalizado com sucesso!', pedidoId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao finalizar pedido:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});


// Listar produtos
app.get('/api/produtos', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM produtos ORDER BY id');
    const produtos = rows.map(p => ({
      ...p,
      imagem_url: p.imagem
    }));
    res.json(produtos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar produtos.' });
  }
});

// Detalhar produto
app.get('/api/produtos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT * FROM produtos WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Produto não encontrado.' });
    const p = rows[0];
    res.json({ ...p, imagem_url: p.imagem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar o produto.' });
  }
});

// Cadastrar produto
app.post('/api/produtos', upload.single('imagem'), async (req, res) => {
  const { nome, descricao, preco, categoria, estoque } = req.body;
  if (!req.file) return res.status(400).json({ error: 'Envie uma imagem do produto.' });
  const imagem = req.file.path;
  if (!nome || !descricao || !preco || !categoria || isNaN(estoque)) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios e estoque deve ser número.' });
  }
  try {
    await pool.query(
      `INSERT INTO produtos (nome, descricao, preco, categoria, imagem, estoque)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [nome, descricao, preco, categoria, imagem, estoque]
    );
    res.status(201).json({ message: 'Produto cadastrado com sucesso!', imagem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao cadastrar o produto.' });
  }
});

// Editar produto
app.put('/api/produtos/:id', upload.single('imagem'), async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, preco, categoria, estoque } = req.body;
  const imagem = req.file ? req.file.path : null;
  if (!nome || !descricao || !preco || !categoria || isNaN(estoque)) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }
  try {
    if (imagem) {
      await pool.query(
        `UPDATE produtos SET nome=$1, descricao=$2, preco=$3, categoria=$4, estoque=$5, imagem=$6 WHERE id=$7`,
        [nome, descricao, preco, categoria, estoque, imagem, id]
      );
    } else {
      await pool.query(
        `UPDATE produtos SET nome=$1, descricao=$2, preco=$3, categoria=$4, estoque=$5 WHERE id=$6`,
        [nome, descricao, preco, categoria, estoque, id]
      );
    }
    res.status(200).json({ message: 'Produto atualizado com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar o produto.' });
  }
});

// Excluir produto
app.delete('/api/produtos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM carrinho WHERE produto_id = $1', [id]);
    await pool.query('DELETE FROM produtos WHERE id = $1', [id]);
    res.status(200).json({ message: 'Produto excluído com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir o produto.' });
  }
});

// Registrar usuário
app.post('/api/register', async (req, res) => {
  const { username, password, role } = req.body;
  if (role !== 'cliente') return res.status(403).json({ error: 'Apenas contas de cliente podem ser criadas.' });
  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);
    if (rows.length > 0) return res.status(409).json({ error: 'Nome de usuário já existe.' });
    await pool.query('INSERT INTO usuarios (username, password, role) VALUES ($1,$2,$3)', [username, password, role]);
    res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
  }
});

// Autenticar login
app.post('/api/login', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE username=$1 AND role=$2', [username, role]);
    if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });
    const user = rows[0];
    if (password === user.password) return res.status(200).json({ message: 'Login bem-sucedido!' });
    return res.status(401).json({ error: 'Senha incorreta.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao autenticar.' });
  }
});

app.get('/api/relatorio-vendas', async (req, res) => {
  const { dataInicio, dataFim, horaInicio, horaFim, categoria, status } = req.query;

  let query = `
    SELECT p.id, pr.nome, pr.categoria, pi.quantidade, pr.preco, p.criado_em
    FROM pedidos p
    JOIN pedido_item pi ON p.id = pi.pedido_id
    JOIN produtos pr ON pr.id = pi.produto_id
    WHERE 1=1
  `;

  const params = [];
  let index = 1;

  if (dataInicio) {
    query += ` AND DATE(p.criado_em) >= $${index++}`;
    params.push(dataInicio);
  }

  if (dataFim) {
    query += ` AND DATE(p.criado_em) <= $${index++}`;
    params.push(dataFim);
  }

  if (horaInicio) {
    query += ` AND TO_CHAR(p.criado_em, 'HH24:MI') >= $${index++}`;
    params.push(horaInicio);
  }

  if (horaFim) {
    query += ` AND TO_CHAR(p.criado_em, 'HH24:MI') <= $${index++}`;
    params.push(horaFim);
  }

  if (categoria) {
    query += ` AND pr.categoria = $${index++}`;
    params.push(categoria);
  }

  if (status) {
    query += ` AND p.status = $${index++}`;
    params.push(status);
  }

  try {
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao gerar relatório:', err);
    res.status(500).json({ error: 'Erro ao gerar relatório.' });
  }
});


// Listar pedidos
app.get('/api/pedidos', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        p.id as pedido_id,
        p.status,
        p.criado_em,
        p.cliente_nome,
        p.endereco,
        p.valor_total,
        pi.produto_id,
        pr.nome as nome_produto,
        pi.quantidade
      FROM pedidos p
      JOIN pedido_item pi ON pi.pedido_id = p.id
      JOIN produtos pr ON pr.id = pi.produto_id
      ORDER BY p.criado_em DESC
    `);

    const pedidosMap = {};

    rows.forEach(row => {
      if (!pedidosMap[row.pedido_id]) {
        pedidosMap[row.pedido_id] = {
          id: row.pedido_id,
          status: row.status,
          criado_em: row.criado_em,
          cliente_nome: row.cliente_nome,
          endereco: row.endereco,
          valor_total: row.valor_total,
          itens: []
        };
      }

      pedidosMap[row.pedido_id].itens.push({
        produto_id: row.produto_id,
        nome: row.nome_produto,
        quantidade: row.quantidade
      });
    });

    const pedidos = Object.values(pedidosMap);
    res.json(pedidos);
  } catch (err) {
    console.error('Erro ao buscar pedidos:', err);
    res.status(500).json({ error: 'Erro ao buscar pedidos.' });
  }
});


// Detalhar Pedido
app.put('/api/pedidos/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) return res.status(400).json({ error: 'Status não fornecido.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verifica status atual do pedido
    const pedido = await client.query('SELECT status FROM pedidos WHERE id = $1', [id]);
    if (pedido.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    const statusAtual = pedido.rows[0].status;

    // Se mudando para "Cancelado", devolver ao estoque
    if (status === 'Cancelado' && statusAtual !== 'Cancelado') {
      const itens = await client.query('SELECT produto_id, quantidade FROM pedido_item WHERE pedido_id = $1', [id]);
      for (const item of itens.rows) {
        await client.query(
          'UPDATE produtos SET estoque = estoque + $1 WHERE id = $2',
          [item.quantidade, item.produto_id]
        );
      }
    }

    // Atualiza o status
    await client.query('UPDATE pedidos SET status = $1 WHERE id = $2', [status, id]);

    await client.query('COMMIT');
    res.status(200).json({ message: 'Status atualizado com sucesso!' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar status do pedido:', err);
    res.status(500).json({ error: 'Erro ao atualizar status do pedido.' });
  } finally {
    client.release();
  }
});

// Relatorio de vendas
app.get('/api/relatorio-vendas', async (req, res) => {
  const { dataInicio, dataFim, horaInicio, horaFim, categoria } = req.query;

  try {
    const params = [];
    let query = `
  SELECT 
    p.id, 
    pr.nome, 
    p.cliente_nome, 
    pr.categoria, 
    pi.quantidade, 
    pr.preco, 
    p.criado_em,
    p.status
  FROM pedidos p
  JOIN pedido_item pi ON pi.pedido_id = p.id
  JOIN produtos pr ON pr.id = pi.produto_id
`;
    if (dataInicio) {
      params.push(dataInicio);
      query += ` AND p.criado_em::date >= $${params.length}`;
    }
    if (dataFim) {
      params.push(dataFim);
      query += ` AND p.criado_em::date <= $${params.length}`;
    }
    if (horaInicio) {
      params.push(horaInicio);
      query += ` AND to_char(p.criado_em, 'HH24:MI') >= $${params.length}`;
    }
    if (horaFim) {
      params.push(horaFim);
      query += ` AND to_char(p.criado_em, 'HH24:MI') <= $${params.length}`;
    }
    if (categoria) {
      params.push(categoria);
      query += ` AND pr.categoria = $${params.length}`;
    }

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao gerar relatório:', err);
    res.status(500).json({ error: 'Erro ao gerar relatório.' });
  }
});


// 6) Servir arquivos estáticos (inclui public)
app.use(express.static(path.join(__dirname, 'public')));

// 7) SPA fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 8) Tratamento de 404 para APIs
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Rota de API não encontrada.' });
});

// 9) Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));