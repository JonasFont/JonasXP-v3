// js/professor.js - Controle Geral do Painel

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar Eventos dos Formulários e Botoes
    configurarEventos();
    
    // 2. Carregar Dados Iniciais
    carregarDadosIniciais();
});

function configurarEventos() {
    // Modal Turma
    document.getElementById('btnAbrirModalTurma').addEventListener('click', () => {
        document.getElementById('turmaId').value = '';
        document.getElementById('turmaNome').value = '';
        new bootstrap.Modal(document.getElementById('modalTurma')).show();
    });

    document.getElementById('formTurma').addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('turmaNome').value;
        API.salvarTurma({ nome: nome });
        bootstrap.Modal.getInstance(document.getElementById('modalTurma')).hide();
        carregarDadosIniciais();
    });

    // Modal Aluno
    document.getElementById('btnAbrirModalAluno').addEventListener('click', () => {
        document.getElementById('alunoId').value = '';
        document.getElementById('alunoNome').value = '';
        new bootstrap.Modal(document.getElementById('modalAluno')).show();
    });

    document.getElementById('formAluno').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('alunoId').value;
        const nome = document.getElementById('alunoNome').value;
        const turma = document.getElementById('alunoTurma').value;

        API.salvarAluno({ id: id ? Number(id) : null, nome, turma });
        bootstrap.Modal.getInstance(document.getElementById('modalAluno')).hide();
        carregarDadosIniciais();
    });

    // Filtro de Alunos
    document.getElementById('filtroTurmaAluno').addEventListener('change', renderizarTabelaAlunos);

    // Lançamento em Lote
    document.getElementById('selectTurmaLote').addEventListener('change', carregarAlunosParaLote);
    document.getElementById('formLote').addEventListener('submit', salvarLoteXP);

    // WhatsApp
    document.getElementById('selectTurmaWp').addEventListener('change', gerarLinksWhatsAppTurma);
}

function carregarDadosIniciais() {
    renderizarTurmas();
    atualizarSelectsTurmas();
    renderizarTabelaAlunos();
    atualizarMetricas();
}

function atualizarMetricas() {
    const alunos = API.getAlunos();
    const turmas = API.getTurmas();

    document.getElementById('metricTotalAlunos').innerText = alunos.length;
    document.getElementById('metricTotalTurmas').innerText = turmas.length;

    let xpTotal = 0;
    let somaNiveis = 0;

    alunos.forEach(aluno => {
        const totalAlunoXP = API.getAlunoXP(aluno.id);
        const infoNivel = API.calcularNivel(totalAlunoXP);
        xpTotal += totalAlunoXP;
        somaNiveis += infoNivel.nivel;
    });

    document.getElementById('metricTotalXP').innerText = xpTotal.toLocaleString();
    const mediaNivel = alunos.length > 0 ? (somaNiveis / alunos.length).toFixed(1) : 0;
    document.getElementById('metricMediaNivel').innerText = mediaNivel;
}

function atualizarSelectsTurmas() {
    const turmas = API.getTurmas();
    const selects = ['filtroTurmaAluno', 'selectTurmaLote', 'selectTurmaWp', 'alunoTurma'];

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

// 1. RENDERIZAR TURMAS
function renderizarTurmas() {
    const tbody = document.getElementById('tabelaTurmas');
    const turmas = API.getTurmas();

    if (turmas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" class="text-center py-4 text-muted">Nenhuma turma cadastrada ainda. Clique em "Nova Turma" acima!</td></tr>`;
        return;
    }

    tbody.innerHTML = turmas.map(t => `
        <tr>
            <td class="fw-bold text-light">${t.nome}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-danger" onclick="excluirTurma(${t.id})">
                    <i class="fa-solid fa-trash me-1"></i>Excluir
                </button>
            </td>
        </tr>
    `).join('');
}

function excluirTurma(id) {
    if (confirm("Remover esta turma?")) {
        API.excluirTurma(id);
        carregarDadosIniciais();
    }
}

// 2. RENDERIZAR ALUNOS
function renderizarTabelaAlunos() {
    const tbody = document.getElementById('tabelaAlunos');
    const filtro = document.getElementById('filtroTurmaAluno').value;
    let alunos = API.getAlunos();

    if (filtro) {
        alunos = alunos.filter(a => a.turma === filtro);
    }

    if (alunos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Nenhum aluno cadastrado.</td></tr>`;
        return;
    }

    alunos.sort((a, b) => API.getAlunoXP(b.id) - API.getAlunoXP(a.id));

    tbody.innerHTML = alunos.map(aluno => {
        const xp = API.getAlunoXP(aluno.id);
        const nivelInfo = API.calcularNivel(xp);

        return `
            <tr>
                <td>
                    <div class="fw-bold text-light">${aluno.nome}</div>
                    <small class="text-muted">ID: #${aluno.id}</small>
                </td>
                <td><span class="badge bg-dark border border-secondary">${aluno.turma}</span></td>
                <td>
                    <span class="badge bg-primary">Nível ${nivelInfo.nivel}</span>
                    <div class="small text-warning mt-0.5">${nivelInfo.titulo}</div>
                </td>
                <td>
                    <div class="d-flex justify-content-between text-xs mb-1">
                        <span class="text-success fw-bold">${xp} XP</span>
                        <span class="text-muted">${nivelInfo.porcentagem}%</span>
                    </div>
                    <div class="progress bg-black border border-secondary" style="height: 6px;">
                        <div class="progress-bar bg-warning" style="width: ${nivelInfo.porcentagem}%"></div>
                    </div>
                </td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-info me-1" onclick="verDetalhesAluno(${aluno.id})"><i class="fa-solid fa-eye"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="excluirAluno(${aluno.id})"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

function excluirAluno(id) {
    if (confirm("Deseja realmente excluir este aluno?")) {
        API.excluirAluno(id);
        carregarDadosIniciais();
    }
}

function verDetalhesAluno(id) {
    const aluno = API.getAlunoPorId(id);
    if (!aluno) return;

    const xp = API.getAlunoXP(id);
    const nivelInfo = API.calcularNivel(xp);
    const historico = API.getLancamentosPorAluno(id);

    document.getElementById('modalDetalhesNome').innerText = aluno.nome + " (" + aluno.turma + ")";
    document.getElementById('detalheNivel').innerText = nivelInfo.nivel;
    document.getElementById('detalheTitulo').innerText = nivelInfo.titulo;
    document.getElementById('detalheXP').innerText = xp + " XP";

    const tbody = document.getElementById('detalhesHistorico');
    if (historico.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-3">Nenhum lançamento registrado.</td></tr>`;
    } else {
        tbody.innerHTML = historico.map(h => `
            <tr>
                <td>${h.data}</td>
                <td class="text-success">+${h.atividade || 0}</td>
                <td class="text-success">+${h.equipe || 0}</td>
                <td class="text-success">+${h.comportamento || 0}</td>
                <td class="text-success">+${h.participacao || 0}</td>
                <td class="fw-bold text-warning">+${(h.atividade || 0) + (h.equipe || 0) + (h.comportamento || 0) + (h.participacao || 0)}</td>
                <td class="small text-muted">${h.observacao || '-'}</td>
            </tr>
        `).join('');
    }

    new bootstrap.Modal(document.getElementById('modalDetalhesAluno')).show();
}

// 3. LANÇAMENTO EM LOTE
function carregarAlunosParaLote() {
    const turma = document.getElementById('selectTurmaLote').value;
    const tbody = document.getElementById('tabelaLote');
    const btnSalvar = document.getElementById('btnSalvarLote');

    if (!turma) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Selecione uma turma para carregar a lista de lançamento.</td></tr>`;
        btnSalvar.disabled = true;
        return;
    }

    const alunos = API.getAlunos().filter(a => a.turma === turma);

    if (alunos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Nenhum aluno cadastrado nesta turma.</td></tr>`;
        btnSalvar.disabled = true;
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
                <textarea name="observacao[]" class="form-control form-control-sm bg-black text-light border-secondary" rows="1" placeholder="Observações..."></textarea>
            </td>
        </tr>
    `).join('');

    btnSalvar.disabled = false;
}

function salvarLoteXP(e) {
    e.preventDefault();

    const form = document.getElementById('formLote');
    const alunoIds = Array.from(form.querySelectorAll('input[name="alunoId[]"]')).map(i => i.value);
    const atividades = Array.from(form.querySelectorAll('input[name="atividade[]"]')).map(i => Number(i.value) || 0);
    const equipes = Array.from(form.querySelectorAll('input[name="equipe[]"]')).map(i => Number(i.value) || 0);
    const comportamentos = Array.from(form.querySelectorAll('input[name="comportamento[]"]')).map(i => Number(i.value) || 0);
    const participacoes = Array.from(form.querySelectorAll('input[name="participacao[]"]')).map(i => Number(i.value) || 0);
    const observacoes = Array.from(form.querySelectorAll('textarea[name="observacao[]"]')).map(i => i.value);

    let count = 0;

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
            count++;
        }
    });

    alert(`${count} lançamentos de XP gravados com sucesso!`);
    carregarAlunosParaLote();
    carregarDadosIniciais();
}

// 4. GERADOR WHATSAPP
function gerarLinksWhatsAppTurma() {
    const turma = document.getElementById('selectTurmaWp').value;
    const container = document.getElementById('containerLinksWp');
    const template = document.getElementById('msgWpTemplate').value;

    if (!turma) {
        container.innerHTML = `<div class="text-center text-muted py-4">Selecione uma turma para carregar a lista.</div>`;
        return;
    }

    const alunos = API.getAlunos().filter(a => a.turma === turma);

    if (alunos.length === 0) {
        container.innerHTML = `<div class="text-center text-muted py-4">Nenhum aluno cadastrado nesta turma.</div>`;
        return;
    }

    const baseUrl = window.location.origin + window.location.pathname.replace('professor.html', 'aluno.html');

    container.innerHTML = alunos.map(aluno => {
        const link = `${baseUrl}?id=${aluno.id}`;
        const mensagemPronta = template.replace(/{nome}/g, aluno.nome).replace(/{link}/g, link);
        const urlWp = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagemPronta)}`;

        return `
            <div class="p-3 bg-black border border-secondary rounded d-flex justify-content-between align-items-center">
                <div>
                    <div class="fw-bold text-light">${aluno.nome}</div>
                    <div class="small text-info">${link}</div>
                </div>
                <a href="${urlWp}" target="_blank" class="btn btn-sm btn-success fw-bold">
                    <i class="fa-brands fa-whatsapp me-1"></i>Enviar
                </a>
            </div>
        `;
    }).join('');
}