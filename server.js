const express = require("express");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("./"));

const KEY_FILE = "./keys.json";
const KEY_DURATION = 12 * 60 * 60 * 1000; // 12 horas em ms

function loadKeys() {
    if (!fs.existsSync(KEY_FILE)) {
        fs.writeFileSync(KEY_FILE, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(KEY_FILE));
}

function saveKeys(keys) {
    fs.writeFileSync(KEY_FILE, JSON.stringify(keys, null, 2));
}

function generateKey() {
    return "KEY-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

// 🟢 Rota para gerar key
app.get("/generate", (req, res) => {
    let keys = loadKeys();
    const newKey = {
        key: generateKey(),
        createdAt: Date.now(),
        expiresAt: Date.now() + KEY_DURATION
    };
    keys.push(newKey);
    saveKeys(keys);
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
