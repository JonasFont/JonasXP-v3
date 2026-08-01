document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  if (!id) return alert('ID do aluno não informado!');

  const res = await API.getAlunoById(id);
  if (res.error) return alert('Aluno não encontrado!');

  renderPerfil(res.aluno, res.avaliacoes);
});

function renderPerfil(aluno, avaliacoes) {
  document.getElementById('loading').classList.add('d-none');
  document.getElementById('perfilContent').classList.remove('d-none');

  document.getElementById('alunoNome').innerText = aluno.Nome;
  document.getElementById('alunoTurma').innerText = `Turma: ${aluno.Turma}`;
  document.getElementById('alunoNivel').innerText = `Nível ${aluno.Nivel}`;
  document.getElementById('alunoTitulo').innerText = aluno.Titulo;

  const metas = [0, 100, 300, 700, 1200, 2000];
  const proximaMeta = metas[aluno.Nivel] || 2000;
  const xpAtual = Number(aluno.XP);
  const porcentagem = Math.min(100, Math.floor((xpAtual / proximaMeta) * 100));
  
  document.getElementById('xpBar').style.width = `${porcentagem}%`;
  document.getElementById('xpText').innerText = `${xpAtual} / ${proximaMeta} XP`;

  // Renderizar Badges
  renderBadges(xpAtual, avaliacoes);

  // Renderizar Poderes RPG
  renderPoderes(Number(aluno.Nivel));

  // Renderizar Histórico
  const histContainer = document.getElementById('historico');
  if (!avaliacoes || avaliacoes.length === 0) {
    histContainer.innerHTML = `<p class="text-muted">Nenhuma aula registrada ainda.</p>`;
    return;
  }

  histContainer.innerHTML = avaliacoes.reverse().map(av => {
    const totalSemAula = Number(av.Atividade) + Number(av.Equipe) + Number(av.Comportamento) + Number(av.Participacao);
    return `
      <div class="list-group-item bg-transparent text-light border-secondary px-0 py-2">
        <div class="d-flex justify-content-between align-items-center">
          <strong class="text-success">+${totalSemAula} XP</strong>
          <small class="text-muted">${av.Data}</small>
        </div>
        <small class="text-muted d-block">📝 Ativ: ${av.Atividade} | 🤝 Eqp: ${av.Equipe} | ⭐ Comp: ${av.Comportamento} | 🚀 Part: ${av.Participacao}</small>
      </div>
    `;
  }).join('');
}

function renderBadges(xp, avaliacoes) {
  const container = document.getElementById('containerBadges');
  const badges = [
    { nome: '🎓 Primeira Aula', desc: 'Ganhou os primeiros pontos', unlocked: avaliacoes && avaliacoes.length > 0 },
    { nome: '⭐ Bom Comportamento', desc: 'Nota 10 em comportamento em uma aula', unlocked: avaliacoes && avaliacoes.some(a => Number(a.Comportamento) === 10) },
    { nome: '🤝 Trabalho em Equipe', desc: 'Nota 10 em equipe em uma aula', unlocked: avaliacoes && avaliacoes.some(a => Number(a.Equipe) === 10) },
    { nome: '🔥 Herói de Bronze', desc: 'Alcançou 300 XP', unlocked: xp >= 300 },
    { nome: '💎 Mestre do Código', desc: 'Alcançou 1200 XP', unlocked: xp >= 1200 }
  ];

  container.innerHTML = badges.map(b => `
    <span class="badge ${b.unlocked ? 'bg-success' : 'bg-dark text-muted border border-secondary'}" title="${b.desc}">
      ${b.unlocked ? '✅' : '🔒'} ${b.nome}
    </span>
  `).join('');
}

function renderPoderes(nivel) {
  const container = document.getElementById('containerPoderes');
  const poderes = [
    { reqNivel: 2, nome: '⏰ Poder do Tempo', desc: '+5 minutos na entrega de uma atividade' },
    { reqNivel: 3, nome: '🪑 Escolha do Trono', desc: 'Pode escolher o lugar na sala por 1 aula' },
    { reqNivel: 5, nome: '🤝 Dupla Lendária', desc: 'Pode escolher a dupla no trabalho prático' }
  ];

  container.innerHTML = poderes.map(p => {
    const liberado = nivel >= p.reqNivel;
    return `
      <div class="col-md-4 col-12">
        <div class="p-2 border rounded ${liberado ? 'border-primary bg-dark' : 'border-secondary opacity-50'}">
          <small class="d-block fw-bold ${liberado ? 'text-primary' : 'text-muted'}">${p.nome}</small>
          <small class="d-block text-muted" style="font-size:0.75rem">${p.desc}</small>
          <small class="badge ${liberado ? 'bg-primary' : 'bg-secondary'} mt-1">${liberado ? 'Liberado!' : `Nível ${p.reqNivel}`}</small>
        </div>
      </div>
    `;
  }).join('');
}