// js/professor.js - Sistema JonasXP V3

document.addEventListener('DOMContentLoaded', () => {
    // Garantir que existam dados mínimos
    inicializarDadosSeVazio();
    carregarDadosIniciais();
});

function inicializarDadosSeVazio() {
    let turmas = API.getTurmas();
    if (!turmas || turmas.length === 0) {
        // Se estiver totalmente sem turmas, cadastra duas por padrão para não ficar em branco
        API.salvarTurma({ nome: '6º Ano A' });
        API.salvarTurma({ nome: '7º Ano B' });
    }
}

// CARREGAMENTO INICIAL E MÉTRICAS
function carregarDadosIniciais() {
    renderizarTurmas();
    renderizarTabelaAlunos();
    atualizarSelectsTurmas();
    atualizarMetricas();
}

function atualizarMetricas() {
    const alunos = Array.isArray(API.getAlunos()) ? API.getAlunos() : [];
    const turmas = Array.isArray(API.getTurmas()) ? API.getTurmas() : [];

    const elTotalAlunos = document.getElementById('metricTotalAlunos');
    const elTotalTurmas = document.getElementById('metricTotalTurmas');
    const elTotalXP = document.getElementById('metricTotalXP');
    const elMediaNivel = document.getElementById('metricMediaNivel');

    if (elTotalAlunos) elTotalAlunos.innerText = alunos.length;
    if (elTotalTurmas) elTotalTurmas.innerText = turmas.length;

    let xpTotal = 0;
    let somaNiveis = 0;

    alunos.forEach(aluno => {
        const totalAlunoXP = API.getAlunoXP(aluno.id) || 0;
        const infoNivel = API.calcularNivel(totalAlunoXP);
        xpTotal += totalAlunoXP;
        somaNiveis += (infoNivel ? infoNivel.nivel : 1);
    });

    if (elTotalXP) elTotalXP.innerText = xpTotal.toLocaleString();
    const mediaNivel = alunos.length > 0 ? (somaNiveis / alunos.length).toFixed(1) : 0;
    if (elMediaNivel) elMediaNivel.innerText = mediaNivel;
}

// 1. RENDERIZAR TURMAS NA TABELA
function renderizarTurmas() {
    const tbody = document.getElementById('tabelaTurmas');
    if (!tbody) {
        console.warn("Elemento 'tabelaTurmas' não foi encontrado no HTML!");
        return;
    }

    const turmas = Array.isArray(API.getTurmas()) ? API.getTurmas() : [];

    if (turmas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" class="text-center py-4 text-muted">Nenhuma turma cadastrada.</td></tr>`;
        return;
    }

    tbody.innerHTML = turmas.map(t => `
        <tr>
            <td class="fw-bold text-light">${t.nome}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-danger" onclick="excluirTurma(${t.id})" title="Excluir Turma">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// 2. ATUALIZAR SELECTS/DROPDOWNS DE TURMAS
function atualizarSelectsTurmas() {
    const turmas = Array.isArray(API.getTurmas()) ? API.getTurmas() : [];
    const selects = ['filtroTurmaAluno', 'selectTurmaLote', 'selectTurmaWp', 'selectTurmaCracha', 'alunoTurma'];

    selects.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        const valAtual = el.value;
        if (id === 'filtroTurmaAluno') {
            el.innerHTML = '<option value="">Todas as Turmas</option>';
        } else if (id === 'alunoTurma') {
            el.innerHTML = '<option value="" disabled selected>Selecione uma turma...</option>';
        } else {
            el.innerHTML = '<option value="">Selecione uma Turma...</option>';
        }

        turmas.forEach(t => {
            el.innerHTML += `<option value="${t.nome}">${t.nome}</option>`;
        });

        el.value = valAtual;
    });
}

// 3. TABELA DE ALUNOS & RANKING
function renderizarTabelaAlunos() {
    const tbody = document.getElementById('tabelaAlunos');
    if (!tbody) return;

    const elFiltro = document.getElementById('filtroTurmaAluno');
    const filtro = elFiltro ? elFiltro.value : '';
    let alunos = Array.isArray(API.getAlunos()) ? API.getAlunos() : [];

    if (filtro) {
        alunos = alunos.filter(a => a.turma === filtro);
    }

    if (alunos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Nenhum aluno encontrado.</td></tr>`;
        return;
    }

    alunos.sort((a, b) => (API.getAlunoXP(b.id) || 0) - (API.getAlunoXP(a.id) || 0));

    tbody.innerHTML = alunos.map(aluno => {
        const xp = API.getAlunoXP(aluno.id) || 0;
        const nivelInfo = API.calcularNivel(xp) || { nivel: 1, titulo: 'Novato', porcentagem: 0 };

        return `
            <tr>
                <td>
                    <div class="fw-bold text-light">${aluno.nome}</div>
                    <small class="text-muted font-mono">ID: #${aluno.id}</small>
                </td>
                <td><span class="badge bg-dark border border-secondary">${aluno.turma}</span></td>
                <td>
                    <span class="badge bg-primary badge-level">Nível ${nivelInfo.nivel}</span>
                    <div class="small text-warning mt-0.5">${nivelInfo.titulo}</div>
                </td>
                <td>
                    <div class="d-flex justify-between text-xs mb-1">
                        <span class="text-success fw-bold">${xp} XP</span>
                        <span class="text-muted">${nivelInfo.porcentagem}%</span>
                    </div>
                    <div class="progress bg-black border border-secondary" style="height: 6px;">
                        <div class="progress-bar bg-warning" style="width: ${nivelInfo.porcentagem}%"></div>
                    </div>
                </td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-info me-1" onclick="verDetalhesAluno(${aluno.id})" title="Ver Histórico"><i class="fa-solid fa-eye"></i></button>
                    <button class="btn btn-sm btn-outline-warning me-1" onclick="abrirQRModal(${aluno.id})" title="QR Code"><i class="fa-solid fa-qrcode"></i></button>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editarAluno(${aluno.id})"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="excluirAluno(${aluno.id})"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

// 4. LANÇAMENTO EM LOTE
function carregarAlunosParaLote() {
    const elTurma = document.getElementById('selectTurmaLote');
    const tbody = document.getElementById('tabelaLote');
    const btnSalvar = document.getElementById('btnSalvarLote');

    if (!elTurma || !tbody) return;
    const turma = elTurma.value;

    if (!turma) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Selecione uma turma para carregar a lista de lançamento.</td></tr>`;
        if (btnSalvar) btnSalvar.disabled = true;
        return;
    }

    const todosAlunos = Array.isArray(API.getAlunos()) ? API.getAlunos() : [];
    const alunos = todosAlunos.filter(a => a.turma === turma);

    if (alunos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Nenhum aluno cadastrado nesta turma.</td></tr>`;
        if (btnSalvar) btnSalvar.disabled = true;
        return;
    }

    tbody.innerHTML = alunos.map(aluno => `
        <tr>
            <td class="fw-bold align-middle">
                ${aluno.nome}
                <input type="hidden" name="alunoId[]" value="${aluno.id}">
            </td>
            <td><input type="number" name="atividade[]" class="form-control form-control-sm bg-black text-light border-secondary text-center" value="0" min="0"></td>
            <td><input type="number" name="equipe[]" class="form-control form-control-sm bg-black text-light border-secondary text-center" value="0" min="0"></td>
            <td><input type="number" name="comportamento[]" class="form-control form-control-sm bg-black text-light border-secondary text-center" value="0" min="0"></td>
            <td><input type="number" name="participacao[]" class="form-control form-control-sm bg-black text-light border-secondary text-center" value="0" min="0"></td>
            <td>
                <textarea name="observacao[]" class="form-control form-control-sm bg-black text-light border-secondary" rows="2" placeholder="Observações..."></textarea>
            </td>
        </tr>
    `).join('');

    if (btnSalvar) btnSalvar.disabled = false;
}

function salvarLoteXP(e) {
    e.preventDefault();

    const form = document.getElementById('formLote');
    if (!form) return;

    const alunoIds = Array.from(form.querySelectorAll('input[name="alunoId[]"]')).map(i => i.value);
    const atividades = Array.from(form.querySelectorAll('input[name="atividade[]"]')).map(i => Number(i.value) || 0);
    const equipes = Array.from(form.querySelectorAll('input[name="equipe[]"]')).map(i => Number(i.value) || 0);
    const comportamentos = Array.from(form.querySelectorAll('input[name="comportamento[]"]')).map(i => Number(i.value) || 0);
    const participacoes = Array.from(form.querySelectorAll('input[name="participacao[]"]')).map(i => Number(i.value) || 0);
    const observacoes = Array.from(form.querySelectorAll('textarea[name="observacao[]"]')).map(i => i.value);

    let lancamentosContador = 0;

    alunoIds.forEach((id, idx) => {
        const atv = atividades[idx];
        const eqp = equipes[idx];
        const comp = comportamentos[idx];
        const part = participacoes[idx];
        const obs = observacoes[idx];

        if (atv > 0 || eqp > 0 || comp > 0 || part > 0 || obs.trim() !== '') {
            API.adicionarLancamento({
                alunoId: Number(id),
                data: new Date().toISOString().split('T')[0],
                atividade: atv,
                equipe: eqp,
                comportamento: comp,
                participacao: part,
                observacao: obs
            });
            lancamentosContador++;
        }
    });

    alert(`${lancamentosContador} lançamentos salvos com sucesso!`);
    carregarAlunosParaLote();
    carregarDadosIniciais();
}

// 5. GERENCIAMENTO DE TURMAS E ALUNOS (CRUD)
function modalNovaTurma() {
    const elId = document.getElementById('turmaId');
    const elNome = document.getElementById('turmaNome');
    if (elId) elId.value = '';
    if (elNome) elNome.value = '';

    const elModal = document.getElementById('modalTurma');
    if (elModal) new bootstrap.Modal(elModal).show();
}

function salvarTurma(e) {
    e.preventDefault();
    const nomeInput = document.getElementById('turmaNome');
    if (!nomeInput || !nomeInput.value.trim()) return;

    API.salvarTurma({ nome: nomeInput.value.trim() });

    const elModal = document.getElementById('modalTurma');
    if (elModal) {
        const instance = bootstrap.Modal.getInstance(elModal);
        if (instance) instance.hide();
    }

    carregarDadosIniciais();
}

function excluirTurma(id) {
    if (confirm("Deseja realmente remover esta turma?")) {
        API.excluirTurma(id);
        carregarDadosIniciais();
    }
}

function modalNovoAluno() {
    const elId = document.getElementById('alunoId');
    const elNome = document.getElementById('alunoNome');
    if (elId) elId.value = '';
    if (elNome) elNome.value = '';

    const elModal = document.getElementById('modalAluno');
    if (elModal) new bootstrap.Modal(elModal).show();
}

function salvarAluno(e) {
    e.preventDefault();
    const id = document.getElementById('alunoId').value;
    const nome = document.getElementById('alunoNome').value;
    const turma = document.getElementById('alunoTurma').value;

    API.salvarAluno({ id: id ? Number(id) : null, nome, turma });

    const elModal = document.getElementById('modalAluno');
    if (elModal) {
        const instance = bootstrap.Modal.getInstance(elModal);
        if (instance) instance.hide();
    }

    carregarDadosIniciais();
}

function editarAluno(id) {
    const aluno = API.getAlunoPorId(id);
    if (!aluno) return;

    document.getElementById('alunoId').value = aluno.id;
    document.getElementById('alunoNome').value = aluno.nome;
    document.getElementById('alunoTurma').value = aluno.turma;

    const elModal = document.getElementById('modalAluno');
    if (elModal) new bootstrap.Modal(elModal).show();
}

function excluirAluno(id) {
    if (confirm("Deseja realmente excluir este aluno?")) {
        API.excluirAluno(id);
        carregarDadosIniciais();
    }
}