const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações
const KEY_VALIDITY_HOURS = 12; // 12 horas
let keys = []; // Banco de dados das keys

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Função para gerar key aleatória
function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 3) key += '-';
  }
  return key;
}

// Calcular data de expiração
function calculateExpiryDate(hours) {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

// Verificar se key expirou
function isKeyExpired(expiryDate) {
  return new Date() > new Date(expiryDate);
}

// Limpar keys expiradas automaticamente
function cleanupExpiredKeys() {
  const before = keys.length;
  keys = keys.filter(k => !isKeyExpired(k.expiryDate));
  const removed = before - keys.length;
  if (removed > 0) {
    console.log(`🗑️ ${removed} keys expiradas removidas. Total restante: ${keys.length}`);
  }
}

// Executar limpeza a cada 30 minutos
setInterval(cleanupExpiredKeys, 30 * 60 * 1000);

// ============= ROTAS =============

// Página principal - Gera key automaticamente
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gerador de Keys</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .container {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 600px;
      width: 100%;
      text-align: center;
    }
    
    h1 {
      color: #667eea;
      margin-bottom: 10px;
      font-size: 36px;
    }
    
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 16px;
    }
    
    .key-display {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      border-radius: 15px;
      margin: 30px 0;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
    }
    
    .key-label {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .key-code {
      font-family: 'Courier New', monospace;
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 3px;
      margin: 20px 0;
      word-break: break-all;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    
    .timer {
      font-size: 20px;
      margin-top: 20px;
      padding: 15px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      backdrop-filter: blur(10px);
    }
    
    .timer-expired {
      background: rgba(231, 76, 60, 0.5);
      animation: pulse 1.5s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    
    button {
      width: 100%;
      padding: 18px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s;
      margin-top: 10px;
    }
    
    button:hover {
      transform: translateY(-3px);
      box-shadow: 0 15px 30px rgba(102, 126, 234, 0.4);
    }
    
    button:active {
      transform: translateY(0);
    }
    
    .info-box {
      background: #f8f9fa;
      padding: 25px;
      border-radius: 15px;
      margin-top: 30px;
      text-align: left;
    }
    
    .info-box h3 {
      color: #667eea;
      margin-bottom: 15px;
      font-size: 18px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .info-box ul {
      list-style: none;
      padding: 0;
    }
    
    .info-box li {
      padding: 12px 0;
      color: #666;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .info-box li:last-child {
      border-bottom: none;
    }
    
    .success {
      background: #d4edda;
      color: #155724;
      padding: 15px;
      border-radius: 10px;
      margin-bottom: 20px;
      border-left: 4px solid #28a745;
      animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .loading {
      display: inline-block;
      width: 24px;
      height: 24px;
      border: 3px solid rgba(255,255,255,.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .icon {
      font-size: 20px;
    }
    
    @media (max-width: 600px) {
      .container {
        padding: 25px;
      }
      
      h1 {
        font-size: 28px;
      }
      
      .key-code {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔑 Gerador de Keys</h1>
    <p class="subtitle">Sua key será gerada automaticamente!</p>
    
    <div id="successMessage" class="success" style="display: none;"></div>
    
    <div class="key-display">
      <div class="key-label">Sua Key de Acesso</div>
      <div class="key-code" id="keyCode">
        <div class="loading"></div>
      </div>
      <div class="timer" id="timer">Gerando sua key...</div>
    </div>
    
    <button onclick="copyKey()">📋 Copiar Key</button>
    <button onclick="generateNewKey()">🔄 Gerar Nova Key</button>
    
    <div class="info-box">
      <h3><span class="icon">ℹ️</span> Informações</h3>
      <ul>
        <li><span class="icon">⏰</span> Validade: 12 horas</li>
        <li><span class="icon">🔐</span> Use esta key no mod menu</li>
        <li><span class="icon">📱</span> Cada key é única</li>
        <li><span class="icon">♻️</span> Gere uma nova quando expirar</li>
        <li><span class="icon">🗑️</span> Keys expiradas são deletadas automaticamente</li>
      </ul>
    </div>
  </div>

  <script>
    let currentKey = null;
    let timerInterval = null;
    
    // Gerar key automaticamente ao carregar a página
    window.onload = () => {
      generateNewKey();
    };
    
    // Gerar nova key
    async function generateNewKey() {
      try {
        document.getElementById('keyCode').innerHTML = '<div class="loading"></div>';
        document.getElementById('timer').textContent = 'Gerando sua key...';
        
        const res = await fetch('/api/generate-key', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await res.json();
        
        if (data.success) {
          currentKey = data.key;
          document.getElementById('keyCode').textContent = data.key.key;
          startTimer(data.key.expiryDate);
          showSuccess('✅ Key gerada com sucesso! Válida por 12 horas.');
        } else {
          throw new Error('Erro ao gerar key');
        }
      } catch (error) {
        document.getElementById('keyCode').textContent = 'ERRO';
        document.getElementById('timer').textContent = 'Erro ao gerar key. Recarregue a página.';
        console.error('Erro:', error);
      }
    }
    
    // Timer de contagem regressiva
    function startTimer(expiryDate) {
      if (timerInterval) clearInterval(timerInterval);
      
      function updateTimer() {
        const now = new Date();
        const expiry = new Date(expiryDate);
        const diff = expiry - now;
        
        const timerEl = document.getElementById('timer');
        
        if (diff <= 0) {
          timerEl.textContent = '⚠️ Key expirada! Gere uma nova key.';
          timerEl.classList.add('timer-expired');
          clearInterval(timerInterval);
          return;
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        timerEl.textContent = \`⏰ Expira em: \${String(hours).padStart(2, '0')}:\${String(minutes).padStart(2, '0')}:\${String(seconds).padStart(2, '0')}\`;
        timerEl.classList.remove('timer-expired');
      }
      
      updateTimer();
      timerInterval = setInterval(updateTimer, 1000);
    }
    
    // Copiar key para área de transferência
    function copyKey() {
      if (!currentKey) {
        showSuccess('❌ Nenhuma key disponível!');
        return;
      }
      
      navigator.clipboard.writeText(currentKey.key).then(() => {
        showSuccess('✅ Key copiada: ' + currentKey.key);
      }).catch(() => {
        // Fallback para navegadores antigos
        const textarea = document.createElement('textarea');
        textarea.value = currentKey.key;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showSuccess('✅ Key copiada: ' + currentKey.key);
      });
    }
    
    // Mostrar mensagem de sucesso
    function showSuccess(message) {
      const div = document.getElementById('successMessage');
      div.textContent = message;
      div.style.display = 'block';
      setTimeout(() => {
        div.style.display = 'none';
      }, 3000);
    }
  </script>
</body>
</html>
  `);
});

// API: Gerar key automaticamente
app.post('/api/generate-key', (req, res) => {
  const newKey = {
    key: generateKey(),
    createdAt: new Date().toISOString(),
    expiryDate: calculateExpiryDate(KEY_VALIDITY_HOURS),
    hours: KEY_VALIDITY_HOURS,
    activated: false,
    activatedAt: null,
    userId: null
  };
  
  keys.push(newKey);
  
  console.log(`✅ Nova key gerada: ${newKey.key} | Total de keys: ${keys.length}`);
  
  res.json({ 
    success: true, 
    key: newKey,
    message: 'Key gerada com sucesso'
  });
});

// API: Validar key (para o mod usar)
app.post('/api/validate-key', (req, res) => {
  const { key, userId } = req.body;
  
  if (!key) {
    return res.json({ 
      success: false, 
      valid: false,
      message: 'Key não fornecida' 
    });
  }
  
  const keyObj = keys.find(k => k.key === key);
  
  if (!keyObj) {
    return res.json({ 
      success: false, 
      valid: false,
      message: 'Key inválida ou não encontrada' 
    });
  }
  
  // Verificar se expirou
  if (isKeyExpired(keyObj.expiryDate)) {
    return res.json({ 
      success: false, 
      valid: false,
      expired: true,
      message: 'Key expirada',
      expiredAt: keyObj.expiryDate
    });
  }
  
  // Ativar key na primeira validação
  if (!keyObj.activated) {
    keyObj.activated = true;
    keyObj.activatedAt = new Date().toISOString();
    keyObj.userId = userId || 'unknown';
    console.log(`🔓 Key ativada: ${keyObj.key} por ${keyObj.userId}`);
  }
  
  // Calcular tempo restante
  const now = new Date();
  const expiry = new Date(keyObj.expiryDate);
  const diff = expiry - now;
  const hoursRemaining = Math.floor(diff / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  res.json({ 
    success: true, 
    valid: true,
    expired: false,
    message: 'Key válida e ativa',
    activatedAt: keyObj.activatedAt,
    expiryDate: keyObj.expiryDate,
    hoursRemaining: hoursRemaining,
    minutesRemaining: minutesRemaining
  });
});

// API: Verificar status da key (para o mod verificar continuamente)
app.post('/api/check-key', (req, res) => {
  const { key } = req.body;
  
  if (!key) {
    return res.json({ 
      valid: false, 
      message: 'Key não fornecida' 
    });
  }
  
  const keyObj = keys.find(k => k.key === key);
  
  if (!keyObj) {
    return res.json({ 
      valid: false, 
      message: 'Key não encontrada' 
    });
  }
  
  // Verificar se expirou
  if (isKeyExpired(keyObj.expiryDate)) {
    return res.json({ 
      valid: false, 
      expired: true,
      message: 'Key expirada'
    });
  }
  
  // Calcular tempo restante
  const now = new Date();
  const expiry = new Date(keyObj.expiryDate);
  const diff = expiry - now;
  const hoursRemaining = Math.floor(diff / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  res.json({ 
    valid: true,
    expired: false,
    message: 'Key ativa',
    expiryDate: keyObj.expiryDate,
    hoursRemaining: hoursRemaining,
    minutesRemaining: minutesRemaining,
    activated: keyObj.activated,
    userId: keyObj.userId
  });
});

// API: Estatísticas (opcional - ver quantas keys existem)
app.get('/api/stats', (req, res) => {
  const total = keys.length;
  const active = keys.filter(k => !isKeyExpired(k.expiryDate)).length;
  const expired = keys.filter(k => isKeyExpired(k.expiryDate)).length;
  const activated = keys.filter(k => k.activated).length;
  
  res.json({
    success: true,
    stats: {
      total: total,
      active: active,
      expired: expired,
      activated: activated
    }
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Acesse: http://localhost:${PORT}`);
  console.log(`⏰ Keys válidas por: ${KEY_VALIDITY_HOURS} horas`);
  console.log(`🗑️ Limpeza automática ativa (a cada 30 minutos)`);
});