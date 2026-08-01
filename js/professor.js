let loginModal;
let todosAlunos = [];
let todasTurmas = [];

document.addEventListener("DOMContentLoaded", () => {
  loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
  loginModal.show();
});

function validarSenha() {
  if (document.getElementById('passInput').value === '1234') {
    loginModal.hide();
    document.getElementById('mainContent').classList.remove('d-none');
    carregarDados();
  } else { alert('Senha incorreta!'); }
}

async function carregarDados() {
  [todosAlunos, todasTurmas] = await Promise.all([API.getAlunos(), API.getTurmas()]);
  
  document.getElementById('totalAlunos').innerText = todosAlunos.length;
  document.getElementById('totalTurmas').innerText = todasTurmas.length;
  document.getElementById('totalXP').innerText = todosAlunos.reduce((acc, curr) => acc + Number(curr.XP), 0);

  const optionsTurmas = '<option value="">-- Selecione a Turma --</option>' + todasTurmas.map(t => `<option value="${t.Nome}">${t.Nome}</option>`).join('');
  document.getElementById('filtroTurmaLote').innerHTML = optionsTurmas;
  document.getElementById('filtroTurmaCracha').innerHTML = optionsTurmas;
  document.getElementById('turmaAluno').innerHTML = todasTurmas.map(t => `<option value="${t.Nome}">${t.Nome}</option>`).join('');

  document.getElementById('tabelaAlunos').innerHTML = todosAlunos.map(a => `
    <tr>
      <td>${a.Nome}</td><td>${a.Turma}</td>
      <td><span class="badge badge-rpg">Nível ${a.Nivel}</span></td><td>${a.XP} XP</td>
      <td><button class="btn btn-sm btn-outline-info" onclick="gerarQR('${a.ID}', '${a.Nome}')">Ver QR</button></td>
    </tr>
  `).join('');

  renderListaTurmas();
}

function carregarTabelaLote() {
  const turma = document.getElementById('filtroTurmaLote').value;
  const container = document.getElementById('containerLote');
  const corpo = document.getElementById('corpoTabelaLote');

  if (!turma) { container.classList.add('d-none'); return; }

  const alunos = todosAlunos.filter(a => String(a.Turma) === String(turma));
  corpo.innerHTML = alunos.map(a => `
    <tr data-alunoid="${a.ID}">
      <td><strong>${a.Nome}</strong></td>
      <td><input type="number" class="form-control form-control-sm in-ativ" min="0" max="10" value="10"></td>
      <td><input type="number" class="form-control form-control-sm in-eqp" min="0" max="10" value="10"></td>
      <td><input type="number" class="form-control form-control-sm in-comp" min="0" max="10" value="10"></td>
      <td><input type="number" class="form-control form-control-sm in-part" min="0" max="10" value="10"></td>
    </tr>
  `).join('');

  container.classList.remove('d-none');
}

async function salvarLote() {
  const linhas = document.querySelectorAll('#corpoTabelaLote tr');
  const avaliacoes = [];

  linhas.forEach(row => {
    avaliacoes.push({
      alunoId: row.dataset.alunoid,
      atividade: row.querySelector('.in-ativ').value,
      equipe: row.querySelector('.in-eqp').value,
      comportamento: row.querySelector('.in-comp').value,
      participacao: row.querySelector('.in-part').value,
    });
  });

  await API.addAvaliacoesLote(avaliacoes);
  alert('Lançamento da aula realizado com sucesso para toda a turma!');
  carregarDados();
}

function gerarCrachasTurma() {
  const turma = document.getElementById('filtroTurmaCracha').value;
  const container = document.getElementById('printableCrachas');
  container.innerHTML = '';

  const alunos = todosAlunos.filter(a => String(a.Turma) === String(turma));
  
  alunos.forEach(a => {
    const card = document.createElement('div');
    card.className = 'col-md-4 col-6';
    const alunoURL = `${window.location.origin}${window.location.pathname.replace('professor.html', '')}aluno.html?id=${a.ID}`;
    
    card.innerHTML = `
      <div class="rpg-card cracha-card p-3 text-center border">
        <h6 class="fw-bold mb-1">${a.Nome}</h6>
        <small class="d-block text-muted mb-2">${a.Turma}</small>
        <div class="qr-box d-flex justify-content-center mb-2"></div>
        <small class="fw-bold text-primary">JonasXP - Hero Card</small>
      </div>
    `;
    container.appendChild(card);
    new QRCode(card.querySelector('.qr-box'), { text: alunoURL, width: 110, height: 110 });
  });
}

function renderListaTurmas() {
  document.getElementById('listaTurmas').innerHTML = todasTurmas.map(t => `
    <li class="list-group-item bg-dark text-light border-secondary d-flex justify-content-between align-items-center">
      <span>${t.Nome}</span>
      <div>
        <button class="btn btn-sm btn-outline-warning me-2" onclick="editarTurma('${t.ID}', '${t.Nome}')">Editar</button>
        <button class="btn btn-sm btn-outline-danger" onclick="excluirTurma('${t.ID}')">Excluir</button>
      </div>
    </li>
  `).join('');
}

async function editarTurma(id, nomeAtual) {
  let novoNome = prompt("Digite o novo nome para a turma:", nomeAtual);
  if (novoNome && novoNome.trim() !== "" && novoNome !== nomeAtual) {
    await API.editTurma(id, novoNome.trim());
    carregarDados();
  }
}

async function excluirTurma(id) {
  if (confirm("Tem certeza que deseja excluir esta turma?")) {
    await API.deleteTurma(id);
    carregarDados();
  }
}

document.getElementById('formAluno').addEventListener('submit', async (e) => {
  e.preventDefault();
  await API.addAluno({ nome: document.getElementById('nomeAluno').value, turma: document.getElementById('turmaAluno').value });
  document.getElementById('nomeAluno').value = '';
  carregarDados();
});

document.getElementById('formTurma').addEventListener('submit', async (e) => {
  e.preventDefault();
  await API.addTurma(document.getElementById('nomeTurma').value);
  document.getElementById('nomeTurma').value = '';
  carregarDados();
});

function gerarQR(id, nome) {
  document.getElementById('qrAlunoNome').innerText = `QR Code - ${nome}`;
  const qrContainer = document.getElementById('qrcode');
  qrContainer.innerHTML = '';
  const alunoURL = `${window.location.origin}${window.location.pathname.replace('professor.html', '')}aluno.html?id=${id}`;
  new QRCode(qrContainer, { text: alunoURL, width: 200, height: 200 });
  new bootstrap.Modal(document.getElementById('qrModal')).show();
}