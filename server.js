require('dotenv').config();
const express = require('express');
const app = express();
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Middleware para habilitar o CORS e body parsing
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuração do banco Postgres (Railway)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
pool.on('connect', () => console.log('Conectado ao banco de dados Postgres!'));

// Configuração de armazenamento para imagens com multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

// Rotas de API (devem estar antes de static e fallback)

// Adicionar item ao carrinho
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
    console.error('Erro ao adicionar item ao carrinho:', err);
    res.status(500).json({ error: 'Erro ao adicionar item ao carrinho.' });
  }
});

// Finalizar pedido
app.post('/api/finalizar-pedido', async (req, res) => {
  try {
    await pool.query('CALL FinalizarPedido()');
    res.status(200).json({ message: 'Pedido finalizado com sucesso!' });
  } catch (err) {
    console.error('Erro ao finalizar pedido:', err);
    res.status(500).json({ error: 'Erro ao finalizar pedido.' });
  }
});

// Buscar todos os produtos
app.get('/api/produtos', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM produtos ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar produtos:', err);
    res.status(500).json({ error: 'Erro ao buscar produtos.' });
  }
});

// Buscar produto por ID
app.get('/api/produtos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT * FROM produtos WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao buscar produto:', err);
    res.status(500).json({ error: 'Erro ao buscar o produto.' });
  }
});

// Cadastrar produto com upload de imagem
app.post('/api/produtos', upload.single('imagem'), async (req, res) => {
  const { nome, descricao, preco, categoria, estoque } = req.body;
  const imagem = req.file ? req.file.filename : null;
  if (!nome || !descricao || !preco || !categoria || !imagem || isNaN(estoque)) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios e estoque deve ser um número.' });
  }
  try {
    await pool.query(
      `INSERT INTO produtos (nome, descricao, preco, categoria, imagem, estoque) VALUES ($1, $2, $3, $4, $5, $6)`,
      [nome, descricao, preco, categoria, imagem, estoque]
    );
    res.status(201).json({ message: 'Produto cadastrado com sucesso!' });
  } catch (err) {
    console.error('Erro ao cadastrar produto:', err);
    res.status(500).json({ error: 'Erro ao cadastrar o produto.' });
  }
});

// Editar produto
app.put('/api/produtos/:id', upload.single('imagem'), async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, preco, categoria, estoque } = req.body;
  const imagem = req.file ? req.file.filename : null;
  if (!nome || !descricao || !preco || !categoria || !estoque) {
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
    console.error('Erro ao atualizar produto:', err);
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
    console.error('Erro ao excluir produto:', err);
    res.status(500).json({ error: 'Erro ao excluir o produto.' });
  }
});

// Registro de usuários
app.post('/api/register', async (req, res) => {
  const { username, password, role } = req.body;
  if (role !== 'cliente') return res.status(403).json({ error: 'Apenas contas de cliente podem ser criadas.' });
  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);
    if (rows.length > 0) return res.status(409).json({ error: 'Nome de usuário já existe.' });
    await pool.query('INSERT INTO usuarios (username, password, role) VALUES ($1, $2, $3)', [username, password, role]);
    res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
  } catch (err) {
    console.error('Erro ao registrar usuário:', err);
    res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
  }
});

// Autenticação de login
app.post('/api/login', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE username = $1 AND role = $2', [username, role]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    const user = rows[0];
    if (password === user.password) {
      return res.status(200).json({ message: 'Login bem-sucedido!' });
    } else {
      return res.status(401).json({ error: 'Senha incorreta.' });
    }
  } catch (err) {
    console.error('Erro ao autenticar:', err);
    res.status(500).json({ error: 'Erro ao autenticar.' });
  }
});

// Servir uploads de imagens
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Fallback para SPA (rotas que não sejam da API)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Tratamento de 404 para APIs
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Rota de API não encontrada.' });
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
