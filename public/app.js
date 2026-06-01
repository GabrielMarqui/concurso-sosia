// --- ESTADO GLOBAL DO FRONTEND ---
let currentTab = 'gallery';
let base64Image = '';
let allEntries = [];
let votingTargetId = '';
let isUnlocked = false;

// Emojis para o fundo psicodélico e confetes
const FUNNY_EMOJIS = ['👽', '🌀', '🍌', '🤡', '🍄', '🦄', '💀', '🍕', '🐱‍🚀', '🌈', '🍭', '🔥'];

// Função para checar a senha salva localmente e atualizar estado de bloqueio
async function checkStoredPassword() {
  const savedPass = localStorage.getItem('sosia_password') || '';
  if (savedPass.trim() === '') {
    updateNavigationUI(false);
    return;
  }

  try {
    const response = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: savedPass })
    });
    const result = await response.json();
    if (result.success) {
      isUnlocked = true;
      updateNavigationUI(true);
    } else {
      isUnlocked = false;
      localStorage.removeItem('sosia_password');
      document.getElementById('savedPassword').value = '';
      updateNavigationUI(false);
    }
  } catch (error) {
    console.error("Erro de conexão na verificação:", error);
    updateNavigationUI(false);
  }
}

// Atualiza o menu com cadeados ou não
function updateNavigationUI(unlocked) {
  const lockedIcon = unlocked ? '' : '🔒 ';
  document.getElementById('btnHome').innerHTML = `${lockedIcon}🌀 Hospício`;
  document.getElementById('btnRegister').innerHTML = `${lockedIcon}📸 Enviar foto do Showza`;
  document.getElementById('btnConfig').innerHTML = `${lockedIcon}⚙️ Configs`;
}

// Ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
  // Gera os orbes flutuantes com a imagem transparente
  generateFloatingOrbs();

  // Carrega senha salva localmente se existir
  const savedPass = localStorage.getItem('sosia_password');
  if (savedPass) {
    document.getElementById('savedPassword').value = savedPass;
  }

  // Verifica se a senha salva já é válida para desbloquear as telas
  await checkStoredPassword();

  // Carrega dados iniciais da galeria
  refreshData();
});

// --- SISTEMA DE NAVEGAÇÃO SPA ---
async function switchTab(tabId) {
  // Lista de abas protegidas
  const restrictedTabs = ['home', 'register', 'config'];

  if (restrictedTabs.includes(tabId) && !isUnlocked) {
    // Pede a senha usando o Modal Customizado
    const password = await showCustomPrompt(
      "Esta área é restrita para os organizadores do campeonato. Digite a senha secreta para liberar o acesso total:",
      "Acesso Restrito 🔒",
      "Senha do campeonato...",
      "🔑"
    );

    if (password === null) return; // cancelou

    if (!password) {
      await showCustomAlert("Você precisa digitar uma senha para entrar!", "Senha Ausente", "⚠️");
      return;
    }

    // Valida com o servidor
    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const result = await response.json();

      if (result.success) {
        isUnlocked = true;
        localStorage.setItem('sosia_password', password);
        document.getElementById('savedPassword').value = password;
        updateNavigationUI(true);
        await showCustomAlert("Acesso total liberado! Bem-vindo ao hospício cósmico. 👽", "Acesso Permitido", "🎉");
      } else {
        await showCustomAlert("Senha incorreta, seu penetra! 🕵️‍♂️ Mantenha as mãos longe do que não lhe pertence.", "Senha Incorreta", "🚫");
        return;
      }
    } catch (error) {
      console.error(error);
      await showCustomAlert("Falha ao se comunicar com a central de segurança interdimensional.", "Erro de Conexão", "🔌");
      return;
    }
  }

  // Oculta todas as abas
  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => tab.classList.remove('active'));

  // Desativa todos os botões da nav
  const buttons = document.querySelectorAll('.nav-btn');
  buttons.forEach(btn => btn.classList.remove('active'));

  // Exibe a aba correta
  const targetTab = document.getElementById(`tab-${tabId}`);
  if (targetTab) {
    targetTab.classList.add('active');
    currentTab = tabId;
  }

  // Ativa o botão correto da nav
  const btnMap = {
    'home': 'btnHome',
    'register': 'btnRegister',
    'gallery': 'btnGallery',
    'results': 'btnResults',
    'config': 'btnConfig'
  };
  const activeBtn = document.getElementById(btnMap[tabId]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }

  // Ações adicionais por aba
  if (tabId === 'gallery' || tabId === 'results') {
    refreshData();
  } else if (tabId === 'config') {
    loadConfig();
  }
}

// --- GERAÇÃO DE ELEMENTOS VISUAIS (PSICODÉLICOS) ---
function generateFloatingOrbs() {
  const container = document.getElementById('orbsContainer');
  if (!container) return;

  // Cria 15 orbes flutuantes com a foto transparente do Léo
  for (let i = 0; i < 15; i++) {
    const orb = document.createElement('img');
    orb.src = 'leo.png'; // Usa direto o PNG com fundo transparente
    orb.className = 'floating-item floating-leo';
    orb.alt = 'Léo';
    
    // Posições e tempos aleatórios
    orb.style.left = `${Math.random() * 100}vw`;
    orb.style.animationDelay = `${Math.random() * 15}s`;
    orb.style.animationDuration = `${12 + Math.random() * 12}s`;
    
    // Tamanho randômico mantendo o padrão visual
    const size = 35 + Math.random() * 45; // 35px a 80px
    orb.style.width = `${size}px`;
    orb.style.height = `${size}px`;
    
    container.appendChild(orb);
  }
}

// Explosão de confetes baseada em emojis
function triggerEmojiConfetti() {
  const container = document.getElementById('canvas-confetti-container');
  if (!container) return;

  const count = 40;
  for (let i = 0; i < count; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-emoji';
    confetti.innerText = FUNNY_EMOJIS[Math.floor(Math.random() * FUNNY_EMOJIS.length)];
    
    // Posição de origem horizontal aleatória
    confetti.style.left = `${Math.random() * 100}vw`;
    // Altura inicial logo acima da tela
    confetti.style.top = `-40px`;
    
    // Propriedades aleatórias da queda
    confetti.style.animationDelay = `${Math.random() * 1.5}s`;
    confetti.style.animationDuration = `${1.5 + Math.random() * 2}s`;
    confetti.style.fontSize = `${1 + Math.random() * 2}rem`;
    
    // Remove o elemento após terminar a animação
    confetti.addEventListener('animationend', () => {
      confetti.remove();
    });

    container.appendChild(confetti);
  }
}

// --- DIÁLOGOS PERSONALIZADOS DA ZUEIRA (ALERT, CONFIRM, PROMPT) ---
function showCustomAlert(message, title = "Aviso Interdimensional", icon = "👽") {
  return new Promise((resolve) => {
    const modal = document.getElementById('customDialogModal');
    const titleEl = document.getElementById('dialogTitle');
    const msgEl = document.getElementById('dialogMessage');
    const iconEl = document.getElementById('dialogIcon');
    const promptContainer = document.getElementById('dialogPromptContainer');
    const actionsContainer = document.getElementById('dialogActions');

    titleEl.innerText = title;
    msgEl.innerText = message;
    iconEl.innerText = icon;
    promptContainer.classList.add('hidden');

    actionsContainer.innerHTML = '';
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.innerText = 'Beleza, me tira daqui! 🛸';
    btn.onclick = () => {
      modal.classList.add('hidden');
      resolve();
    };
    actionsContainer.appendChild(btn);

    modal.classList.remove('hidden');
  });
}

function showCustomConfirm(message, title = "⚠️ Cuidado, Animal!", icon = "🚨") {
  return new Promise((resolve) => {
    const modal = document.getElementById('customDialogModal');
    const titleEl = document.getElementById('dialogTitle');
    const msgEl = document.getElementById('dialogMessage');
    const iconEl = document.getElementById('dialogIcon');
    const promptContainer = document.getElementById('dialogPromptContainer');
    const actionsContainer = document.getElementById('dialogActions');

    titleEl.innerText = title;
    msgEl.innerText = message;
    iconEl.innerText = icon;
    promptContainer.classList.add('hidden');

    actionsContainer.innerHTML = '';

    const btnCancel = document.createElement('button');
    btnCancel.className = 'btn btn-secondary';
    btnCancel.innerText = 'Arreguei ❌';
    btnCancel.onclick = () => {
      modal.classList.add('hidden');
      resolve(false);
    };

    const btnConfirm = document.createElement('button');
    btnConfirm.className = 'btn btn-primary';
    btnConfirm.innerText = 'Manda bala! 🔥';
    btnConfirm.style.backgroundColor = 'var(--color-neon-pink)';
    btnConfirm.onclick = () => {
      modal.classList.add('hidden');
      resolve(true);
    };

    actionsContainer.appendChild(btnCancel);
    actionsContainer.appendChild(btnConfirm);

    modal.classList.remove('hidden');
  });
}

function showCustomPrompt(message, title = "🔑 Passaporte Por favor", placeholder = "Digite aqui...", icon = "🕵️‍♂️", defaultValue = "") {
  return new Promise((resolve) => {
    const modal = document.getElementById('customDialogModal');
    const titleEl = document.getElementById('dialogTitle');
    const msgEl = document.getElementById('dialogMessage');
    const iconEl = document.getElementById('dialogIcon');
    const promptContainer = document.getElementById('dialogPromptContainer');
    const promptInput = document.getElementById('dialogPromptInput');
    const actionsContainer = document.getElementById('dialogActions');

    titleEl.innerText = title;
    msgEl.innerText = message;
    iconEl.innerText = icon;
    promptContainer.classList.remove('hidden');
    promptInput.value = defaultValue;
    promptInput.placeholder = placeholder;
    promptInput.focus();

    actionsContainer.innerHTML = '';

    const btnCancel = document.createElement('button');
    btnCancel.className = 'btn btn-secondary';
    btnCancel.innerText = 'Esqueci ❌';
    btnCancel.onclick = () => {
      modal.classList.add('hidden');
      resolve(null);
    };

    const btnConfirm = document.createElement('button');
    btnConfirm.className = 'btn btn-primary';
    btnConfirm.innerText = 'Enviar 🚀';
    btnConfirm.onclick = () => {
      modal.classList.add('hidden');
      resolve(promptInput.value);
    };

    actionsContainer.appendChild(btnCancel);
    actionsContainer.appendChild(btnConfirm);

    modal.classList.remove('hidden');
    
    // Permitir enviar com Enter
    promptInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        modal.classList.add('hidden');
        resolve(promptInput.value);
      }
    };
  });
}

// --- LÓGICA DE UPLOAD E PRÉVIA DE IMAGEM ---
function previewImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Mostra feedback de carregando no botão
  const fileLabelText = document.getElementById('fileLabelText');
  const originalText = fileLabelText.innerText;
  fileLabelText.innerText = "Analisando essa feiura... 🧬";

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.src = e.target.result;
    img.onload = function() {
      // Comprime a imagem usando Canvas para evitar uploads gigantescos
      base64Image = compressImage(img, 800, 800);
      
      // Exibe a prévia
      const preview = document.getElementById('imagePreview');
      preview.src = base64Image;
      document.getElementById('imagePreviewContainer').classList.remove('hidden');
      fileLabelText.innerText = "Prova do Crime Carregada! ⚡";
    };
  };
  reader.readAsDataURL(file);
}

// Comprime imagem mantendo o aspect ratio
function compressImage(img, maxWidth, maxHeight) {
  const canvas = document.createElement('canvas');
  let width = img.width;
  let height = img.height;

  // Calcula novas dimensões mantendo o aspect ratio
  if (width > height) {
    if (width > maxWidth) {
      height *= maxWidth / width;
      width = maxWidth;
    }
  } else {
    if (height > maxHeight) {
      width *= maxHeight / height;
      height = maxHeight;
    }
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);

  // Retorna base64 jpeg de média/alta qualidade
  return canvas.toDataURL('image/jpeg', 0.8);
}

function removePreview() {
  base64Image = '';
  document.getElementById('imageUpload').value = '';
  document.getElementById('imagePreview').src = '';
  document.getElementById('imagePreviewContainer').classList.add('hidden');
  document.getElementById('fileLabelText').innerText = "Escolha a Foto Bizarra";
}

// --- CADASTRO DE SÓSIA ---
async function handleRegister(event) {
  event.preventDefault();

  const submitterName = document.getElementById('submitterName').value.trim();
  const lookalikeName = document.getElementById('lookalikeName').value.trim();
  const btnSubmit = document.getElementById('btnSubmitForm');

  if (!base64Image) {
    await showCustomAlert("Sem foto não tem como rir da cara dele! Manda a porra da foto! 👽", "Cadê a prova?", "📸");
    return;
  }

  btnSubmit.disabled = true;
  btnSubmit.innerText = "Jogando na fogueira... 🌀";

  try {
    const response = await fetch('/api/entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        submitterName,
        lookalikeName,
        image: base64Image
      })
    });

    const result = await response.json();

    if (result.success) {
      await showCustomAlert(result.message, "Sucesso Supremo!", "🎉");
      // Reseta o formulário
      document.getElementById('registerForm').reset();
      removePreview();
      // Vai para a galeria ver o novo sósia
      switchTab('gallery');
    } else {
      await showCustomAlert(result.message, "Deu Ruim!", "💥");
    }
  } catch (error) {
    console.error(error);
    await showCustomAlert("Erro de conexão! O servidor não aguentou tanta feiura de uma vez.", "Pane no Sistema", "🔌");
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerText = "Mandar Essa Porcaria Pro Espaço! 🚀";
  }
}

// --- LEITURA E RENDERIZAÇÃO DE DADOS ---
let tournament = { status: 'registration', currentMatchIndex: 0, matches: [] };
let countdownInterval = null;

async function refreshData() {
  try {
    const response = await fetch('/api/entries');
    const result = await response.json();

    if (result.success) {
      allEntries = result.entries;
      tournament = result.tournament || { status: 'registration', currentMatchIndex: 0, matches: [] };
      renderActiveMatch();
      renderBracketTree();
      renderResults();
      updateRegistrationProgress();
    }
  } catch (error) {
    console.error("Falha ao carregar sósias:", error);
  }
}

function updateRegistrationProgress() {
  const countSpan = document.getElementById('registrationCount');
  const progressBar = document.getElementById('registrationProgressBar');
  const progressContainer = document.getElementById('registrationProgressContainer');
  const closedMessage = document.getElementById('registrationClosedMessage');
  const registerForm = document.getElementById('registerForm');
  const btnSubmit = document.getElementById('btnSubmitForm');

  if (!countSpan || !progressBar) return;

  const count = allEntries.length;
  countSpan.innerText = count;

  const percent = Math.min((count / 16) * 100, 100);
  progressBar.style.width = percent + '%';

  if (tournament.status !== 'registration') {
    if (progressContainer) progressContainer.classList.add('hidden');
    if (closedMessage) closedMessage.classList.remove('hidden');
    if (registerForm) {
      const inputs = registerForm.querySelectorAll('input, button');
      inputs.forEach(input => {
        input.disabled = true;
      });
    }
    if (btnSubmit) {
      btnSubmit.innerText = "Inscrições Encerradas 🔒";
      btnSubmit.classList.add('btn-secondary');
      btnSubmit.classList.remove('btn-primary');
    }
  } else {
    if (progressContainer) progressContainer.classList.remove('hidden');
    if (closedMessage) closedMessage.classList.add('hidden');
    if (registerForm) {
      const inputs = registerForm.querySelectorAll('input, button');
      inputs.forEach(input => {
        input.disabled = false;
      });
    }
    if (btnSubmit) {
      btnSubmit.innerText = "Mandar Essa Porcaria Pro Espaço! 🚀";
      btnSubmit.classList.remove('btn-secondary');
      btnSubmit.classList.add('btn-primary');
    }
  }
}

function voteInTournament(playerId) {
  const player = allEntries.find(e => e.id === playerId);
  const displayName = player ? player.lookalikeName : 'Sósia';
  openVoteFlow(playerId, displayName);
}

function startCountdown(startTimeStr) {
  if (countdownInterval) clearInterval(countdownInterval);

  const startTime = new Date(startTimeStr);
  const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);

  const timerEl = document.getElementById('matchCountdown');
  if (!timerEl) return;

  function updateTimer() {
    const now = new Date();
    const diff = endTime - now;

    if (diff <= 0) {
      timerEl.innerText = "Encerrando duelo... ⌛";
      clearInterval(countdownInterval);
      setTimeout(refreshData, 3000);
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (num) => String(num).padStart(2, '0');
    timerEl.innerText = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  updateTimer();
  countdownInterval = setInterval(updateTimer, 1000);
}

function renderActiveMatch() {
  const activeSection = document.getElementById('activeMatchSection');
  if (!activeSection) return;

  if (tournament.status === 'registration') {
    activeSection.innerHTML = `
      <div class="glass-card active-match-card welcome-card" style="text-align: center;">
        <h3 style="color: var(--color-neon-yellow); margin-bottom: 1rem; font-family: var(--font-title); font-size: 1.8rem;">🛸 Copa em Fase de Inscrições</h3>
        <p style="font-size: 1.15rem; line-height: 1.6; max-width: 600px; margin: 0 auto 1.5rem;">
          Estamos recrutando aberrações do Léo Showza. Precisamos de exatamente <strong>16 sósias</strong> para dar início ao chaveamento interdimensional da zueira!
        </p>
        <div style="font-size: 2.2rem; font-weight: bold; color: var(--color-neon-cyan); margin-bottom: 1.5rem;">
          ${allEntries.length} / 16 vagas
        </div>
        <button class="btn btn-primary pulse-btn" onclick="switchTab('register')">Enviar um Clone Agora! 🚀</button>
      </div>
    `;
    return;
  }

  if (tournament.status === 'finished') {
    const finalMatch = tournament.matches[14];
    const winnerId = finalMatch ? finalMatch.winnerId : null;
    const winner = allEntries.find(e => e.id === winnerId);

    if (winner) {
      activeSection.innerHTML = `
        <div class="glass-card active-match-card champion-card" style="text-align: center; border-color: var(--color-neon-yellow); box-shadow: 0 0 30px rgba(255, 234, 0, 0.4);">
          <div style="font-size: 5rem; margin-bottom: 0.5rem; animation: bounceWinner 2s infinite alternate;">👑🏆👑</div>
          <h2 style="font-family: var(--font-accent); font-size: 2.5rem; background: linear-gradient(to right, #ffe259, #ffa751); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 1.5rem;">
            CAMPEÃO SUPREMO
          </h2>
          <div style="width: 220px; height: 220px; border-radius: 50%; overflow: hidden; margin: 0 auto 1.5rem; border: 5px solid var(--color-neon-yellow); box-shadow: 0 0 25px var(--color-neon-yellow);">
            <img src="${winner.image}" style="width:100%; height:100%; object-fit:cover;">
          </div>
          <h3 style="font-family: var(--font-title); font-size: 2rem; color: #fff; margin-bottom: 0.5rem;">${winner.lookalikeName}</h3>
          <p style="color: #ccc; font-size: 1.1rem; margin-bottom: 1.5rem;">Denunciado com sucesso por: <strong>${winner.submitterName}</strong></p>
          <div class="votes-badge" style="position:static; display:inline-flex; margin: 0 auto;">
            <span>Com o total de ${winner.votes} votos ao longo do torneio!</span>
          </div>
        </div>
      `;
    } else {
      activeSection.innerHTML = `<div class="glass-card active-match-card" style="text-align:center;">Campeonato Finalizado!</div>`;
    }
    return;
  }

  const currentMatchIndex = tournament.currentMatchIndex;
  const match = tournament.matches[currentMatchIndex];
  if (!match) return;

  const player1 = allEntries.find(e => e.id === match.player1Id);
  const player2 = allEntries.find(e => e.id === match.player2Id);

  if (!player1 || !player2) {
    activeSection.innerHTML = `<div class="glass-card active-match-card" style="text-align:center;">Erro: Competidores não encontrados!</div>`;
    return;
  }

  const totalVotes = (match.player1Votes || 0) + (match.player2Votes || 0);
  const p1Percent = totalVotes > 0 ? Math.round(((match.player1Votes || 0) / totalVotes) * 100) : 50;
  const p2Percent = totalVotes > 0 ? Math.round(((match.player2Votes || 0) / totalVotes) * 100) : 50;

  const alreadyVoted = localStorage.getItem('voted_match_' + match.id) === 'true';

  activeSection.innerHTML = `
    <div class="glass-card active-match-card">
      <div class="active-match-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed rgba(255,255,255,0.15); padding-bottom:1rem; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <span class="active-match-badge" style="background:var(--color-neon-pink); color:#fff; padding:0.4rem 0.8rem; border-radius:30px; font-weight:bold; font-size:0.9rem; text-transform:uppercase; box-shadow:0 0 10px rgba(255,0,127,0.5);">Duelo de Hoje 🔥</span>
          <span style="margin-left:0.5rem; font-weight:bold; color:var(--color-neon-cyan);">${match.label}</span>
        </div>
        <div style="font-size:1.1rem; font-weight:bold; color:var(--color-neon-yellow);">
          Tempo Restante: <span id="matchCountdown" style="font-family:monospace; font-size:1.2rem; background:rgba(0,0,0,0.3); padding:0.2rem 0.6rem; border-radius:6px; border:1px solid rgba(255,234,0,0.3);">24:00:00</span>
        </div>
      </div>

      <div class="battle-duo-container" style="display:grid; grid-template-columns: 1fr auto 1fr; gap:1.5rem; align-items:center; margin-bottom:2rem;">
        
        <!-- Player 1 -->
        <div class="battle-fighter left" style="text-align:center;">
          <div class="fighter-image-wrapper" style="position:relative; width:100%; height:280px; border-radius:15px; overflow:hidden; border:3px solid ${alreadyVoted && p1Percent >= p2Percent ? 'var(--color-neon-green)' : 'rgba(255,255,255,0.15)'}; box-shadow:${alreadyVoted && p1Percent >= p2Percent ? '0 0 20px rgba(57,255,20,0.3)' : '0 10px 20px rgba(0,0,0,0.3)'}; transition:all 0.3s;">
            <img src="${player1.image}" style="width:100%; height:100%; object-fit:cover;">
            ${alreadyVoted ? `<div class="votes-badge" style="position:absolute; bottom:12px; right:12px; top:auto;">${match.player1Votes} votos</div>` : ''}
          </div>
          <h3 style="font-family:var(--font-title); font-size:1.4rem; color:#fff; margin:1rem 0 0.2rem;">${player1.lookalikeName}</h3>
          <p style="color:#aaa; font-size:0.9rem; margin-bottom:1rem;">Denunciado por: <strong>${player1.submitterName}</strong></p>
          ${!alreadyVoted ? `
            <button class="btn btn-primary btn-block" onclick="voteInTournament('${player1.id}')" style="background:linear-gradient(135deg, var(--color-neon-pink), var(--color-neon-purple)); font-size:1rem; padding:0.7rem 1.2rem;">Votar nesse Clone 🗳️</button>
          ` : `
            <div style="font-size:1.8rem; font-weight:bold; color:var(--color-neon-pink);">${p1Percent}%</div>
          `}
        </div>

        <!-- VS Divider -->
        <div class="vs-divider" style="font-family:var(--font-accent); font-size:2.5rem; color:var(--color-neon-yellow); text-shadow:0 0 10px rgba(255,234,0,0.5); transform:rotate(-10deg); animation:pulseVS 1s infinite alternate; width:50px; text-align:center;">VS</div>

        <!-- Player 2 -->
        <div class="battle-fighter right" style="text-align:center;">
          <div class="fighter-image-wrapper" style="position:relative; width:100%; height:280px; border-radius:15px; overflow:hidden; border:3px solid ${alreadyVoted && p2Percent >= p1Percent ? 'var(--color-neon-green)' : 'rgba(255,255,255,0.15)'}; box-shadow:${alreadyVoted && p2Percent >= p1Percent ? '0 0 20px rgba(57,255,20,0.3)' : '0 10px 20px rgba(0,0,0,0.3)'}; transition:all 0.3s;">
            <img src="${player2.image}" style="width:100%; height:100%; object-fit:cover;">
            ${alreadyVoted ? `<div class="votes-badge" style="position:absolute; bottom:12px; right:12px; top:auto;">${match.player2Votes} votos</div>` : ''}
          </div>
          <h3 style="font-family:var(--font-title); font-size:1.4rem; color:#fff; margin:1rem 0 0.2rem;">${player2.lookalikeName}</h3>
          <p style="color:#aaa; font-size:0.9rem; margin-bottom:1rem;">Denunciado por: <strong>${player2.submitterName}</strong></p>
          ${!alreadyVoted ? `
            <button class="btn btn-primary btn-block" onclick="voteInTournament('${player2.id}')" style="background:linear-gradient(135deg, var(--color-neon-pink), var(--color-neon-purple)); font-size:1rem; padding:0.7rem 1.2rem;">Votar nesse Clone 🗳️</button>
          ` : `
            <div style="font-size:1.8rem; font-weight:bold; color:var(--color-neon-pink);">${p2Percent}%</div>
          `}
        </div>

      </div>

      ${alreadyVoted ? `
        <div class="voting-progress-container" style="margin-top:1.5rem; background:rgba(255,255,255,0.05); padding:1rem; border-radius:10px; border:1px solid rgba(255,255,255,0.08);">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.95rem; font-weight:bold; color:#ccc;">
            <span>${player1.lookalikeName}: ${p1Percent}% (${match.player1Votes} votos)</span>
            <span>${player2.lookalikeName}: ${p2Percent}% (${match.player2Votes} votos)</span>
          </div>
          <div class="progress-bar-bg" style="width: 100%; height: 16px; background: rgba(0,0,0,0.3); border-radius: 8px; overflow: hidden; display:flex;">
            <div style="width: ${p1Percent}%; height: 100%; background: linear-gradient(to right, var(--color-neon-pink), var(--color-neon-purple)); transition: width 0.5s ease;"></div>
            <div style="width: ${p2Percent}%; height: 100%; background: linear-gradient(to right, var(--color-neon-cyan), var(--color-neon-green)); transition: width 0.5s ease;"></div>
          </div>
          <div style="margin-top:0.8rem; text-align:center; color:var(--color-neon-green); font-weight:bold; font-size:0.95rem;">
            Você já registrou seu voto de hoje nesta chave! Acompanhe o chaveamento abaixo. 🏆
          </div>
        </div>
      ` : ''}

    </div>
  `;

  startCountdown(tournament.matchStartTime);
}

function renderBracketTree() {
  const treeContainer = document.getElementById('bracketTree');
  if (!treeContainer) return;

  if (tournament.status === 'registration' || !tournament.matches || tournament.matches.length === 0) {
    treeContainer.innerHTML = `
      <div class="empty-state" style="padding: 2rem; text-align: center; width: 100%;">
        <p style="font-size: 3rem; margin-bottom:1rem;">🏆</p>
        <p style="font-size: 1.1rem; color:#bbb;">O chaveamento será gerado assim que preenchermos as 16 vagas!</p>
      </div>
    `;
    return;
  }

  const getPlayerHtml = (playerId, match, isPlayer1) => {
    if (!playerId) {
      return `
        <div class="bracket-player empty">
          <div class="bracket-player-avatar">❓</div>
          <div class="bracket-player-name">Aguardando...</div>
          <div class="bracket-player-votes"></div>
        </div>
      `;
    }

    const player = allEntries.find(e => e.id === playerId);
    const votes = isPlayer1 ? match.player1Votes : match.player2Votes;
    const isWinner = match.winnerId === playerId;
    
    const isActive = tournament.currentMatchIndex === match.id && tournament.status === 'active';
    const isClosed = match.winnerId !== null;
    const showVotes = isActive || isClosed;

    return `
      <div class="bracket-player ${isWinner ? 'winner' : ''} ${isClosed && !isWinner ? 'eliminated' : ''}">
        <img class="bracket-player-avatar" src="${player ? player.image : 'leo.png'}" alt="Avatar">
        <div class="bracket-player-name">${player ? player.lookalikeName : 'Sósia'}</div>
        <div class="bracket-player-votes">${showVotes ? votes : ''}</div>
      </div>
    `;
  };

  const getMatchCardHtml = (matchId) => {
    const match = tournament.matches[matchId];
    if (!match) return '';

    const isActive = tournament.currentMatchIndex === match.id && tournament.status === 'active';
    const isClosed = match.winnerId !== null;
    
    return `
      <div class="bracket-match-card ${isActive ? 'active-match-card-glow' : ''} ${isClosed ? 'closed' : ''}" id="bracket-match-${match.id}">
        <div class="bracket-match-header">
          <span class="bracket-match-label">${match.label}</span>
          ${isActive ? '<span class="bracket-active-badge">ATIVO 🔥</span>' : ''}
          ${isClosed ? '<span class="bracket-closed-badge">ENCERRADO 🔒</span>' : ''}
        </div>
        <div class="bracket-match-body">
          ${getPlayerHtml(match.player1Id, match, true)}
          <div class="bracket-match-vs">vs</div>
          ${getPlayerHtml(match.player2Id, match, false)}
        </div>
      </div>
    `;
  };

  let oitavasHtml = '';
  for (let i = 0; i < 8; i++) {
    oitavasHtml += getMatchCardHtml(i);
  }

  let quartasHtml = '';
  for (let i = 8; i <= 11; i++) {
    quartasHtml += getMatchCardHtml(i);
  }

  let semiHtml = '';
  for (let i = 12; i <= 13; i++) {
    semiHtml += getMatchCardHtml(i);
  }

  let finalHtml = getMatchCardHtml(14);

  const finalMatch = tournament.matches[14];
  const championId = finalMatch ? finalMatch.winnerId : null;
  const champion = championId ? allEntries.find(e => e.id === championId) : null;
  
  let championHtml = '';
  if (champion) {
    championHtml = `
      <div class="bracket-champion-card">
        <div class="crown-glow">👑</div>
        <img class="bracket-champion-avatar" src="${champion.image}">
        <div class="bracket-champion-title">CAMPEÃO</div>
        <div class="bracket-champion-name">${champion.lookalikeName}</div>
      </div>
    `;
  } else {
    championHtml = `
      <div class="bracket-champion-card empty">
        <div class="bracket-champion-avatar">❓</div>
        <div class="bracket-champion-title">VENCEDOR</div>
        <div class="bracket-champion-name" style="color:#777;">Aguardando...</div>
      </div>
    `;
  }

  treeContainer.innerHTML = `
    <div class="bracket-round">
      <div class="bracket-round-title">Oitavas de Final</div>
      <div class="bracket-round-matches">${oitavasHtml}</div>
    </div>
    <div class="bracket-round">
      <div class="bracket-round-title">Quartas de Final</div>
      <div class="bracket-round-matches">${quartasHtml}</div>
    </div>
    <div class="bracket-round">
      <div class="bracket-round-title">Semifinais</div>
      <div class="bracket-round-matches">${semiHtml}</div>
    </div>
    <div class="bracket-round">
      <div class="bracket-round-title">Grande Final</div>
      <div class="bracket-round-matches">${finalHtml}</div>
    </div>
    <div class="bracket-round">
      <div class="bracket-round-title" style="color:var(--color-neon-yellow);">Coroação</div>
      <div class="bracket-round-matches">${championHtml}</div>
    </div>
  `;
}

// Renderiza a tela de classificação e o pódio
function renderResults() {
  const podiumContainer = document.getElementById('podiumContainer');
  const leaderboardList = document.getElementById('leaderboardList');
  
  if (!podiumContainer || !leaderboardList) return;

  if (allEntries.length === 0) {
    podiumContainer.innerHTML = '<div class="empty-state">Nenhum condenado listado ainda.</div>';
    leaderboardList.innerHTML = '<li class="empty-state">Nenhum registro.</li>';
    return;
  }

  // Ordena por votos (decrescente)
  const sorted = [...allEntries].sort((a, b) => (b.votes || 0) - (a.votes || 0));

  // 1. Renderiza o Pódio (top 3)
  const top3 = sorted.slice(0, 3);
  let podiumHtml = '';

  // Segundo Lugar
  if (top3[1]) {
    podiumHtml += `
      <div class="podium-column second">
        <img class="podium-avatar" src="${top3[1].image}" alt="${top3[1].lookalikeName}">
        <div class="podium-name">${top3[1].lookalikeName || 'Sem Nome'}</div>
        <div class="podium-pillar">
          <span class="podium-rank">2º</span>
          <span class="podium-votes">${top3[1].votes} votos</span>
        </div>
      </div>
    `;
  } else {
    podiumHtml += `<div class="podium-column second" style="opacity: 0.3;">
      <div style="font-size: 2.5rem; margin-bottom: 2rem;">🤡</div>
      <div class="podium-pillar"><span class="podium-rank">2º</span></div>
    </div>`;
  }

  // Primeiro Lugar
  if (top3[0]) {
    podiumHtml += `
      <div class="podium-column first">
        <img class="podium-avatar" src="${top3[0].image}" alt="${top3[0].lookalikeName}">
        <div class="podium-name">${top3[0].lookalikeName || 'Sem Nome'}</div>
        <div class="podium-pillar">
          <span class="podium-rank">1º</span>
          <span class="podium-votes">${top3[0].votes} votos</span>
        </div>
      </div>
    `;
  } else {
    podiumHtml += `<div class="podium-column first" style="opacity: 0.3;">
      <div style="font-size: 3rem; margin-bottom: 2rem;">👑💩</div>
      <div class="podium-pillar"><span class="podium-rank">1º</span></div>
    </div>`;
  }

  // Terceiro Lugar
  if (top3[2]) {
    podiumHtml += `
      <div class="podium-column third">
        <img class="podium-avatar" src="${top3[2].image}" alt="${top3[2].lookalikeName}">
        <div class="podium-name">${top3[2].lookalikeName || 'Sem Nome'}</div>
        <div class="podium-pillar">
          <span class="podium-rank">3º</span>
          <span class="podium-votes">${top3[2].votes} votos</span>
        </div>
      </div>
    `;
  } else {
    podiumHtml += `<div class="podium-column third" style="opacity: 0.3;">
      <div style="font-size: 2.5rem; margin-bottom: 2rem;">💀</div>
      <div class="podium-pillar"><span class="podium-rank">3º</span></div>
    </div>`;
  }

  podiumContainer.innerHTML = podiumHtml;

  // 2. Renderiza a Lista Geral
  leaderboardList.innerHTML = sorted.map((entry, index) => `
    <li class="leaderboard-item">
      <span class="leaderboard-rank">#${index + 1}</span>
      <span class="leaderboard-name"><strong>${entry.lookalikeName}</strong> <small>(denunciado por ${entry.submitterName})</small></span>
      <span class="leaderboard-votes">${entry.votes || 0} ${entry.votes === 1 ? 'voto' : 'votos'}</span>
    </li>
  `).join('');
}

// --- FLUXO DE VOTAÇÃO ---
let savePasswordTimeout;
function savePasswordLocal() {
  const val = document.getElementById('savedPassword').value;
  localStorage.setItem('sosia_password', val);
  
  clearTimeout(savePasswordTimeout);
  savePasswordTimeout = setTimeout(async () => {
    if (val.trim() === '') {
      isUnlocked = false;
      updateNavigationUI(false);
      return;
    }

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: val })
      });
      const result = await response.json();
      if (result.success) {
        isUnlocked = true;
        updateNavigationUI(true);
      } else {
        isUnlocked = false;
        updateNavigationUI(false);
      }
    } catch (error) {
      console.error("Erro ao verificar senha rápida:", error);
    }
  }, 400);
}

function openVoteFlow(id, name) {
  votingTargetId = id;
  
  // Tenta puxar a senha salva localmente
  const savedPass = localStorage.getItem('sosia_password') || '';

  if (savedPass.trim() !== '') {
    // Se já tem senha cadastrada, vota direto sem abrir modal!
    submitVote(id, savedPass);
  } else {
    // Se não, abre modal exigindo a senha
    document.getElementById('modalTargetName').innerText = name;
    document.getElementById('modalPassword').value = '';
    const modal = document.getElementById('voteModal');
    modal.classList.remove('hidden');
    
    // Configura o evento de clique no botão de confirmar
    const confirmBtn = document.getElementById('btnConfirmVote');
    confirmBtn.onclick = () => {
      const passInput = document.getElementById('modalPassword').value;
      submitVote(id, passInput);
    };
  }
}

function closeVoteModal() {
  document.getElementById('voteModal').classList.add('hidden');
  votingTargetId = '';
}

async function submitVote(id, password) {
  if (!password) {
    await showCustomAlert("Digite a porra da senha do campeonato, ô preguiçoso! Sem senha, sem voto. 🔑", "Falta a Senha", "🔑");
    return;
  }

  try {
    const response = await fetch('/api/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id, password })
    });

    const result = await response.json();

    if (result.success) {
      await showCustomAlert(result.message, "Voto Computado!", "🎉");
      
      // Marca que votou no confronto atual no localStorage
      if (tournament && tournament.matches && tournament.status === 'active') {
        const activeMatch = tournament.matches[tournament.currentMatchIndex];
        if (activeMatch) {
          localStorage.setItem('voted_match_' + activeMatch.id, 'true');
        }
      }

      // Fecha modal se estiver aberto
      closeVoteModal();
      
      // Salva a senha certa na barra rápida para facilitar próximos votos e desbloqueia o site
      isUnlocked = true;
      document.getElementById('savedPassword').value = password;
      localStorage.setItem('sosia_password', password);
      updateNavigationUI(true);
      
      // Feedback visual divertido!
      triggerEmojiConfetti();
      
      // Recarrega os dados
      refreshData();
    } else {
      if (response.status === 403) {
        isUnlocked = false;
        localStorage.removeItem('sosia_password');
        document.getElementById('savedPassword').value = '';
        updateNavigationUI(false);
      }
      await showCustomAlert(`Oops! ${result.message}`, "Voto Rejeitado", "🚫");
    }
  } catch (error) {
    console.error(error);
    await showCustomAlert("Deu pau ao computar o voto! Tente de novo, animal.", "Erro de Conexão", "🔌");
  }
}

async function deleteSosiaFlow(id, name) {
  const savedPass = localStorage.getItem('sosia_password') || '';
  
  let password = savedPass;
  if (!password) {
    password = await showCustomPrompt(
      `Digite a senha secreta para deletar o sósia "${name}":`,
      "Excluir Aberração 🗑️",
      "Senha secreta...",
      "🔑"
    );
    if (password === null) return; // cancelou
    if (!password) {
      await showCustomAlert("Você precisa digitar a senha para deletar!", "Senha Ausente", "⚠️");
      return;
    }
  }

  const confirmed = await showCustomConfirm(
    `Tem certeza de que quer deletar o sósia "${name}"? Essa ação não pode ser desfeita!`,
    "Confirmar Exclusão 🗑️",
    "🚨"
  );
  if (!confirmed) return;

  await submitDeleteSosia(id, password);
}

async function submitDeleteSosia(id, password) {
  try {
    const response = await fetch(`/api/entries/${id}/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    });

    const result = await response.json();

    if (result.success) {
      await showCustomAlert(result.message, "Sucesso Supremo!", "🗑️");
      
      // Salva a senha certa na barra rápida para facilitar próximos votos e desbloqueia o site
      isUnlocked = true;
      document.getElementById('savedPassword').value = password;
      localStorage.setItem('sosia_password', password);
      updateNavigationUI(true);

      // Recarrega os dados da galeria
      refreshData();
    } else {
      if (response.status === 403) {
        isUnlocked = false;
        localStorage.removeItem('sosia_password');
        document.getElementById('savedPassword').value = '';
        updateNavigationUI(false);
      }
      await showCustomAlert(`Não foi possível deletar: ${result.message}`, "Operação Negada", "🛑");
    }
  } catch (error) {
    console.error(error);
    await showCustomAlert("Erro de conexão ao tentar deletar o sósia.", "Erro de Conexão", "🔌");
  }
}

// --- ADMIN / RESET CONTROLS ---
async function promptReset() {
  const savedPass = localStorage.getItem('sosia_password') || '';
  const password = await showCustomPrompt("Para RESETAR todos os dados e começar de novo, digite a senha de votação:", "Segurança do Hospício", "Senha de votação...", "🔑", savedPass);
  if (password === null) return; // cancelado

  if (!password) {
    await showCustomAlert("A senha é obrigatória, espertinho!", "Campo Obrigatório", "⚠️");
    return;
  }

  const confirmed = await showCustomConfirm("⚠️ ATENÇÃO: Quer mesmo apagar toda a zueira e começar do zero? Vai arruinar a humilhação alheia!", "Confirmar Apocalipse 💣", "🚨");
  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch('/api/admin/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    });

    const result = await response.json();

    if (result.success) {
      isUnlocked = false;
      localStorage.removeItem('sosia_password');
      document.getElementById('savedPassword').value = '';
      updateNavigationUI(false);
      await showCustomAlert(result.message, "Campeonato Resetado", "💥");
      refreshData();
      switchTab('gallery');
    } else {
      await showCustomAlert(`Não deu: ${result.message}`, "Operação Negada", "🛑");
    }
  } catch (error) {
    console.error(error);
    await showCustomAlert("Erro ao resetar essa porcaria.", "Falha do Servidor", "🔌");
  }
}

// --- CONTROLES DE CONFIGURAÇÃO ---
async function loadConfig() {
  try {
    const response = await fetch('/api/config');
    const result = await response.json();
    if (result.success) {
      document.getElementById('configFriendEmail').value = result.friendEmail;
      // Preenche com a senha salva para evitar ter que digitar novamente
      const savedPass = localStorage.getItem('sosia_password') || '';
      document.getElementById('configPassword').value = savedPass;
    }
  } catch (error) {
    console.error("Erro ao carregar configurações:", error);
  }
}

async function handleSaveConfig(event) {
  event.preventDefault();

  const friendEmail = document.getElementById('configFriendEmail').value.trim();
  const password = document.getElementById('configPassword').value;
  const btnSave = document.getElementById('btnSaveConfig');

  btnSave.disabled = true;
  btnSave.innerText = "Salvando nas estrelas... 🌀";

  try {
    const response = await fetch('/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ friendEmail, password })
    });

    const result = await response.json();

    if (result.success) {
      await showCustomAlert(result.message, "Configuração Salva!", "⚙️");
      
      // Armazena a senha válida localmente também para facilitar votos e desbloqueia navegação
      isUnlocked = true;
      document.getElementById('savedPassword').value = password;
      localStorage.setItem('sosia_password', password);
      updateNavigationUI(true);
      
      loadConfig();
    } else {
      if (response.status === 403) {
        isUnlocked = false;
        localStorage.removeItem('sosia_password');
        document.getElementById('savedPassword').value = '';
        updateNavigationUI(false);
      }
      await showCustomAlert(`Erro: ${result.message}`, "Erro ao Salvar", "🛑");
    }
  } catch (error) {
    console.error(error);
    await showCustomAlert("Falha ao salvar configurações nas estrelas.", "Erro no Espaço-Tempo", "🔌");
  } finally {
    btnSave.disabled = false;
    btnSave.innerText = "Salvar E-mail do Alvo 💾";
  }
}

// --- ADMIN / TOURNAMENT CONTROLS ---

async function adminAdvanceMatch() {
  const savedPass = localStorage.getItem('sosia_password') || '';
  const password = await showCustomPrompt("Digite a senha do campeonato para forçar o avanço da chave atual:", "Avanço de Chave ⚡", "Senha secreta...", "🔑", savedPass);
  if (password === null) return;
  if (!password) {
    await showCustomAlert("Senha obrigatória!", "Acesso Negado", "⚠️");
    return;
  }

  try {
    const response = await fetch('/api/tournament/advance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const result = await response.json();
    if (result.success) {
      await showCustomAlert(result.message, "Sucesso!", "⚡");
      isUnlocked = true;
      localStorage.setItem('sosia_password', password);
      document.getElementById('savedPassword').value = password;
      updateNavigationUI(true);
      refreshData();
    } else {
      await showCustomAlert(result.message, "Erro", "🛑");
    }
  } catch (error) {
    console.error(error);
    await showCustomAlert("Erro de conexão ao tentar avançar chave.", "Erro de Conexão", "🔌");
  }
}

async function adminMockTournament() {
  const savedPass = localStorage.getItem('sosia_password') || '';
  const password = await showCustomPrompt("Para gerar 16 sósias fictícios e iniciar o torneio agora, digite a senha:", "Campeonato Demo 🧬", "Senha secreta...", "🔑", savedPass);
  if (password === null) return;
  if (!password) {
    await showCustomAlert("Senha obrigatória!", "Acesso Negado", "⚠️");
    return;
  }

  const confirmed = await showCustomConfirm("⚠️ Isso vai apagar todos os sósias e votos atuais e criar 16 concorrentes de teste. Tem certeza?", "Confirmar Geração", "🚨");
  if (!confirmed) return;

  try {
    const response = await fetch('/api/admin/mock-tournament', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const result = await response.json();
    if (result.success) {
      await showCustomAlert(result.message, "Sucesso!", "🧬");
      isUnlocked = true;
      localStorage.setItem('sosia_password', password);
      document.getElementById('savedPassword').value = password;
      updateNavigationUI(true);
      refreshData();
      switchTab('gallery');
    } else {
      await showCustomAlert(result.message, "Erro", "🛑");
    }
  } catch (error) {
    console.error(error);
    await showCustomAlert("Erro de conexão ao gerar campeonato de teste.", "Erro de Conexão", "🔌");
  }
}
