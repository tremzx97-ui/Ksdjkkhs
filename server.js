const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const KEYS_FILE = path.join(__dirname, "keys.json");

// Middleware para servir arquivos estáticos
app.use(express.static(__dirname));
app.use(express.json());

// Função para carregar/salvar keys
function loadKeys() {
    if (!fs.existsSync(KEYS_FILE)) fs.writeFileSync(KEYS_FILE, "[]");
    return JSON.parse(fs.readFileSync(KEYS_FILE));
}
function saveKeys(keys) {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}

// Limpa keys expiradas (12 horas = 43200000 ms)
function cleanExpiredKeys() {
    let keys = loadKeys();
    const now = Date.now();
    keys = keys.filter(k => now < k.expires);
    saveKeys(keys);
}

// Gera key aleatória
function generateKey() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let key = "";
    for (let i = 0; i < 20; i++) key += chars[Math.floor(Math.random() * chars.length)];
    return key;
}

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
