let ALL_ALUNOS = [];
let ALL_TURMAS = [];
let linkAlunoAtualModal = '';
let modalDetalhesInstance = null;
let modalQRInstance = null;

const NIVEIS_XP = [
  { nivel: 1, min: 0, max: 99, titulo: "Novato" },
  { nivel: 2, min: 100, max: 249, titulo: "Aprendiz" },
  { nivel: 3, min: 250, max: 499, titulo: "Explorador" },
  { nivel: 4, min: 500, max: 849, titulo: "Aventureiro" },
  { nivel: 5, min: 850, max: 1299, titulo: "Veterano" },
  { nivel: 6, min: 1300, max: 1899, titulo: "Especialista" },
  { nivel: 7, min: 1900, max: 2599, titulo: "Mestre" },
  { nivel: 8, min: 2600, max: 3499, titulo: "Sábio" },
  { nivel: 9, min: 3500, max: 4999, titulo: "Lendário" },
  { nivel: 10, min: 5000, max: Infinity, titulo: "Mitológico" }
];

document.addEventListener("DOMContentLoaded", () => {
  modalDetalhesInstance = new bootstrap.Modal(document.getElementById('modalDetalhesAluno'));
  modalQRInstance = new bootstrap.Modal(document.getElementById('modalQR'));

  document.getElementById('btnCopiarModal').addEventListener('click', () => {
    if (linkAlunoAtualModal) copiarTexto(linkAlunoAtualModal);
  });

  carregarDadosGlobais();
});

async function carregarDadosGlobais() {
  const [turmas, alunos] = await Promise.all([
    API.getTurmas(),
    API.getAlunos()
  ]);

  ALL_TURMAS = turmas || [];
  ALL_ALUNOS = alunos || [];

  atualizarDashboardMetricas();
  preencherSelectsTurmas();
  renderizarTabelaAlunos();
  renderizarTabelaTurmas();
}

function atualizarDashboardMetricas() {
  document.getElementById("metricTotalAlunos").innerText = ALL_ALUNOS.length;
  document.getElementById("metricTotalTurmas").innerText = ALL_TURMAS.length;

  const totalXP = ALL_ALUNOS.reduce((acc, a) => acc + Number(a.XP || 0), 0);
  document.getElementById("metricTotalXP").innerText = totalXP.toLocaleString() + " XP";

  if (ALL_ALUNOS.length > 0) {
    const somaNiveis = ALL_ALUNOS.reduce((acc, a) => acc + Number(a.Nivel || 1), 0);
    const media = (somaNiveis / ALL_ALUNOS.length).toFixed(1);
    document.getElementById("metricMediaNivel").innerText = media;
  } else {
    document.getElementById("metricMediaNivel").innerText = "0";
  }
}

function preencherSelectsTurmas() {
  const selects = ['filtroTurmaAluno', 'selectTurmaLote', 'alunoTurma', 'selectTurmaCracha'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const valAtual = el.value;

    let defaultText = id === 'filtroTurmaAluno' ? 'Todas as Turmas' : '-- Selecione a Turma --';
    el.innerHTML = `<option value="">${defaultText}</option>` + 
      ALL_TURMAS.map(t => `<option value="${t.Nome}">${t.Nome}</option>`).join('');
    
    el.value = valAtual;
  });
}

function renderizarTabelaAlunos() {
  const tbody = document.getElementById("tabelaAlunos");
  const filtro = document.getElementById("filtroTurmaAluno").value;

  const alunosFiltrados = filtro ? ALL_ALUNOS.filter(a => a.Turma === filtro) : ALL_ALUNOS;

  if (alunosFiltrados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Nenhum aluno encontrado.</td></tr>';
    return;
  }

  alunosFiltrados.sort((a, b) => (b.XP || 0) - (a.XP || 0));

  tbody.innerHTML = alunosFiltrados.map(aluno => {
    const xp = Number(aluno.XP || 0);
    const nivelObj = obterInfoNivel(xp);
    const percProgresso = calcularPorcentagemProximoNivel(xp, nivelObj);

    return `
      <tr>
        <td class="fw-bold text-light">${aluno.Nome}</td>
        <td><span class="badge bg-secondary">${aluno.Turma}</span></td>
        <td><span class="badge bg-primary badge-level">Nível ${nivelObj.nivel}</span></td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <div class="progress w-100 bg-black border border-secondary" style="height: 16px;">
              <div class="progress-bar bg-success progress-bar-striped progress-bar-animated" role="progressbar" style="width: ${percProgresso}%">
                ${xp} XP
              </div>
            </div>
            <small class="text-muted fw-bold">${percProgresso}%</small>
          </div>
        </td>
        <td class="text-end">
          <button class="btn btn-outline-info btn-sm me-1" title="Ver Detalhes/Histórico" onclick="verDetalhesAluno('${aluno.ID}')"><i class="fa-solid fa-eye"></i></button>
          <button class="btn btn-outline-light btn-sm me-1" title="QR Code" onclick="gerarQR('${aluno.ID}', '${aluno.Nome}')"><i class="fa-solid fa-qrcode"></i></button>
          <button class="btn btn-outline-success btn-sm me-1" title="Copiar Link" onclick="copiarLinkAluno('${aluno.ID}')"><i class="fa-solid fa-link"></i></button>
          <button class="btn btn-outline-warning btn-sm me-1" title="Editar" onclick="modalEditarAluno('${aluno.ID}')"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-outline-danger btn-sm" title="Excluir" onclick="deletarAluno('${aluno.ID}')"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `;
  }).join('');
}

function obterInfoNivel(xp) {
  for (let i = NIVEIS_XP.length - 1; i >= 0; i--) {
    if (xp >= NIVEIS_XP[i].min) return NIVEIS_XP[i];
  }
  return NIVEIS_XP[0];
}

function calcularPorcentagemProximoNivel(xp, nivelAtual) {
  if (nivelAtual.max === Infinity) return 100;
  const xpGanhoNoNivel = xp - nivelAtual.min;
  const xpNecessarioNoNivel = nivelAtual.max - nivelAtual.min + 1;
  const perc = Math.floor((xpGanhoNoNivel / xpNecessarioNoNivel) * 100);
  return Math.min(Math.max(perc, 0), 100);
}

// --- VER DETALHES DO ALUNO SEM TRAVAR A TELA ---
async function verDetalhesAluno(id) {
  const tbody = document.getElementById("detalhesHistorico");
  tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Carregando histórico...</td></tr>';

  modalDetalhesInstance.show();

  const data = await API.getAlunoById(id);
  if (data.error || !data.aluno) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Erro ao carregar detalhes.</td></tr>';
    return;
  }

  const aluno = data.aluno;
  const avaliacoes = data.avaliacoes || [];
  const xp = Number(aluno.XP || 0);
  const infoNivel = obterInfoNivel(xp);

  document.getElementById("modalDetalhesNome").innerHTML = `<i class="fa-solid fa-user-graduate me-2"></i>${aluno.Nome} - ${aluno.Turma}`;
  document.getElementById("detalheNivel").innerText = infoNivel.nivel;
  document.getElementById("detalheTitulo").innerText = infoNivel.titulo;
  document.getElementById("detalheXP").innerText = xp.toLocaleString() + " XP";

  if (infoNivel.max === Infinity) {
    document.getElementById("detalheProximoNivel").innerText = "Nível Máximo Alcançado!";
  } else {
    const faltaXP = (infoNivel.max + 1) - xp;
    document.getElementById("detalheProximoNivel").innerText = `Faltam ${faltaXP} XP para o Nível ${infoNivel.nivel + 1}`;
  }

  if (avaliacoes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nenhum lançamento registrado.</td></tr>';
  } else {
    const listaInvertida = avaliacoes.slice().reverse();
    tbody.innerHTML = listaInvertida.map(av => {
      const total = Number(av.Atividade || 0) + Number(av.Equipe || 0) + Number(av.Comportamento || 0) + Number(av.Participacao || 0);
      return `
        <tr>
          <td><small>${av.Data}</small></td>
          <td class="text-info">+${av.Atividade}</td>
          <td class="text-warning">+${av.Equipe}</td>
          <td class="text-primary">+${av.Comportamento}</td>
          <td style="color: #a855f7;">+${av.Participacao}</td>
          <td class="fw-bold text-success">+${total}</td>
          <td><small class="text-muted">${av.Observacao || '-'}</small></td>
        </tr>
      `;
    }).join('');
  }
}

// --- FUNÇÕES DE QR CODE E LINK ---
function getLinkAluno(id) {
  return `${window.location.origin}${window.location.pathname.replace('professor.html', '')}aluno.html?id=${id}`;
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

function copiarLinkAluno(id) {
  copiarTexto(getLinkAluno(id));
}

function copiarTexto(texto) {
  navigator.clipboard.writeText(texto).then(() => {
    alert('🔗 Link de acesso copiado com sucesso!');
  }).catch(() => {
    prompt("Copie o link abaixo:", texto);
  });
}

function gerarCrachasTurma() {
  const turma = document.getElementById('selectTurmaCracha').value;
  const container = document.getElementById('containerCrachas');

  if (!turma) {
    container.innerHTML = `<div class="text-center text-muted no-print py-5">Selecione uma turma para carregar os crachás.</div>`;
    return;
  }

  const alunos = ALL_ALUNOS.filter(a => a.Turma === turma);

  if (alunos.length === 0) {
    container.innerHTML = `<div class="text-center text-muted no-print py-5">Nenhum aluno nesta turma.</div>`;
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
          <h5 class="fw-bold my-1 text-light">${a.Nome}</h5>
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

// --- LANÇAMENTO EM LOTE ---
function carregarAlunosParaLote() {
  const turma = document.getElementById("selectTurmaLote").value;
  const tbody = document.getElementById("tabelaLote");
  const btn = document.getElementById("btnSalvarLote");

  if (!turma) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Selecione uma turma acima.</td></tr>';
    btn.disabled = true;
    return;
  }

  const alunosTurma = ALL_ALUNOS.filter(a => a.Turma === turma);
  if (alunosTurma.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nenhum aluno nesta turma.</td></tr>';
    btn.disabled = true;
    return;
  }

  tbody.innerHTML = alunosTurma.map(aluno => `
    <tr data-alunoid="${aluno.ID}">
      <td class="fw-bold text-light">${aluno.Nome}</td>
      <td><input type="number" class="form-control form-control-sm bg-black text-light border-secondary inp-ativ" min="0" value="0"></td>
      <td><input type="number" class="form-control form-control-sm bg-black text-light border-secondary inp-eqp" min="0" value="0"></td>
      <td><input type="number" class="form-control form-control-sm bg-black text-light border-secondary inp-comp" min="0" value="0"></td>
      <td><input type="number" class="form-control form-control-sm bg-black text-light border-secondary inp-part" min="0" value="0"></td>
      <td><input type="text" class="form-control form-control-sm bg-black text-light border-secondary inp-obs" placeholder="Opcional"></td>
    </tr>
  `).join('');

  btn.disabled = false;
}

async function salvarLoteXP(e) {
  e.preventDefault();
  const rows = document.querySelectorAll("#tabelaLote tr");
  const avaliacoes = [];

  rows.forEach(tr => {
    const alunoId = tr.getAttribute("data-alunoid");
    if (alunoId) {
      const ativ = Number(tr.querySelector(".inp-ativ").value || 0);
      const eqp = Number(tr.querySelector(".inp-eqp").value || 0);
      const comp = Number(tr.querySelector(".inp-comp").value || 0);
      const part = Number(tr.querySelector(".inp-part").value || 0);
      const obs = tr.querySelector(".inp-obs").value;

      if (ativ > 0 || eqp > 0 || comp > 0 || part > 0) {
        avaliacoes.push({ alunoId, atividade: ativ, equipe: eqp, comportamento: comp, participacao: part, observacao: obs });
      }
    }
  });

  if (avaliacoes.length === 0) return alert("Informe XP para pelo menos um aluno.");

  document.getElementById("btnSalvarLote").disabled = true;
  const res = await API.addAvaliacoesLote(avaliacoes);

  if (res.success) {
    alert("✅ Pontuações salvas com sucesso!");
    await carregarDadosGlobais();
    carregarAlunosParaLote();
  } else {
    alert("Erro ao salvar!");
    document.getElementById("btnSalvarLote").disabled = false;
  }
}

// --- CRUD TURMAS E ALUNOS ---
function modalNovaTurma() {
  document.getElementById("turmaId").value = "";
  document.getElementById("turmaNome").value = "";
  document.getElementById("modalTurmaTitle").innerText = "Nova Turma";
  new bootstrap.Modal(document.getElementById("modalTurma")).show();
}

async function salvarTurma(e) {
  e.preventDefault();
  const id = document.getElementById("turmaId").value;
  const nome = document.getElementById("turmaNome").value;

  if (id) await API.editTurma(id, nome);
  else await API.addTurma(nome);

  bootstrap.Modal.getInstance(document.getElementById("modalTurma")).hide();
  await carregarDadosGlobais();
}

function renderizarTabelaTurmas() {
  const tbody = document.getElementById("tabelaTurmas");
  if (ALL_TURMAS.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2" class="text-center py-3 text-muted">Nenhuma turma cadastrada.</td></tr>';
    return;
  }

  tbody.innerHTML = ALL_TURMAS.map(t => `
    <tr>
      <td class="fw-bold text-light">${t.Nome}</td>
      <td class="text-end">
        <button class="btn btn-outline-danger btn-sm" onclick="deletarTurma('${t.ID}')"><i class="fa-solid fa-trash me-1"></i> Excluir</button>
      </td>
    </tr>
  `).join('');
}

async function deletarTurma(id) {
  if (confirm("Deseja realmente excluir esta turma?")) {
    await API.deleteTurma(id);
    await carregarDadosGlobais();
  }
}

function modalNovoAluno() {
  document.getElementById("alunoId").value = "";
  document.getElementById("alunoNome").value = "";
  document.getElementById("alunoTurma").value = "";
  document.getElementById("modalAlunoTitle").innerText = "Cadastrar Aluno";
  new bootstrap.Modal(document.getElementById("modalAluno")).show();
}

function modalEditarAluno(id) {
  const aluno = ALL_ALUNOS.find(a => String(a.ID) === String(id));
  if (!aluno) return;

  document.getElementById("alunoId").value = aluno.ID;
  document.getElementById("alunoNome").value = aluno.Nome;
  document.getElementById("alunoTurma").value = aluno.Turma;
  document.getElementById("modalAlunoTitle").innerText = "Editar Aluno";
  new bootstrap.Modal(document.getElementById("modalAluno")).show();
}

async function salvarAluno(e) {
  e.preventDefault();
  const id = document.getElementById("alunoId").value;
  const nome = document.getElementById("alunoNome").value;
  const turma = document.getElementById("alunoTurma").value;

  if (id) await API.editAluno(id, nome, turma);
  else await API.addAluno(nome, turma);

  bootstrap.Modal.getInstance(document.getElementById("modalAluno")).hide();
  await carregarDadosGlobais();
}

async function deletarAluno(id) {
  if (confirm("Deseja realmente excluir este aluno?")) {
    await API.deleteAluno(id);
    await carregarDadosGlobais();
  }
}