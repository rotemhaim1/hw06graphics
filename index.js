import express from 'express';
import path from 'path';
import {fileURLToPath} from 'url';


const __filename = fileURLToPath(import.meta.url);

// 👇️ "/home/john/Desktop/javascript"
const __dirname = path.dirname(__filename);

const app = express()
const port = 8000

// Serve static files from the project root (for index.html, etc.)
app.use(express.static(__dirname));
// Serve static files from /src (for sounds, textures, etc.)
app.use('/src', express.static(path.join(__dirname, 'src')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
  })

app.listen(port, () => {
console.log(`Example app listening on port ${port}`)
})  