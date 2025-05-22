require('dotenv').config();
const express = require('express');
const app     = express();
const multer  = require('multer');
const bodyParser = require('body-parser');
const cors    = require('cors');
const path    = require('path');
<<<<<<< HEAD
=======
const bcrypt  = require('bcrypt');
>>>>>>> origin/main
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

<<<<<<< HEAD
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
    allowed_formats: ['jpg', 'png'],
    transformation: [{ width: 800, crop: 'limit' }]
=======
// 3) Configuração do Multer para gravar em public/uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
>>>>>>> origin/main
  }
});
const upload = multer({ storage });

<<<<<<< HEAD
// 5) Rotas de API (todas antes de servir arquivos estáticos)
=======
// 4) Rotas de API (todas antes de servir arquivos estáticos)
>>>>>>> origin/main

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

<<<<<<< HEAD
// Buscar todos os produtos, incluindo URL da imagem (Cloudinary)
app.get('/api/produtos', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM produtos ORDER BY id');
    const produtos = rows.map(p => ({
      ...p,
      imagem_url: p.imagem  // p.imagem já armazena o URL do Cloudinary
=======
// Buscar todos os produtos, incluindo URL da imagem
app.get('/api/produtos', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM produtos ORDER BY id');
    const host = `${req.protocol}://${req.get('host')}`;
    const produtos = rows.map(p => ({
      ...p,
      imagem_url: `${host}/uploads/${p.imagem}`
>>>>>>> origin/main
    }));
    res.json(produtos);
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
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }
    const p = rows[0];
<<<<<<< HEAD
    res.json({
      ...p,
      imagem_url: p.imagem
=======
    const host = `${req.protocol}://${req.get('host')}`;
    res.json({
      ...p,
      imagem_url: `${host}/uploads/${p.imagem}`
>>>>>>> origin/main
    });
  } catch (err) {
    console.error('Erro ao buscar produto:', err);
    res.status(500).json({ error: 'Erro ao buscar o produto.' });
  }
});

<<<<<<< HEAD
// Cadastrar produto com upload de imagem para Cloudinary
=======
// Cadastrar produto com upload de imagem
>>>>>>> origin/main
app.post('/api/produtos', upload.single('imagem'), async (req, res) => {
  const { nome, descricao, preco, categoria, estoque } = req.body;
  if (!req.file) {
    return res.status(400).json({ error: 'Envie uma imagem do produto.' });
  }
<<<<<<< HEAD
  const imagem = req.file.path;  // URL retornada pelo Cloudinary
=======
  const imagem = req.file.filename;
>>>>>>> origin/main
  if (!nome || !descricao || !preco || !categoria || isNaN(estoque)) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios e estoque deve ser um número.' });
  }
  try {
    await pool.query(
      `INSERT INTO produtos (nome, descricao, preco, categoria, imagem, estoque)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [nome, descricao, preco, categoria, imagem, estoque]
    );
    res.status(201).json({ message: 'Produto cadastrado com sucesso!', imagem });
  } catch (err) {
    console.error('Erro ao cadastrar produto:', err);
    res.status(500).json({ error: 'Erro ao cadastrar o produto.' });
  }
});

// Editar produto
app.put('/api/produtos/:id', upload.single('imagem'), async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, preco, categoria, estoque } = req.body;
<<<<<<< HEAD
  const imagem = req.file ? req.file.path : null;
=======
  const imagem = req.file ? req.file.filename : null;
>>>>>>> origin/main
  if (!nome || !descricao || !preco || !categoria || isNaN(estoque)) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }
  try {
    if (imagem) {
      await pool.query(
        `UPDATE produtos
         SET nome=$1, descricao=$2, preco=$3, categoria=$4, estoque=$5, imagem=$6
         WHERE id=$7`,
        [nome, descricao, preco, categoria, estoque, imagem, id]
      );
    } else {
      await pool.query(
        `UPDATE produtos
         SET nome=$1, descricao=$2, preco=$3, categoria=$4, estoque=$5
         WHERE id=$6`,
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
  if (role !== 'cliente') {
    return res.status(403).json({ error: 'Apenas contas de cliente podem ser criadas.' });
  }
  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);
    if (rows.length > 0) {
      return res.status(409).json({ error: 'Nome de usuário já existe.' });
    }
    await pool.query(
      'INSERT INTO usuarios (username, password, role) VALUES ($1, $2, $3)',
      [username, password, role]
    );
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
    const { rows } = await pool.query(
      'SELECT * FROM usuarios WHERE username = $1 AND role = $2',
      [username, role]
    );
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

<<<<<<< HEAD
// 6) Servir arquivos estáticos (inclui public/uploads)
app.use(express.static(path.join(__dirname, 'public')));

// 7) Fallback para SPA (rotas que não sejam de API)
=======
// 5) Servir arquivos estáticos (inclui public/uploads)
app.use(express.static(path.join(__dirname, 'public')));

// 6) Fallback para SPA (rotas que não sejam de API)
>>>>>>> origin/main
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

<<<<<<< HEAD
// 8) 404 para APIs não encontradas
=======
// 7) 404 para APIs não encontradas
>>>>>>> origin/main
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Rota de API não encontrada.' });
});

<<<<<<< HEAD
// 9) Iniciar o servidor
=======
// 8) Iniciar o servidor
>>>>>>> origin/main
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
