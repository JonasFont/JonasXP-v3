let todosAlunos = [];
let todasTurmas = [];
let modalQRInstance = null;
let linkAlunoAtualModal = '';

document.addEventListener("DOMContentLoaded", () => {
  modalQRInstance = new bootstrap.Modal(document.getElementById('modalQR'));
  carregarDados();

  document.getElementById('formAddAluno').addEventListener('submit', cadastrarAluno);
  document.getElementById('formAddTurma').addEventListener('submit', cadastrarTurma);
  document.getElementById('btnCopiarModal').addEventListener('click', () => {
    if (linkAlunoAtualModal) copiarLinkTexto(linkAlunoAtualModal);
  });
});

async function carregarDados() {
  const [resAlunos, resTurmas] = await Promise.all([
    API.getAlunos(),
    API.getTurmas()
  ]);

  todosAlunos = resAlunos || [];
  todasTurmas = resTurmas || [];

  renderTurmasSelects();
  renderTabelaAlunos();
  renderTabelaTurmas();
}

function renderTurmasSelects() {
  const selects = ['turmaAluno', 'selectTurmaLote', 'selectTurmaCracha'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    const valAtual = el.value;
    el.innerHTML = '<option value="">-- Selecione a Turma --</option>' +
      todasTurmas.map(t => `<option value="${t.Nome}">${t.Nome}</option>`).join('');
    el.value = valAtual;
  });
}

function renderTabelaAlunos() {
  const tbody = document.getElementById('tabelaAlunos');
  if (todosAlunos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Nenhum aluno cadastrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = todosAlunos.map(a => `
    <tr>
      <td><strong>${a.Nome}</strong></td>
      <td><span class="badge bg-secondary">${a.Turma}</span></td>
      <td><span class="badge bg-primary">Nível ${a.Nivel}</span></td>
      <td><strong>${a.XP} XP</strong></td>
      <td>
        <button class="btn btn-sm btn-outline-info me-1" onclick="gerarQR('${a.ID}', '${a.Nome}')">
          📱 Ver QR
        </button>
        <button class="btn btn-sm btn-outline-success" onclick="copiarLinkAluno('${a.ID}')">
          🔗 Copiar Link
        </button>
      </td>
    </tr>
  `).join('');
}

function renderTabelaTurmas() {
  const tbody = document.getElementById('tabelaTurmas');
  if (todasTurmas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="2" class="text-center text-muted">Nenhuma turma cadastrada.</td></tr>`;
    return;
  }

  tbody.innerHTML = todasTurmas.map(t => `
    <tr>
      <td><strong>${t.Nome}</strong></td>
      <td>
        <button class="btn btn-sm btn-outline-warning me-1" onclick="editarTurma('${t.ID}', '${t.Nome}')">✏️ Editar</button>
        <button class="btn btn-sm btn-outline-danger" onclick="excluirTurma('${t.ID}')">🗑️ Excluir</button>
      </td>
    </tr>
  `).join('');
}

function carregarTabelaLote() {
  const turmaSelecionada = document.getElementById('selectTurmaLote').value;
  const tbody = document.getElementById('corpoTabelaLote');

  if (!turmaSelecionada) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Selecione uma turma para carregar os alunos.</td></tr>`;
    return;
  }

  const alunosDaTurma = todosAlunos.filter(a => a.Turma === turmaSelecionada);

  if (alunosDaTurma.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Nenhum aluno cadastrado nesta turma.</td></tr>`;
    return;
  }

  tbody.innerHTML = alunosDaTurma.map(a => `
    <tr data-aluno-id="${a.ID}">
      <td><strong>${a.Nome}</strong></td>
      <td><input type="number" min="0" max="10" class="form-control form-control-sm bg-dark text-light border-secondary input-ativ" value="10"></td>
      <td><input type="number" min="0" max="10" class="form-control form-control-sm bg-dark text-light border-secondary input-eqp" value="10"></td>
      <td><input type="number" min="0" max="10" class="form-control form-control-sm bg-dark text-light border-secondary input-comp" value="10"></td>
      <td><input type="number" min="0" max="10" class="form-control form-control-sm bg-dark text-light border-secondary input-part" value="10"></td>
      <td><input type="text" class="form-control form-control-sm bg-dark text-light border-secondary input-obs" placeholder="Opcional"></td>
    </tr>
  `).join('');
}

async function salvarLote() {
  const turma = document.getElementById('selectTurmaLote').value;
  if (!turma) return alert('Selecione uma turma primeiro!');

  const linhas = document.querySelectorAll('#corpoTabelaLote tr[data-aluno-id]');
  const avaliacoes = [];

  linhas.forEach(row => {
    const alunoId = row.getAttribute('data-aluno-id');
    const ativ = row.querySelector('.input-ativ').value || 0;
    const eqp = row.querySelector('.input-eqp').value || 0;
    const comp = row.querySelector('.input-comp').value || 0;
    const part = row.querySelector('.input-part').value || 0;
    const obs = row.querySelector('.input-obs').value || '';

    avaliacoes.push({
      alunoId,
      atividade: ativ,
      equipe: eqp,
      comportamento: comp,
      participacao: part,
      observacao: obs
    });
  });

  if (avaliacoes.length === 0) return alert('Nenhum dado para salvar.');

  const res = await API.addAvaliacoesLote(avaliacoes);
  if (res.success) {
    alert('✅ Notas registradas e XP atualizado com sucesso!');
    carregarDados();
  } else {
    alert('Erro ao salvar lançamento em lote!');
  }
}

async function cadastrarAluno(e) {
  e.preventDefault();
  const nome = document.getElementById('nomeAluno').value;
  const turma = document.getElementById('turmaAluno').value;

  const res = await API.addAluno(nome, turma);
  if (res.success) {
    document.getElementById('nomeAluno').value = '';
    carregarDados();
  }
}

async function cadastrarTurma(e) {
  e.preventDefault();
  const nome = document.getElementById('nomeTurma').value;

  const res = await API.addTurma(nome);
  if (res.success) {
    document.getElementById('nomeTurma').value = '';
    carregarDados();
  }
}

async function editarTurma(id, nomeAtual) {
  const novoNome = prompt('Digite o novo nome para a turma:', nomeAtual);
  if (novoNome && novoNome !== nomeAtual) {
    await API.editTurma(id, novoNome);
    carregarDados();
  }
}

async function excluirTurma(id) {
  if (confirm('Tem certeza que deseja excluir esta turma?')) {
    await API.deleteTurma(id);
    carregarDados();
  }
}

function gerarQR(id, nome) {
  const link = getLinkAluno(id);
  linkAlunoAtualModal = link;

  document.getElementById('modalQRTitulo').innerText = `QR Code - ${nome}`;
  const qrContainer = document.getElementById('qrcode');
  qrContainer.innerHTML = '';

  const qr = qrcode(0, 'M');
  qr.addData(link);
  qr.make();
  qrContainer.innerHTML = qr.createImgTag(5);

  modalQRInstance.show();
}

function getLinkAluno(id) {
  return `${window.location.origin}${window.location.pathname.replace('professor.html', '')}aluno.html?id=${id}`;
}

function copiarLinkAluno(id) {
  const url = getLinkAluno(id);
  copiarLinkTexto(url);
}

function copiarLinkTexto(texto) {
  navigator.clipboard.writeText(texto).then(() => {
    alert('🔗 Link de acesso copiado com sucesso! Você já pode enviar aos pais.');
  }).catch(() => {
    prompt("Copie o link abaixo:", texto);
  });
}

function gerarCrachasTurma() {
  const turma = document.getElementById('selectTurmaCracha').value;
  const container = document.getElementById('containerCrachas');

  if (!turma) {
    container.innerHTML = `<div class="text-center text-muted no-print">Selecione uma turma para carregar os crachás.</div>`;
    return;
  }

  const alunos = todosAlunos.filter(a => a.Turma === turma);

  if (alunos.length === 0) {
    container.innerHTML = `<div class="text-center text-muted no-print">Nenhum aluno nesta turma.</div>`;
    return;
  }

  container.innerHTML = alunos.map(a => {
    const link = getLinkAluno(a.ID);
    const qr = qrcode(0, 'M');
    qr.addData(link);
    qr.make();
    const qrImgTag = qr.createImgTag(4);

    return `
      <div class="col-md-4 col-6">
        <div class="card bg-black border-primary text-light text-center p-3 cracha-card">
          <h6 class="fw-bold text-primary mb-0">⚡ JONAS XP</h6>
          <hr class="border-secondary my-2">
          <h5 class="fw-bold my-1">${a.Nome}</h5>
          <p class="badge bg-secondary mb-2">${a.Turma}</p>
          <div class="bg-white p-2 d-inline-block rounded my-2">
            ${qrImgTag}
          </div>
          <small class="d-block text-muted" style="font-size:0.65rem">Escaneie para acessar seu Perfil RPG</small>
        </div>
      </div>
    `;
  }).join('');
}