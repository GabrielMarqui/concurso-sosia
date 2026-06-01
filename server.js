require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const VOTE_PASSWORD = process.env.VOTE_PASSWORD || 'sasageyo';

// Configura limites maiores para suportar imagens em Base64
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Serve arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Estado inicial em memória
let db = {
  entries: [],
  config: {
    friendEmail: ''
  }
};

// Carrega dados existentes do arquivo se houver
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      db = JSON.parse(content);
      
      // Sanitização básica se o arquivo for antigo
      if (!db.entries) db.entries = [];
      if (!db.config) db.config = { friendEmail: '' };
      if (!db.tournament) {
        db.tournament = {
          status: 'registration',
          currentMatchIndex: 0,
          matchStartTime: null,
          matches: []
        };
      }
      
      console.log(`[Banco de Dados] ${db.entries.length} sósias carregados de data.json.`);
    } else {
      console.log('[Banco de Dados] Nenhum arquivo data.json encontrado. Iniciando banco vazio.');
      saveData();
    }
  } catch (err) {
    console.error('[Erro] Falha ao carregar dados:', err);
  }
}

// Salva dados no arquivo JSON
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
    console.log('[Banco de Dados] Dados salvos com sucesso.');
  } catch (err) {
    console.error('[Erro] Falha ao salvar dados:', err);
  }
}

// --- FUNÇÕES DE LÓGICA DO TORNEIO (CHAVEAMENTO) ---

function generateTournament() {
  const shuffled = [...db.entries].sort(() => Math.random() - 0.5);
  const matches = [];
  
  // Oitavas (0-7)
  for (let i = 0; i < 8; i++) {
    matches.push({
      id: i,
      round: 'oitavas',
      label: `Oitavas de Final - Chave ${i + 1}`,
      player1Id: shuffled[2 * i].id,
      player2Id: shuffled[2 * i + 1].id,
      player1Votes: 0,
      player2Votes: 0,
      winnerId: null,
      votedIps: []
    });
  }
  
  // Quartas (8-11)
  for (let i = 0; i < 4; i++) {
    matches.push({
      id: 8 + i,
      round: 'quartas',
      label: `Quartas de Final - Chave ${i + 1}`,
      player1Id: null,
      player2Id: null,
      player1Votes: 0,
      player2Votes: 0,
      winnerId: null,
      votedIps: []
    });
  }
  
  // Semi (12-13)
  for (let i = 0; i < 2; i++) {
    matches.push({
      id: 12 + i,
      round: 'semi',
      label: `Semifinal - Chave ${i + 1}`,
      player1Id: null,
      player2Id: null,
      player1Votes: 0,
      player2Votes: 0,
      winnerId: null,
      votedIps: []
    });
  }
  
  // Final (14)
  matches.push({
    id: 14,
    round: 'final',
    label: 'Grande Final',
    player1Id: null,
    player2Id: null,
    player1Votes: 0,
    player2Votes: 0,
      winnerId: null,
      votedIps: []
    });
  
  db.tournament = {
    status: 'active',
    currentMatchIndex: 0,
    matchStartTime: new Date().toISOString(),
    matches: matches
  };
  saveData();
  console.log('[Torneio] Novo torneio gerado com 16 concorrentes!');
}

function generateMockTournament() {
  db.entries = [];
  
  const mockSosiaNames = [
    "Léo Grávida de Taubaté",
    "Léo Carey Mulligan da Deep Web",
    "Léo Shrek Estiloso",
    "Léo Monalisa Psicodélica",
    "Léo Caneta Azul",
    "Léo Arnold Schwarzenegger Gordinho",
    "Léo de Peruca Loira",
    "Léo ET de Varginha",
    "Léo Cabeça de Batata",
    "Léo Clone de Chernobyl",
    "Léo Mini-Me",
    "Léo Professor de Autoescola",
    "Léo Sommelier de Pastel",
    "Léo Cosplay de Coxinha",
    "Léo Vampiro do Crepúsculo",
    "Léo sósia do sósia"
  ];
  
  const colors = [
    "%23ff007f", // neon pink
    "%239d00ff", // neon purple
    "%2300f0ff", // neon cyan
    "%2339ff14", // neon green
    "%23ffea00", // neon yellow
    "%23ffa751", // orange
    "%23ff5500", // red-orange
    "%23e6e9f0"  // light grey
  ];

  for (let i = 0; i < 16; i++) {
    const name = mockSosiaNames[i];
    const color = colors[i % colors.length].replace('%23', '#');
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="${color}"/><circle cx="150" cy="110" r="60" fill="#0d0614"/><rect x="75" y="190" width="150" height="80" rx="40" fill="#0d0614"/><text x="150" y="120" font-family="sans-serif" font-weight="bold" font-size="60" fill="white" text-anchor="middle">👽</text><text x="150" y="275" font-family="sans-serif" font-size="20" fill="white" text-anchor="middle" font-weight="bold">#${i+1}</text></svg>`;
    const svgBase64 = Buffer.from(svgString).toString('base64');
    const svgContent = `data:image/svg+xml;base64,${svgBase64}`;
    
    const mockEntry = {
      id: `mock_${Date.now().toString(36)}_${i.toString(36)}`,
      submitterName: "Gerador Automático 🤖",
      lookalikeName: name,
      image: svgContent,
      votes: 0,
      createdAt: new Date().toISOString()
    };
    
    db.entries.push(mockEntry);
  }
  
  generateTournament();
}

function checkAndAdvanceMatch() {
  if (!db.tournament || db.tournament.status !== 'active') return;

  const currentMatchIndex = db.tournament.currentMatchIndex;
  const match = db.tournament.matches[currentMatchIndex];
  if (!match) return;

  const matchStartTime = new Date(db.tournament.matchStartTime);
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  
  if (now - matchStartTime >= oneDay) {
    advanceMatchInternal();
  }
}

function advanceMatchInternal() {
  const currentMatchIndex = db.tournament.currentMatchIndex;
  const match = db.tournament.matches[currentMatchIndex];
  if (!match) return;

  let winnerId;
  let tieMessage = "";
  if (match.player1Votes > match.player2Votes) {
    winnerId = match.player1Id;
  } else if (match.player2Votes > match.player1Votes) {
    winnerId = match.player2Id;
  } else {
    const roll = Math.random() < 0.5;
    winnerId = roll ? match.player1Id : match.player2Id;
    const winnerName = db.entries.find(e => e.id === winnerId)?.lookalikeName || "Sem Nome";
    tieMessage = `🚨 Empate bizarro de ${match.player1Votes} a ${match.player2Votes}! O juiz supremo Léo Showza jogou uma moeda virtual e coroou ${winnerName} como o vencedor! 🪙`;
    console.log(tieMessage);
  }

  match.winnerId = winnerId;

  const player1Name = db.entries.find(e => e.id === match.player1Id)?.lookalikeName || "Sem Nome";
  const player2Name = db.entries.find(e => e.id === match.player2Id)?.lookalikeName || "Sem Nome";
  const winnerEntry = db.entries.find(e => e.id === winnerId);
  const winnerName = winnerEntry ? winnerEntry.lookalikeName : "Sem Nome";

  if (currentMatchIndex < 14) {
    let nextMatchIndex;
    let slotName;

    if (currentMatchIndex >= 0 && currentMatchIndex <= 7) {
      nextMatchIndex = 8 + Math.floor(currentMatchIndex / 2);
      slotName = (currentMatchIndex % 2 === 0) ? 'player1Id' : 'player2Id';
    } else if (currentMatchIndex >= 8 && currentMatchIndex <= 11) {
      nextMatchIndex = 12 + Math.floor((currentMatchIndex - 8) / 2);
      slotName = (currentMatchIndex % 2 === 0) ? 'player1Id' : 'player2Id';
    } else if (currentMatchIndex === 12 || currentMatchIndex === 13) {
      nextMatchIndex = 14;
      slotName = (currentMatchIndex === 12) ? 'player1Id' : 'player2Id';
    }

    db.tournament.matches[nextMatchIndex][slotName] = winnerId;
    db.tournament.currentMatchIndex = currentMatchIndex + 1;
    db.tournament.matchStartTime = new Date().toISOString();

    console.log(`[Torneio] Confronto ${currentMatchIndex} finalizado. Vencedor: ${winnerName}. Avançando para confronto ${currentMatchIndex + 1}.`);
    
    const nextMatch = db.tournament.matches[currentMatchIndex + 1];
    const nextPlayer1Name = db.entries.find(e => e.id === nextMatch.player1Id)?.lookalikeName || "Aguardando...";
    const nextPlayer2Name = db.entries.find(e => e.id === nextMatch.player2Id)?.lookalikeName || "Aguardando...";
    
    const subject = `🏆 Torneio de Sósias: ${winnerName} venceu a chave!`;
    const html = `
      <div style="font-family: Arial, sans-serif; background: #0d0614; color: #ffffff; padding: 25px; border-radius: 15px; border: 3px solid #ff007f; max-width: 600px; margin: 0 auto; box-shadow: 0 10px 20px rgba(0,0,0,0.5);">
        <h1 style="color: #ff007f; text-align: center; font-size: 26px; border-bottom: 2px dashed #ff007f; padding-bottom: 15px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; margin-top: 0;">⚡ DUELO FINALIZADO! 👽</h1>
        <p style="font-size: 1.15em; line-height: 1.5; color: #fff;">Fala, <strong>Léo Showza</strong>!</p>
        <p style="font-size: 1.05em; line-height: 1.5; color: #ccc;">A rodada da Copa do Mundo de Sósias fechou as urnas e temos um classificado!</p>
        
        <div style="background: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid rgba(255,255,255,0.08); border-left: 5px solid #39ff14;">
          <div style="font-size: 14px; color: #888; text-transform: uppercase; margin-bottom: 8px; font-weight: bold;">Placar da Batalha:</div>
          <span style="font-size: 16px; color: #fff;"><strong>Duelo:</strong> ${player1Name} vs ${player2Name}</span><br>
          <span style="font-size: 16px; color: #fff;"><strong>Votos:</strong> ${match.player1Votes} vs ${match.player2Votes}</span><br>
          <span style="font-size: 18px; color: #39ff14; font-weight: bold; display: inline-block; margin-top: 10px;">🏆 Vencedor: ${winnerName}</span>
          ${tieMessage ? `<div style="color:#ffea00; margin-top:8px; font-style:italic; font-size: 14px;">${tieMessage}</div>` : ''}
        </div>

        <div style="text-align: center; margin: 25px 0;">
          <p style="color: #888; font-size: 13px; text-transform: uppercase; font-weight: bold; margin-bottom: 8px;">Retrato da Aberração Classificada:</p>
          <img src="cid:clone_winner_image" style="width: 160px; height: 160px; border-radius: 50%; border: 4px solid #39ff14; object-fit: cover; box-shadow: 0 0 15px rgba(57,255,20,0.4);" alt="Retrato do Sósia">
        </div>

        <p style="font-size: 1.05em; line-height: 1.5; color: #ccc;">A zueira continua! A próxima batalha diária já foi liberada e aguarda seus votos:</p>
        <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-left: 5px solid #00f0ff; border-radius: 8px; margin: 20px 0; border: 1px solid rgba(255,255,255,0.08); border-left: 5px solid #00f0ff; font-weight: bold; font-size: 1.1em; text-align: center;">
          ${nextPlayer1Name} <span style="color: #ffea00;">vs</span> ${nextPlayer2Name}
        </div>
        
        <div style="text-align: center; margin-top: 30px; margin-bottom: 15px;">
          <a href="http://localhost:${PORT}" style="background: linear-gradient(135deg, #ff007f, #9d00ff); color: #ffffff; padding: 16px 32px; text-decoration: none; font-weight: bold; border-radius: 50px; box-shadow: 0 0 15px rgba(255, 0, 127, 0.6); display: inline-block; font-size: 1.1em;">VOTAR NA PRÓXIMA CHAVE 🗳️</a>
        </div>
        <p style="color: #666; font-size: 0.8em; margin-top: 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">Este e-mail é gerado automaticamente pelo hospício de sósias. A humilhação não tira folga.</p>
      </div>
    `;
    sendNotificationEmail(subject, html, winnerEntry ? winnerEntry.image : null);

  } else {
    db.tournament.status = 'finished';
    console.log(`[Torneio] Torneio finalizado! O grande vencedor do lixo supremo é: ${winnerName}.`);

    const subject = `👑 O SUPREMO SÓSIA DO LÉO SHOWZA FOI COROADO!`;
    const html = `
      <div style="font-family: Arial, sans-serif; background: #0d0614; color: #ffffff; padding: 25px; border-radius: 15px; border: 4px solid #ffea00; max-width: 600px; margin: 0 auto; box-shadow: 0 10px 30px rgba(255, 234, 0, 0.3);">
        <h1 style="color: #ffea00; text-align: center; font-size: 28px; border-bottom: 3px double #ffea00; padding-bottom: 15px; text-transform: uppercase; font-weight: bold; letter-spacing: 1.5px; margin-top: 0; text-shadow: 0 0 10px rgba(255, 234, 0, 0.5);">👑 REINO DO LIXO COROADO! 👑</h1>
        <p style="font-size: 1.15em; line-height: 1.5; color: #fff;">Salve, <strong>Léo Showza</strong>!</p>
        <p style="font-size: 1.05em; line-height: 1.5; color: #ccc;">A grande final da Copa do Mundo de Sósias chegou ao fim. As urnas declararam o monstro supremo!</p>
        
        <div style="background: rgba(255, 255, 255, 0.05); padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; border: 1px solid rgba(255,234,0,0.3); background: radial-gradient(circle, rgba(255,234,0,0.05) 0%, rgba(0,0,0,0) 100%);">
          <p style="font-size: 14px; color: #aaa; text-transform: uppercase; font-weight: bold; margin-bottom: 10px; letter-spacing: 1px;">O Clone Mais Tosco do Universo:</p>
          <span style="font-size: 28px; font-weight: 900; color: #ffea00; text-shadow: 0 0 15px rgba(255, 234, 0, 0.6); display: block; margin-bottom: 15px;">${winnerName}</span>
          
          <div style="margin: 20px 0;">
            <img src="cid:clone_winner_image" style="width: 180px; height: 180px; border-radius: 50%; border: 5px solid #ffea00; object-fit: cover; box-shadow: 0 0 20px rgba(255,234,0,0.5);" alt="Foto do Campeão">
          </div>

          <p style="font-size: 14px; color: #aaa; margin-top: 10px;">Venceu a final histórica contra ${player1Name === winnerName ? player2Name : player1Name} por ${match.player1Votes} a ${match.player2Votes} votos!</p>
        </div>
        
        <p style="text-align: center; font-size: 1.1em; color: #39ff14; font-weight: bold; text-shadow: 0 0 5px rgba(57,255,20,0.2);">A humilhação eterna está oficialmente sacramentada!</p>
        
        <div style="text-align: center; margin-top: 30px; margin-bottom: 15px;">
          <a href="http://localhost:${PORT}" style="background: linear-gradient(135deg, #ffea00, #ffa751); color: #000000; padding: 16px 32px; text-decoration: none; font-weight: bold; border-radius: 50px; box-shadow: 0 0 15px rgba(255, 234, 0, 0.5); display: inline-block; font-size: 1.1em;">VER O PLACAR SUPREMO</a>
        </div>
      </div>
    `;
    sendNotificationEmail(subject, html, winnerEntry ? winnerEntry.image : null);
  }

  saveData();
}

// Inicializa os dados
loadData();

// --- CONFIGURAÇÃO DO CLIENTE DE E-MAIL (NODEMAILER) ---
let transporter;

async function initEmail() {
  const hasRealSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
  
  if (hasRealSmtp) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log(`[E-mail] Configurado SMTP real: ${process.env.SMTP_HOST}`);
  } else {
    try {
      // Fallback para conta Ethereal de testes
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`==================================================`);
      console.log(`🛸 [E-mail] SMTP real não detectado.`);
      console.log(`⚡ Usando conta Ethereal de testes automaticamente!`);
      console.log(`👤 Usuário de teste: ${testAccount.user}`);
      console.log(`🔑 Senha de teste: ${testAccount.pass}`);
      console.log(`📧 E-mails de zueira aparecerão nos logs com links de visualização!`);
      console.log(`==================================================`);
    } catch (err) {
      console.error('[E-mail] Erro ao criar conta de teste do Ethereal:', err);
    }
  }
}

// Inicializa e-mail em segundo plano
initEmail();

// Função auxiliar para disparar os e-mails
function sendNotificationEmail(subject, htmlContent, attachBase64Image = null) {
  if (!transporter) {
    console.log('[E-mail] Transporter de e-mail ainda não está pronto.');
    return;
  }

  // Pega o e-mail cadastrado dinamicamente no painel de configurações, ou cai no .env, ou no valor padrão
  const friendEmail = db.config?.friendEmail || process.env.FRIEND_EMAIL || 'leoshowza@example.com';
  const smtpUser = process.env.SMTP_USER || 'noreply@leoshowzasosia.com';
  
  const mailOptions = {
    from: `"Campeonato de Sósias do Léo Showza" <${smtpUser}>`,
    to: friendEmail,
    subject: subject,
    html: htmlContent
  };

  // Se tiver imagem base64, anexa ela
  if (attachBase64Image && attachBase64Image.startsWith('data:image/')) {
    const matches = attachBase64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      const ext = mimeType.split('/')[1] || 'jpg';
      const buffer = Buffer.from(matches[2], 'base64');
      mailOptions.attachments = [{
        filename: `clone-aberrante.${ext === 'svg+xml' ? 'svg' : ext}`,
        content: buffer,
        contentType: mimeType,
        cid: 'clone_winner_image' // CID para exibição embutida no HTML
      }];
    }
  }

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('[E-mail] Falha crítica ao enviar e-mail:', error);
    } else {
      console.log(`[E-mail] Notificação disparada com sucesso para ${friendEmail}!`);
      const testUrl = nodemailer.getTestMessageUrl(info);
      if (testUrl) {
        console.log(`🔗 [E-mail Teste] Verifique a visualização do e-mail em: ${testUrl}`);
      }
    }
  });
}

// --- ROTAS DA API ---

// 1. Obter todos os sósias cadastrados
app.get('/api/entries', (req, res) => {
  checkAndAdvanceMatch();
  res.json({
    success: true,
    entries: db.entries,
    tournament: db.tournament || { status: 'registration', currentMatchIndex: 0, matches: [] }
  });
});

// 2. Cadastrar um novo sósia
app.post('/api/entries', (req, res) => {
  const { submitterName, lookalikeName, image } = req.body;

  if (db.tournament && db.tournament.status !== 'registration') {
    return res.status(400).json({
      success: false,
      message: 'Inscrições encerradas! O campeonato de chaveamento já está rolando! 🏁'
    });
  }

  if (db.entries.length >= 16) {
    return res.status(400).json({
      success: false,
      message: 'O campeonato já atingiu o limite de 16 sósias! 🛑'
    });
  }

  if (!submitterName || !lookalikeName || !image) {
    return res.status(400).json({
      success: false,
      message: 'Preenche todos os campos e manda a porra da imagem, seu preguiçoso!'
    });
  }

  // Verifica se a imagem é base64 válida
  if (!image.startsWith('data:image/')) {
    return res.status(400).json({
      success: false,
      message: 'Isso não é uma imagem válida, seu burro!'
    });
  }

  const newEntry = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    submitterName: submitterName.trim(),
    lookalikeName: lookalikeName.trim(),
    image: image,
    votes: 0,
    createdAt: new Date().toISOString()
  };

  db.entries.push(newEntry);
  saveData();

  let started = false;
  if (db.entries.length === 16) {
    generateTournament();
    started = true;
  }

  res.status(201).json({
    success: true,
    message: started
      ? 'Sósia cadastrado! E ATENÇÃO: Atingimos 16 participantes, o campeonato começou! 🏁'
      : 'Sósia cadastrado com sucesso! Prepare-se para a humilhação pública! 🎉',
    entry: newEntry
  });

  // Dispara e-mail de notificação (sem travar a requisição)
  const subject = `🚨 URGENTE: Aberração Cadastrada no Campeonato do Léo Showza!`;
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0d0614; color: #ffffff; padding: 25px; border-radius: 15px; border: 3px solid #ff007f;">
      <h1 style="color: #ff007f; text-align: center; font-size: 24px; border-bottom: 2px dashed #ff007f; padding-bottom: 10px;">🌀 MULTIVERSO EM PÂNICO! 👽</h1>
      <p style="font-size: 1.1em; line-height: 1.5;">Fala, <strong>Léo Showza</strong>!</p>
      <p style="line-height: 1.5;">Alguém teve a coragem (ou falta de vergonha) de denunciar mais um sósia seu no nosso campeonato.</p>
      
      <div style="background: rgba(255, 255, 255, 0.08); padding: 15px; border-left: 5px solid #00f0ff; border-radius: 6px; margin: 20px 0;">
        <span style="font-size: 14px; color: #888;">INFORMAÇÕES DO CRIME:</span><br>
        <span style="font-size: 16px; font-weight: bold; color: #00f0ff;">👨‍⚖️ O Acusador (Dedo-Duro):</span> ${newEntry.submitterName}<br>
        <span style="font-size: 16px; font-weight: bold; color: #39ff14;">🤡 O Clone (Sósia):</span> ${newEntry.lookalikeName}<br>
        <span style="font-size: 14px; color: #bbb;">⏱️ Horário da mutação:</span> ${new Date(newEntry.createdAt).toLocaleString('pt-BR')}
      </div>
      
      <p style="font-size: 1.05em;">A imagem tosca do clone foi anexada a este e-mail para que você possa testemunhar esse desastre.</p>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="http://localhost:${PORT}" style="background: linear-gradient(135deg, #ff007f, #9d00ff); color: #ffffff; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 50px; box-shadow: 0 0 15px rgba(255, 0, 127, 0.6); display: inline-block;">VER O HOSPÍCIO DE SÓSIAS</a>
      </div>
      
      <p style="color: #777; font-size: 0.8em; margin-top: 40px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">Este e-mail é um alerta oficial. A zueira é eterna e não tem fim.</p>
    </div>
  `;
  sendNotificationEmail(subject, html, newEntry.image);
});

// 2.5. Deletar um sósia específico (protegido por senha)
app.post('/api/entries/:id/delete', (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'A senha é obrigatória para excluir a evidência!'
    });
  }

  if (password !== VOTE_PASSWORD) {
    return res.status(403).json({
      success: false,
      message: 'Senha incorreta, seu penetra! Você não tem autorização para apagar evidências!'
    });
  }

  const index = db.entries.findIndex(e => e.id === id);
  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Essa aberração não foi encontrada ou já foi limpa!'
    });
  }

  const deletedEntry = db.entries.splice(index, 1)[0];
  saveData();

  res.json({
    success: true,
    message: `Evidência de ${deletedEntry.lookalikeName} removida com sucesso! 🗑️`
  });

  // Dispara e-mail de notificação de exclusão
  const subject = `🗑️ EVIDÊNCIA APAGADA: Sósia removido do Campeonato!`;
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0d0614; color: #ffffff; padding: 25px; border-radius: 15px; border: 3px solid #ff007f;">
      <h1 style="color: #ff007f; text-align: center; font-size: 24px; border-bottom: 2px dashed #ff007f; padding-bottom: 10px;">👽 CENSURA NO HOSPÍCIO! 🛸</h1>
      <p style="font-size: 1.1em; line-height: 1.5;">Alô, <strong>Léo Showza</strong>!</p>
      <p style="line-height: 1.5;">A evidência de sósia de <strong>${deletedEntry.lookalikeName}</strong> (cadastrado por ${deletedEntry.submitterName}) foi excluída do campeonato por alguém autorizado com a senha.</p>
      <p style="font-size: 1.05em;">Menos um monstro solto na nossa galeria. O banco de dados foi atualizado.</p>
    </div>
  `;
  sendNotificationEmail(subject, html);
});

// 3. Votar em um sósia específico
app.post('/api/vote', (req, res) => {
  const { id, password } = req.body;

  if (!id || !password) {
    return res.status(400).json({
      success: false,
      message: 'Cadê a senha e o ID da aberração, ô cabeção?'
    });
  }

  if (password !== VOTE_PASSWORD) {
    return res.status(403).json({
      success: false,
      message: 'Senha errada, otário! Sem a senha certa tu não vota em ninguém! 🧐'
    });
  }

  if (!db.tournament || db.tournament.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'O campeonato não está ativo no momento! Não há duelos ocorrendo.'
    });
  }

  const currentMatchIndex = db.tournament.currentMatchIndex;
  const match = db.tournament.matches[currentMatchIndex];

  if (!match) {
    return res.status(500).json({
      success: false,
      message: 'Erro interno: confronto ativo não encontrado!'
    });
  }

  // Verifica se o ID votado faz parte do duelo ativo
  if (match.player1Id !== id && match.player2Id !== id) {
    return res.status(400).json({
      success: false,
      message: 'Esta aberração não está participando do duelo ativo de hoje!'
    });
  }

  // Validação de IP para voto único por duelo
  const userIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (!match.votedIps) match.votedIps = [];
  if (match.votedIps.includes(userIp)) {
    return res.status(400).json({
      success: false,
      message: 'Você já votou hoje, seu espertinho! Quer fraudar a urna eletrônica do Showza? 🕵️‍♂️'
    });
  }

  // Computa o voto
  if (id === match.player1Id) {
    match.player1Votes = (match.player1Votes || 0) + 1;
  } else {
    match.player2Votes = (match.player2Votes || 0) + 1;
  }

  // Incrementa os votos globais para o ranking do topo do lixo
  const entry = db.entries.find(e => e.id === id);
  if (entry) {
    entry.votes = (entry.votes || 0) + 1;
  }

  match.votedIps.push(userIp);
  saveData();

  res.json({
    success: true,
    message: `Voto computado para esse monstro de ${entry ? entry.lookalikeName : 'Sósia'}! 🎉`,
    player1Votes: match.player1Votes,
    player2Votes: match.player2Votes
  });

  // Dispara e-mail de notificação de voto
  const subject = `🗳️ NOVO VOTO Computado no Duelo do Campeonato!`;
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0d0614; color: #ffffff; padding: 25px; border-radius: 15px; border: 3px solid #39ff14;">
      <h1 style="color: #39ff14; text-align: center; font-size: 24px; border-bottom: 2px dashed #39ff14; padding-bottom: 10px;">🔥 DUELO PEGANDO FOGO! 🌀</h1>
      <p style="font-size: 1.1em;">Opa, <strong>Léo Showza</strong>!</p>
      <p>Mais um voto foi registrado na batalha de hoje.</p>
      
      <div style="background: rgba(255, 255, 255, 0.08); padding: 15px; border-left: 5px solid #ffea00; border-radius: 6px; margin: 20px 0;">
        <strong>Duelo Ativo:</strong> ${db.entries.find(e => e.id === match.player1Id)?.lookalikeName || 'Sem Nome'} vs ${db.entries.find(e => e.id === match.player2Id)?.lookalikeName || 'Sem Nome'}<br>
        <strong>Votos no Candidato Escolhido:</strong> ${id === match.player1Id ? match.player1Votes : match.player2Votes} votos
      </div>
    </div>
  `;
  sendNotificationEmail(subject, html, entry ? entry.image : null);
});

// 4. Obter as configurações dinâmicas
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    friendEmail: db.config?.friendEmail || process.env.FRIEND_EMAIL || 'leoshowza@example.com'
  });
});

// 5. Salvar as configurações dinâmicas (protegido por senha)
app.post('/api/config', (req, res) => {
  const { friendEmail, password } = req.body;

  if (!friendEmail || !password) {
    return res.status(400).json({
      success: false,
      message: 'O e-mail do alvo e a senha são obrigatórios para salvar!'
    });
  }

  if (password !== VOTE_PASSWORD) {
    return res.status(403).json({
      success: false,
      message: 'Senha incorreta! Não autorizado a mudar as configurações do hospício!'
    });
  }

  if (!db.config) {
    db.config = { friendEmail: '' };
  }

  db.config.friendEmail = friendEmail.trim();
  saveData();

  res.json({
    success: true,
    message: `Configurações atualizadas! Agora o alvo é o e-mail: ${db.config.friendEmail} ⚙️`
  });
});

// 6. Resetar o campeonato (apenas Admin/com senha)
app.post('/api/admin/reset', (req, res) => {
  const { password } = req.body;

  if (password !== VOTE_PASSWORD) {
    return res.status(403).json({
      success: false,
      message: 'Senha errada! Não vai apagar a zueira da galera, seu engraçadinho!'
    });
  }

  db.entries = [];
  db.tournament = {
    status: 'registration',
    currentMatchIndex: 0,
    matchStartTime: null,
    matches: []
  };
  saveData();

  res.json({
    success: true,
    message: 'O campeonato foi resetado! Tudo limpo para a próxima rodada de humilhação!'
  });

  // Dispara e-mail avisando do reset
  const subject = `🚨 ALERTA: Evidências Apagadas do Campeonato de Sósias!`;
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0d0614; color: #ffffff; padding: 25px; border-radius: 15px; border: 3px solid #ffea00;">
      <h1 style="color: #ffea00; text-align: center; font-size: 24px; border-bottom: 2px dashed #ffea00; padding-bottom: 10px;">🚨 CAMPO LIMPO! 🚨</h1>
      <p style="font-size: 1.1em; line-height: 1.5;">Alô, <strong>Léo Showza</strong>!</p>
      <p style="line-height: 1.5;">Parece que alguém resolveu ter piedade de você e **apagou todas as evidências** do campeonato.</p>
      <p style="font-size: 1.1em; color: #ffea00; font-weight: bold;">Todos os sósias e votos foram resetados!</p>
      <p>Fique de olhos abertos porque a qualquer momento a galera pode começar a cadastrar novas fotos bizonhas.</p>
    </div>
  `;
  sendNotificationEmail(subject, html);
});

// 6.5. Avançar confronto manualmente (Admin/com senha)
app.post('/api/tournament/advance', (req, res) => {
  const { password } = req.body;
  if (password !== VOTE_PASSWORD) {
    return res.status(403).json({ success: false, message: 'Senha incorreta!' });
  }
  if (!db.tournament || db.tournament.status !== 'active') {
    return res.status(400).json({ success: false, message: 'Nenhum campeonato ativo para avançar!' });
  }
  
  advanceMatchInternal();
  res.json({
    success: true,
    message: 'O duelo foi encerrado manualmente e o campeonato avançou! ⚡',
    tournament: db.tournament
  });
});

// 6.6. Gerar campeonato mock/teste de 16 concorrentes (Admin/com senha)
app.post('/api/admin/mock-tournament', (req, res) => {
  const { password } = req.body;
  if (password !== VOTE_PASSWORD) {
    return res.status(403).json({ success: false, message: 'Senha incorreta!' });
  }
  
  generateMockTournament();
  res.json({
    success: true,
    message: 'Campeonato de teste gerado com sucesso com 16 sósias bizarros! 🧬',
    tournament: db.tournament,
    entries: db.entries
  });
});

// 7. Verificar se a senha do campeonato está correta
app.post('/api/verify', (req, res) => {
  const { password } = req.body;
  if (password === VOTE_PASSWORD) {
    return res.json({ success: true, message: 'Acesso interdimensional liberado! 👽' });
  } else {
    return res.status(403).json({ success: false, message: 'Senha incorreta, seu penetra!' });
  }
});

// Rota curinga para servir o index.html da SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 SERVIDOR PSICODÉLICO RODANDO!`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`🔑 Senha para votação: ${VOTE_PASSWORD}`);
  console.log(`==================================================`);
});
