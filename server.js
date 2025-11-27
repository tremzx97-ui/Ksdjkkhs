// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Caminho do JSON
const keysFile = path.join(__dirname, 'keys.json');

// Função para carregar keys existentes
function loadKeys() {
    if (!fs.existsSync(keysFile)) return [];
    try {
        const data = fs.readFileSync(keysFile, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

// Função para salvar keys no JSON
function saveKeys(keys) {
    fs.writeFileSync(keysFile, JSON.stringify(keys, null, 4));
}

// Função para gerar key aleatória do tipo XXXX-XXXX-XXXX
function generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < 12; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
        if (i === 3 || i === 7) key += '-';
    }
    return key;
}

// Limpar keys expiradas (mais de 12h)
function cleanExpiredKeys() {
    const keys = loadKeys();
    const now = Date.now();
    const validKeys = keys.filter(k => now - k.createdAt < 12 * 60 * 60 * 1000);
    saveKeys(validKeys);
}

// Rota para gerar key
app.get('/generate', (req, res) => {
    cleanExpiredKeys();
    const keys = loadKeys();
    const newKey = {
        key: generateKey(),
        createdAt: Date.now()
    };
    keys.push(newKey);
    saveKeys(keys);
    res.json({ success: true, key: newKey.key, expiresInHours: 12 });
});

// Rota para verificar key
app.get('/verify/:key', (req, res) => {
    cleanExpiredKeys();
    const keys = loadKeys();
    const key = keys.find(k => k.key === req.params.key);
    if (key) {
        res.json({ valid: true, expiresInHours: Math.ceil((12 * 60 * 60 * 1000 - (Date.now() - key.createdAt)) / (1000*60*60)) });
    } else {
        res.json({ valid: false });
    }
});

// Servir HTML
app.use(express.static(__dirname));

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));}

// ROTA → Gerar Key
app.post("/generate", (req, res) => {
    cleanExpiredKeys();
    
    const newKey = generateKey();
    const keys = loadKeys();

    keys.push({
        key: newKey,
        created: Date.now(),
        expires: Date.now() + (12 * 60 * 60 * 1000) // 12h
    });

    saveKeys(keys);
    res.json({ success: true, key: newKey });
});

// ROTA → Verificar key
app.get("/verify", (req, res) => {
    cleanExpiredKeys();

    const { key } = req.query;
    if (!key) return res.json({ valid: false });

    const keys = loadKeys();
    const found = keys.find(k => k.key === key);

    res.json({ valid: !!found });
});

// Iniciar servidor
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));    saveKeys(keys);
    res.json(newKey);
});

// 🔍 Rota de validação (opcional p/ usar no mod)
app.get("/verify/:key", (req, res) => {
    let keys = loadKeys();
    const entry = keys.find(k => k.key === req.params.key);

    if (!entry) return res.status(404).json({ valid: false, msg: "Key inválida!" });
    if (Date.now() > entry.expiresAt) return res.json({ valid: false, msg: "Key expirada!" });

    res.json({ valid: true, msg: "Key válida!" });
});

app.listen(PORT, () =>
    console.log(`Servidor rodando na porta: ${PORT}`)
);
