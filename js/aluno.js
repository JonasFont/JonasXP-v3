document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const alunoId = params.get('id');

    if (!alunoId) {
        document.body.innerHTML = `
            <div class="container text-center py-5">
                <h3 class="text-danger">Acesso Inválido</h3>
                <p class="text-muted">Nenhum ID de aluno foi fornecido no link.</p>
            </div>`;
        return;
    }

    const aluno = await API.getAlunoPorId(alunoId);

    if (!aluno) {
        document.body.innerHTML = `
            <div class="container text-center py-5">
                <h3 class="text-warning">Aluno não encontrado</h3>
                <p class="text-muted">Não encontramos um cadastro associado a este ID.</p>
            </div>`;
        return;
    }

    const historico = await API.getLancamentosPorAluno(alunoId);
    const xp = Number(aluno.xp || aluno.XP) || 0;
    const info = API.calcularNivel(xp);

    document.getElementById('alunoNome').innerText = aluno.nome || aluno.Nome;
    document.getElementById('alunoTurma').innerText = aluno.turma || aluno.Turma;
    document.getElementById('alunoNivel').innerText = info.nivel;
    document.getElementById('alunoTitulo').innerText = info.titulo;
    document.getElementById('alunoXP').innerText = `${xp} XP`;
    document.getElementById('alunoProgresso').style.width = `${info.porcentagem}%`;

    const tbody = document.getElementById('tabelaHistoricoAluno');
    if (!historico || historico.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Nenhum lançamento registrado.</td></tr>`;
    } else {
        tbody.innerHTML = historico.map(h => `
            <tr>
                <td>${h.data || h.Data}</td>
                <td class="text-success">+${h.atividade || 0}</td>
                <td class="text-success">+${h.equipe || 0}</td>
                <td class="text-success">+${h.comportamento || 0}</td>
                <td class="text-success">+${h.participacao || 0}</td>
                <td class="small text-muted">${h.observacao || '-'}</td>
            </tr>
        `).join('');
    }
});
// Configuração dos 10 Níveis e Auras
const TABELA_PROGRESSAO = [
  { nivel: 1, xpMeta: 100,  titulo: "👤 Humano Comum" },
  { nivel: 2, xpMeta: 250,  titulo: "✨ Aura Branca (Chakra Iniciante)" },
  { nivel: 3, xpMeta: 500,  titulo: "🟩 Aura Verde (Nível Genin)" },
  { nivel: 4, xpMeta: 850,  titulo: "🟦 Aura Azul (Nível Chunin)" },
  { nivel: 5, xpMeta: 1300, titulo: "🟪 Aura Roxa (Expansão de Domínio)" },
  { nivel: 6, xpMeta: 1900, titulo: "🟥 Aura Vermelha (Modo Berserker)" },
  { nivel: 7, xpMeta: 2600, titulo: "🟨 Aura Dourada (Super Saiyajin)" },
  { nivel: 8, xpMeta: 3500, titulo: "🔲 Aura Prateada (Instinto Superior)" },
  { nivel: 9, xpMeta: 5000, titulo: "🌌 Aura Cósmica (Caçador Rank-S)" },
  { nivel: 10, xpMeta: 9999, titulo: "👑 Aura Divina (Hokage / Deus da Morte)" }
];

// Lista de Poderes RPG por Nível
const LISTA_PODERES = [
  { reqNivel: 2, nome: '⏰ Poder do Tempo', desc: '+5 min na entrega de uma atividade' },
  { reqNivel: 3, nome: '🪑 Escolha do Trono', desc: 'Escolhe o lugar na sala por 1 aula' },
  { reqNivel: 4, nome: '🎵 Ritmo do Código', desc: 'Pode ouvir música durante tarefa individual' },
  { reqNivel: 5, nome: '🤝 Dupla Lendária', desc: 'Escolhe a dupla no trabalho prático' },
  { reqNivel: 6, nome: '🛡️ Escudo Anti-Bug', desc: 'Refaz 1 questão de uma atividade' },
  { reqNivel: 7, nome: '☕ Pausa do Café', desc: '3 minutos extras de água/intervalo' },
  { reqNivel: 8, nome: '💡 Dica do Mestre', desc: 'Pede 1 dica direta ao professor na tarefa' },
  { reqNivel: 9, nome: '📜 Lorde do Projeto', desc: 'Escolhe o tema de um trabalho livre' },
  { reqNivel: 10, nome: '👑 Imunidade Lendária', desc: 'Nota máxima automática em 1 participação' }
];

function renderPerfil(aluno, avaliacoes) {
  document.getElementById('loading').classList.add('d-none');
  document.getElementById('perfilContent').classList.remove('d-none');

  const xpAtual = Number(aluno.XP || 0);

  // Nível Dinâmico
  let infoNivel = TABELA_PROGRESSAO.find(p => xpAtual < p.xpMeta) || TABELA_PROGRESSAO[TABELA_PROGRESSAO.length - 1];
  let nivelAtual = infoNivel.nivel > 1 && xpAtual < TABELA_PROGRESSAO[infoNivel.nivel - 2].xpMeta 
    ? infoNivel.nivel - 1 
    : (xpAtual >= 5000 ? 10 : infoNivel.nivel);

  // Aplica classe de aura no fundo
  document.body.className = `aura-lvl-${nivelAtual}`;

  const configNivelAtual = TABELA_PROGRESSAO[nivelAtual - 1];
  const proximaMeta = configNivelAtual.xpMeta;

  document.getElementById('alunoNome').innerText = aluno.Nome;
  document.getElementById('alunoTurma').innerText = `Turma: ${aluno.Turma}`;
  document.getElementById('alunoNivel').innerText = `Nível ${nivelAtual}`;
  document.getElementById('alunoTitulo').innerText = configNivelAtual.titulo;

  // Barra de Progresso
  const xpAnterior = nivelAtual > 1 ? TABELA_PROGRESSAO[nivelAtual - 2].xpMeta : 0;
  const xpNoNivel = xpAtual - xpAnterior;
  const metaNoNivel = proximaMeta - xpAnterior;
  const porcentagem = Math.min(100, Math.max(0, Math.floor((xpNoNivel / metaNoNivel) * 100)));

  document.getElementById('xpBar').style.width = `${porcentagem}%`;
  document.getElementById('xpText').innerText = `${xpAtual} / ${proximaMeta} XP`;

  renderBadges(xpAtual, avaliacoes);
  renderPoderes(nivelAtual);
  renderHistoricoEDinamico(avaliacoes);
}

function renderBadges(xp, avaliacoes) {
  const container = document.getElementById('containerBadges');
  const badges = [
    { nome: '🎓 Despertar', desc: 'Ganhou os primeiros pontos', unlocked: avaliacoes && avaliacoes.length > 0 },
    { nome: '⭐ Foco Total', desc: 'Nota 10 em comportamento', unlocked: avaliacoes && avaliacoes.some(a => Number(a.Comportamento) === 10) },
    { nome: '🤝 Sincronia de Equipe', desc: 'Nota 10 em trabalho em equipe', unlocked: avaliacoes && avaliacoes.some(a => Number(a.Equipe) === 10) },
    { nome: '🔥 Despertar de Aura', desc: 'Alcançou 250 XP', unlocked: xp >= 250 },
    { nome: '⚡ Dominio de Chakra', desc: 'Alcançou 850 XP', unlocked: xp >= 850 },
    { nome: '👑 Modo Lendário', desc: 'Alcançou 2600 XP', unlocked: xp >= 2600 }
  ];

  container.innerHTML = badges.map(b => `
    <span class="badge ${b.unlocked ? 'bg-success' : 'bg-dark text-muted border border-secondary'}" title="${b.desc}">
      ${b.unlocked ? '✅' : '🔒'} ${b.nome}
    </span>
  `).join('');
}

function renderPoderes(nivelAtual) {
  const container = document.getElementById('containerPoderes');
  
  container.innerHTML = LISTA_PODERES.map(p => {
    const liberado = nivelAtual >= p.reqNivel;
    return `
      <div class="col-md-4 col-6 mb-2">
        <div class="p-2 border rounded text-center ${liberado ? 'border-primary bg-dark' : 'border-secondary opacity-50'}" style="min-height: 105px;">
          <small class="d-block fw-bold ${liberado ? 'text-primary' : 'text-muted'}">${p.nome}</small>
          <small class="d-block text-muted my-1" style="font-size:0.75rem">${p.desc}</small>
          <span class="badge ${liberado ? 'bg-success' : 'bg-secondary'}">${liberado ? '✨ Desbloqueado' : `🔒 Nível ${p.reqNivel}`}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderHistoricoEDinamico(avaliacoes) {
  const histContainer = document.getElementById('historico');
  const avisosContainer = document.getElementById('containerAvisos');
  const badgeNotificacao = document.getElementById('badgeNotificacao');

  if (!avaliacoes || avaliacoes.length === 0) {
    histContainer.innerHTML = `<p class="text-muted text-center py-3">Nenhuma aula registrada ainda.</p>`;
    avisosContainer.innerHTML = `<p class="text-muted text-center py-3">Nenhuma observação ou recado registrado.</p>`;
    return;
  }

  const listaInvertida = avaliacoes.slice().reverse();

  // 1. Renderizar Histórico Dinâmico com cores pedagógicas amigáveis
  histContainer.innerHTML = listaInvertida.map(av => {
    const ativ = Number(av.Atividade || 0);
    const eqp = Number(av.Equipe || 0);
    const comp = Number(av.Comportamento || 0);
    const part = Number(av.Participacao || 0);
    const totalGanha = ativ + eqp + comp + part;

    return `
      <div class="border border-secondary rounded p-3 bg-dark bg-opacity-70 shadow-sm">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="badge bg-success fs-6 fw-bold">+${totalGanha} XP Ganho</span>
          <small class="text-muted fw-bold">📅 ${av.Data}</small>
        </div>
        
        <div class="row g-2 text-center my-1">
          <div class="col-3">
            <div class="p-1 border border-secondary rounded bg-black">
              <small class="d-block text-muted" style="font-size:0.65rem">Atividade</small>
              <strong class="text-info">+${ativ}</strong>
            </div>
          </div>
          <div class="col-3">
            <div class="p-1 border border-secondary rounded bg-black">
              <small class="d-block text-muted" style="font-size:0.65rem">Equipe</small>
              <strong class="text-warning">+${eqp}</strong>
            </div>
          </div>
          <div class="col-3">
            <div class="p-1 border border-secondary rounded bg-black">
              <small class="d-block text-muted" style="font-size:0.65rem">Atitude</small>
              <strong class="text-primary">+${comp}</strong>
            </div>
          </div>
          <div class="col-3">
            <div class="p-1 border border-secondary rounded bg-black">
              <small class="d-block text-muted" style="font-size:0.65rem">Participação</small>
              <!-- MUDANÇA: Cor Violeta/Lilás amigável em vez de vermelho -->
              <strong style="color: #a855f7;">+${part}</strong>
            </div>
          </div>
        </div>

        ${av.Observacao ? `
          <div class="mt-2 p-2 rounded bg-warning bg-opacity-10 border border-warning border-opacity-25">
            <small class="text-warning d-block fw-bold">💬 Recado do Professor:</small>
            <small class="text-light">${av.Observacao}</small>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  // 2. Renderizar Notificações/Avisos filtrados
  const comObservacao = listaInvertida.filter(av => av.Observacao && av.Observacao.trim() !== '');

  if (comObservacao.length > 0) {
    badgeNotificacao.classList.remove('d-none');
    avisosContainer.innerHTML = comObservacao.map(av => `
      <div class="p-3 border border-warning rounded bg-dark bg-opacity-90 shadow">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <strong class="text-warning">📌 Observação do Professor</strong>
          <small class="text-muted">${av.Data}</small>
        </div>
        <p class="mb-0 text-light mt-2" style="font-size: 0.95rem;">"${av.Observacao}"</p>
      </div>
    `).join('');
  } else {
    avisosContainer.innerHTML = `<p class="text-muted text-center py-3">Nenhum recado ou aviso por enquanto! Tudo em ordem 👍</p>`;
  }
}