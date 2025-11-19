import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Supabase Client
// 使用 ANON_KEY（带正确的认证头权限）
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Multer Configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800') },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/html') {
      cb(null, true);
    } else {
      cb(new Error('Only HTML files are allowed'));
    }
  }
});

// Middleware: Password Authentication
const authenticate = (req, res, next) => {
  const password = req.headers['x-upload-password'];
  if (password !== process.env.UPLOAD_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Routes

// 1. Management Dashboard (需要密码)
app.get('/manage', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manage.html'));
});

// 2. Upload File API
app.post('/api/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const reportId = uuidv4();
    const fileName = `${reportId}.html`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(process.env.STORAGE_BUCKET)
      .upload(fileName, req.file.buffer, {
        contentType: 'text/html',
        upsert: false
      });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Save metadata to database
    const { error: dbError } = await supabase
      .from('reports')
      .insert([
        {
          id: reportId,
          original_filename: req.file.originalname,
          file_path: fileName,
          status: 'active',
          created_at: new Date().toISOString(),
          public_url: `${process.env.APP_URL}/reports/${reportId}`
        }
      ]);

    if (dbError) {
      return res.status(500).json({ error: dbError.message });
    }

    res.json({
      success: true,
      reportId,
      publicUrl: `${process.env.APP_URL}/reports/${reportId}`,
      filename: req.file.originalname
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get All Reports (管理用)
app.get('/api/reports', authenticate, async (req, res) => {
  try {
    console.log('Fetching reports from Supabase...');
    console.log('Supabase URL:', process.env.SUPABASE_URL);
    
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('Reports fetched successfully:', data?.length || 0);
    res.json(data);
  } catch (error) {
    console.error('Catch error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// 4. View Public Report
app.get('/reports/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;

    // Check if report exists and is active
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Get signed URL for the file
    const { data: signedData, error: signedError } = await supabase.storage
      .from(process.env.STORAGE_BUCKET)
      .createSignedUrl(data.file_path, 60 * 60 * 24 * 7); // 7 days

    if (signedError) {
      return res.status(500).json({ error: signedError.message });
    }

    // Fetch and return HTML
    const response = await fetch(signedData.signedUrl);
    const html = await response.text();
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Delete Report
app.delete('/api/reports/:reportId', authenticate, async (req, res) => {
  try {
    const { reportId } = req.params;

    // Get report data
    const { data, error: getError } = await supabase
      .from('reports')
      .select('file_path')
      .eq('id', reportId)
      .single();

    if (getError || !data) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(process.env.STORAGE_BUCKET)
      .remove([data.file_path]);

    if (storageError) {
      return res.status(500).json({ error: storageError.message });
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);

    if (dbError) {
      return res.status(500).json({ error: dbError.message });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Disable Report
app.patch('/api/reports/:reportId/disable', authenticate, async (req, res) => {
  try {
    const { reportId } = req.params;

    const { error } = await supabase
      .from('reports')
      .update({ status: 'disabled' })
      .eq('id', reportId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Replace Report
app.post('/api/reports/:reportId/replace', authenticate, upload.single('file'), async (req, res) => {
  try {
    const { reportId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Get old file path
    const { data: oldData, error: getError } = await supabase
      .from('reports')
      .select('file_path')
      .eq('id', reportId)
      .single();

    if (getError || !oldData) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Delete old file
    await supabase.storage
      .from(process.env.STORAGE_BUCKET)
      .remove([oldData.file_path]);

    // Upload new file with same ID
    const fileName = `${reportId}.html`;
    const { error: uploadError } = await supabase.storage
      .from(process.env.STORAGE_BUCKET)
      .upload(fileName, req.file.buffer, {
        contentType: 'text/html',
        upsert: true
      });

    if (uploadError) {
      return res.status(500).json({ error: uploadError.message });
    }

    // Update database
    const { error: dbError } = await supabase
      .from('reports')
      .update({
        original_filename: req.file.originalname,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId);

    if (dbError) {
      return res.status(500).json({ error: dbError.message });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 9. Network Diagnostics
app.get('/api/diagnostics', async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    console.log('Testing connection to:', supabaseUrl);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY
      }
    });
    
    res.json({
      status: 'ok',
      supabaseUrl: supabaseUrl,
      responseStatus: response.status,
      message: 'Successfully connected to Supabase'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      supabaseUrl: process.env.SUPABASE_URL
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
