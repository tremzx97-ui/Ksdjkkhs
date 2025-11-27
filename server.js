const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const KEYS_FILE = path.join(__dirname, 'keys.json');
const KEY_EXPIRATION_HOURS = 12;

// Gera keys aleatórias
function generateRandomKey(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < length; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
    return key;
}

// Inicializa keys.json com 100 keys caso não exista
if (!fs.existsSync(KEYS_FILE)) {
    const keys = [];
    for (let i = 0; i < 100; i++) {
        keys.push({
            key: generateRandomKey(),
            used: false,
            hwid: null,
            expires: null
        });
    }
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}

// Ler e salvar keys
function readKeys() {
    return JSON.parse(fs.readFileSync(KEYS_FILE));
}
function saveKeys(keys) {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}

// Rota para gerar/distribuir key
app.post('/getkey', (req, res) => {
    const hwid = req.body.hwid;
    if (!hwid) return res.status(400).json({ error: 'HWID required' });

    const keys = readKeys();

    // Limpa keys expiradas
    const now = new Date();
    keys.forEach(k => {
        if (k.expires && new Date(k.expires) < now) {
            k.used = false;
            k.hwid = null;
            k.expires = null;
        }
    });

    // Verifica se já tem key para esse HWID
    const existing = keys.find(k => k.hwid === hwid && k.used);
    if (existing) return res.json({ key: existing.key, expires: existing.expires });

    // Pega primeira key não usada
    const freeKey = keys.find(k => !k.used);
    if (!freeKey) return res.status(400).json({ error: 'No keys available' });

    freeKey.used = true;
    freeKey.hwid = hwid;
    freeKey.expires = new Date(Date.now() + KEY_EXPIRATION_HOURS * 60 * 60 * 1000).toISOString();

    saveKeys(keys);
    res.json({ key: freeKey.key, expires: freeKey.expires });
});

// Verifica key
app.post('/verify', (req, res) => {
    const { key, hwid } = req.body;
    if (!key || !hwid) return res.status(400).json({ error: 'Key and HWID required' });

    const keys = readKeys();
    const found = keys.find(k => k.key === key);
    if (!found) return res.status(404).json({ valid: false, reason: 'Key not found' });

    if (!found.used) return res.status(403).json({ valid: false, reason: 'Key not used yet' });
    if (found.hwid !== hwid) return res.status(403).json({ valid: false, reason: 'HWID mismatch' });
    if (new Date(found.expires) < new Date()) return res.status(403).json({ valid: false, reason: 'Key expired' });

    res.json({ valid: true, expires: found.expires });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));}

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
