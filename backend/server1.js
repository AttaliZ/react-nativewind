require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3008;

// ---------- Create Upload Directories ----------
const createUploadDirs = () => {
  const dirs = ['./uploads', './uploads/images', './uploads/documents'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
};
createUploadDirs();

// ---------- Middlewares ----------
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// ---------- File Upload Configuration ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir = './uploads/';
    
    if (file.mimetype.startsWith('image/')) {
      uploadDir += 'images/';
    } else {
      uploadDir += 'documents/';
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);
    
    cb(null, `${name}_${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

// ---------- MySQL Pool ----------
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+07:00',
});

// Quick startup test
(async function testMySQL() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Connected to MySQL:', process.env.DB_NAME);
    conn.release();
  } catch (err) {
    console.error('⚠️  MySQL connection failed on boot:', err.message);
  }
})();

// ---------- Helper to delete file from filesystem ----------
const deleteFileFromDisk = (filename) => {
  const imagePath = path.join('./uploads/images/', filename);
  const documentPath = path.join('./uploads/documents/', filename);
  
  [imagePath, documentPath].forEach(filePath => {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Deleted file: ${filePath}`);
      } catch (error) {
        console.error(`Failed to delete file: ${filePath}`, error);
      }
    }
  });
};

// ---------- Health / Meta ----------
app.get('/api', (req, res) => {
  res.status(200).json({ ok: true, service: 'inventory-api', version: '2.0.0' });
});

app.get('/api/ping', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({
      ok: true,
      service: 'inventory-api',
      time: new Date().toISOString(),
      db: 'up',
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      service: 'inventory-api',
      time: new Date().toISOString(),
      db: 'down',
      error: e.message,
    });
  }
});

// ---------- File Upload Endpoints (NO AUTH) ----------

// Upload single file
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads/${req.file.mimetype.startsWith('image/') ? 'images' : 'documents'}/${req.file.filename}`
    };

    console.log(`📁 File uploaded: ${fileInfo.originalName} -> ${fileInfo.filename}`);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: fileInfo
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Delete uploaded file
app.delete('/api/upload/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename required' });
    }

    deleteFileFromDisk(filename);
    
    res.json({ 
      success: true, 
      message: 'File deleted successfully',
      filename: filename
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// ---------- Products CRUD (NO AUTH) ----------

// GET /api/products (fetch all products)
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM products ORDER BY lastUpdate DESC'
    );
    return res.json(rows);
  } catch (e) {
    console.error('Products Error:', e);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id (fetch single product)
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(rows[0]);
  } catch (e) {
    console.error('Product Fetch Error:', e);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products
app.post('/api/products', async (req, res) => {
  try {
    const {
      name, description, price, stock, category, location, 
      image, status, brand, sizes, productCode, orderName, storeAvailability,
      file_type, file_name, file_size
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const parsedPrice = price ? parseFloat(price) : 0;
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: 'Invalid price value' });
    }

    const [rs] = await pool.query(
      `INSERT INTO products
      (name, description, price, stock, category, location, image, status, brand, sizes, 
       productCode, orderName, storeAvailability, file_type, file_name, file_size, lastUpdate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        name, description || null, parsedPrice, stock || 0, category || null, location || null,
        image || null, status || 'Active', brand || null, sizes || null, productCode || null,
        orderName || null, storeAvailability || null, file_type || null, file_name || null, file_size || null
      ]
    );
    
    console.log(`📦 Product created: ${name} (ID: ${rs.insertId})`);
    return res.status(201).json({ success: true, productId: rs.insertId });
  } catch (e) {
    console.error('Create Product Error:', e);
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id
app.put('/api/products/:id', async (req, res) => {
  console.log('Received body:', req.body);
  try {
    const { id } = req.params;
    const { 
      name, description, price, stock, status, category, location, 
      image, brand, sizes, productCode, orderName, storeAvailability,
      file_type, file_name, file_size
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const [found] = await pool.query(
      'SELECT id, image, file_name FROM products WHERE id = ?',
      [id]
    );
    if (found.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const parsedPrice = price ? parseFloat(price) : 0;
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: 'Invalid price value' });
    }

    const oldProduct = found[0];
    if (oldProduct.image && oldProduct.image !== image && oldProduct.file_name) {
      deleteFileFromDisk(oldProduct.file_name);
    }

    await pool.query(
      `UPDATE products SET 
       name = ?, description = ?, price = ?, stock = ?, status = ?, category = ?, location = ?, 
       image = ?, brand = ?, sizes = ?, productCode = ?, orderName = ?, storeAvailability = ?,
       file_type = ?, file_name = ?, file_size = ?, lastUpdate = NOW() 
       WHERE id = ?`,
      [
        name, description || null, parsedPrice, stock || 0, status || 'Active', 
        category || null, location || null, image || null, brand || null, sizes || null, 
        productCode || null, orderName || null, storeAvailability || null,
        file_type || null, file_name || null, file_size || null, id
      ]
    );
    
    console.log(`📦 Product updated: ${name} (ID: ${id})`);
    return res.json({ success: true, productId: id });
  } catch (e) {
    console.error('Update Product Error:', {
      message: e.message,
      stack: e.stack,
      params: req.params,
      body: req.body,
      time: new Date().toISOString(),
    });
    return res.status(500).json({ error: 'Failed to update product', details: e.message });
  }
});

// DELETE /api/products/:id
app.delete('/api/products/:id', async (req, res) => {
  console.log('Delete request for id:', req.params.id);
  
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    const [found] = await pool.query(
      'SELECT id, file_name FROM products WHERE id = ?',
      [parseInt(id)]
    );
    
    if (found.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = found[0];
    
    console.log('Attempting to delete product with id:', id);
    const [deleteResult] = await pool.query('DELETE FROM products WHERE id = ?', [parseInt(id)]);
    
    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found or already deleted' });
    }
    
    if (product.file_name) {
      try {
        deleteFileFromDisk(product.file_name);
      } catch (fileError) {
        console.error('File deletion error (non-critical):', fileError);
      }
    }
    
    console.log(`📦 Product deleted successfully: ID ${id}`);
    return res.json({ 
      success: true, 
      productId: parseInt(id),
      message: 'Product deleted successfully'
    });
    
  } catch (e) {
    console.error('Delete Product Error:', {
      message: e.message,
      stack: e.stack,
      params: req.params,
      time: new Date().toISOString(),
    });
    
    if (e.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        error: 'Cannot delete product: referenced by other records' 
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to delete product', 
      details: process.env.NODE_ENV === 'development' ? e.message : 'Internal server error'
    });
  }
});

// ---------- Error Handling ----------

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error('Multer Error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large (max 10MB)' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected file field' });
    }
    return res.status(400).json({ error: 'File upload error' });
  }
  
  if (error.message.includes('File type')) {
    return res.status(400).json({ error: error.message });
  }
  
  console.error('Unhandled Error:', error);
  return res.status(500).json({ error: 'Internal Server Error' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  return res.status(500).json({ error: 'Internal Server Error' });
});

// ---------- Start Server ----------
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Inventory API running on port ${PORT}`);
  console.log(`📁 File uploads available at /uploads`);
  console.log(`⚠️  Authentication DISABLED - Use with caution!`);
});

// Graceful shutdown
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
async function shutdown() {
  try {
    console.log('Shutting down gracefully...');
    await pool.end();
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 5000).unref();
  } catch (e) {
    console.error('Shutdown error:', e);
    process.exit(1);
  }
}