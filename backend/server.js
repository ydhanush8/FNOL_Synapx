const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { extractTextFromFile, parseFNOLFields, validateAndRoute } = require('./processor');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /pdf|text|plain|txt/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype || extname) {
            return cb(null, true);
        }
        cb(new Error("Error: File upload only supports PDF or TXT files!"));
    }
});

app.post('/api/process-fnol', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const text = await extractTextFromFile(req.file.buffer, req.file.mimetype);
        const fields = parseFNOLFields(text);
        const result = validateAndRoute(fields);

        res.json({
            success: true,
            fileName: req.file.originalname,
            ...result
        });
    } catch (error) {
        console.error('Error processing FNOL:', error);
        res.status(500).json({ error: 'Internal server error during processing' });
    }
});

app.listen(port, () => {
    console.log(`Backend server running on port ${port}`);
});
