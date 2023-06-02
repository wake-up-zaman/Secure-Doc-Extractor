const express = require('express');
const { PDFDocument } = require('pdf-lib');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(cors());
const encryptionKey = process.env.ENCRYPTION_KEY;



app.post('/retrieve', upload.single('file'), async (req, res) => {
  try {
    const pdfFile = req.file;
    const pdfBytes = fs.readFileSync(pdfFile.path);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const extractedContent = [];

    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
      const page = pdfDoc.getPage(i);
      const content = await page.getTextContent();
      const pageContent = content.items.map(item => item.text).join(' ');
      extractedContent.push(pageContent);
    }

    const encryptedContent = encryptContent(extractedContent, encryptionKey);
    const downloadLink = generateDownloadLink(pdfFile.filename);
    res.json({ encryptedContent, downloadLink });

    const savePath = path.join('public', 'saved_pdfs', pdfFile.filename);
    fs.renameSync(pdfFile.path, savePath);

  } catch (error) {
    console.error('Error retrieving and extracting PDF:', error);
    res.status(500).json({ error: 'Failed to retrieve and extract PDF' });
  }
});

function encryptContent(content, encryptionKey) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
    let encryptedContent = cipher.update(content, 'utf8', 'hex');
    encryptedContent += cipher.final('hex');
  
    return {
      encryptedContent,
      iv: iv.toString('hex'),
    };
  }
  

function generateDownloadLink(filename) {
  const publicFilePath = `/saved_pdfs/${filename}`;
  const downloadLink = `${process.env.FRONTEND_URL}${publicFilePath}`;
  return downloadLink;
}


app.listen(8000, () => {
  console.log('Server is running on port 8000');
});



