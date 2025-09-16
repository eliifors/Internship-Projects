const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// uploads klasörünü oluştur
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer konfigürasyonu
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Dosya adına timestamp ekleyerek benzersiz hale getir
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Dosya filtreleme
const fileFilter = (req, file, cb) => {
    // İzin verilen dosya türleri
    const allowedTypes = /jpeg|jpg|png|gif|pdf|txt|doc|docx|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Desteklenmeyen dosya türü!'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: fileFilter
});

// Yüklenen dosyaları veritabanı yerine JSON dosyasında saklayalım
const filesDataPath = './files.json';

// JSON dosyasını oku veya oluştur
function readFilesData() {
    if (fs.existsSync(filesDataPath)) {
        const data = fs.readFileSync(filesDataPath, 'utf8');
        return JSON.parse(data);
    }
    return [];
}

function writeFilesData(data) {
    fs.writeFileSync(filesDataPath, JSON.stringify(data, null, 2));
}

// Routes

// Ana sayfa
app.get('/', (req, res) => {
    res.json({
        message: 'Dosya Yükleme API\'sine hoş geldiniz!',
        endpoints: {
            'POST /upload': 'Tek dosya yükle',
            'POST /upload/multiple': 'Çoklu dosya yükle',
            'GET /files': 'Tüm dosyaları listele',
            'GET /files/:id': 'Belirli dosyayı getir',
            'DELETE /files/:id': 'Dosyayı sil',
            'GET /download/:filename': 'Dosyayı indir'
        }
    });
});

// Tek dosya yükleme
app.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Dosya seçilmedi!' });
        }

        const fileData = {
            id: Date.now().toString(),
            originalName: req.file.originalname,
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype,
            uploadDate: new Date().toISOString(),
            description: req.body.description || ''
        };

        // Dosya bilgilerini kaydet
        const filesData = readFilesData();
        filesData.push(fileData);
        writeFilesData(filesData);

        res.status(200).json({
            message: 'Dosya başarıyla yüklendi!',
            file: fileData
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Çoklu dosya yükleme
app.post('/upload/multiple', upload.array('files', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Hiç dosya seçilmedi!' });
        }

        const filesData = readFilesData();
        const uploadedFiles = [];

        req.files.forEach(file => {
            const fileData = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                originalName: file.originalname,
                filename: file.filename,
                path: file.path,
                size: file.size,
                mimetype: file.mimetype,
                uploadDate: new Date().toISOString(),
                description: req.body.description || ''
            };

            filesData.push(fileData);
            uploadedFiles.push(fileData);
        });

        writeFilesData(filesData);

        res.status(200).json({
            message: `${uploadedFiles.length} dosya başarıyla yüklendi!`,
            files: uploadedFiles
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Tüm dosyaları listele
app.get('/files', (req, res) => {
    try {
        const filesData = readFilesData();
        
        // Sayfalama
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const paginatedFiles = filesData.slice(startIndex, endIndex);

        res.json({
            files: paginatedFiles,
            totalFiles: filesData.length,
            currentPage: page,
            totalPages: Math.ceil(filesData.length / limit)
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Belirli dosyayı getir
app.get('/files/:id', (req, res) => {
    try {
        const filesData = readFilesData();
        const file = filesData.find(f => f.id === req.params.id);

        if (!file) {
            return res.status(404).json({ error: 'Dosya bulunamadı!' });
        }

        res.json({ file });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Dosya indirme
app.get('/download/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, 'uploads', filename);

        // Dosya var mı kontrol et
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Dosya bulunamadı!' });
        }

        // Dosyayı indir
        res.download(filePath, (err) => {
            if (err) {
                res.status(500).json({ error: 'Dosya indirilemedi!' });
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Dosyayı sil
app.delete('/files/:id', (req, res) => {
    try {
        const filesData = readFilesData();
        const fileIndex = filesData.findIndex(f => f.id === req.params.id);

        if (fileIndex === -1) {
            return res.status(404).json({ error: 'Dosya bulunamadı!' });
        }

        const file = filesData[fileIndex];

        // Fiziksel dosyayı sil
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        // Kayıttan sil
        filesData.splice(fileIndex, 1);
        writeFilesData(filesData);

        res.json({ message: 'Dosya başarıyla silindi!' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Dosya arama
app.get('/search', (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ error: 'Arama sorgusu gerekli!' });
        }

        const filesData = readFilesData();
        const searchResults = filesData.filter(file => 
            file.originalName.toLowerCase().includes(query.toLowerCase()) ||
            file.description.toLowerCase().includes(query.toLowerCase()) ||
            file.mimetype.toLowerCase().includes(query.toLowerCase())
        );

        res.json({
            query: query,
            results: searchResults,
            count: searchResults.length
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Dosya türüne göre filtreleme
app.get('/files/type/:type', (req, res) => {
    try {
        const fileType = req.params.type.toLowerCase();
        const filesData = readFilesData();

        const filteredFiles = filesData.filter(file => {
            switch (fileType) {
                case 'image':
                    return file.mimetype.startsWith('image/');
                case 'document':
                    return file.mimetype.includes('pdf') || 
                           file.mimetype.includes('doc') || 
                           file.mimetype.includes('text');
                case 'archive':
                    return file.mimetype.includes('zip') || 
                           file.mimetype.includes('rar');
                default:
                    return file.mimetype.includes(fileType);
            }
        });

        res.json({
            type: fileType,
            files: filteredFiles,
            count: filteredFiles.length
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// İstatistikler
app.get('/stats', (req, res) => {
    try {
        const filesData = readFilesData();
        
        const totalFiles = filesData.length;
        const totalSize = filesData.reduce((sum, file) => sum + file.size, 0);
        
        const fileTypes = {};
        filesData.forEach(file => {
            const type = file.mimetype.split('/')[0];
            fileTypes[type] = (fileTypes[type] || 0) + 1;
        });

        res.json({
            totalFiles,
            totalSize: (totalSize / (1024 * 1024)).toFixed(2) + ' MB',
            fileTypes,
            recentUploads: filesData.slice(-5).reverse()
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Dosya boyutu çok büyük! Maksimum 10MB.' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Çok fazla dosya! Maksimum 10 dosya.' });
        }
    }
    
    res.status(500).json({ error: error.message });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint bulunamadı!' });
});

// Server başlat
app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor...`);
    console.log(`API dokümantasyonu için: http://localhost:${PORT}`);
    console.log(`Uploads klasörü: ${path.resolve(uploadsDir)}`);
});