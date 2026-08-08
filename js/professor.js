// js/professor.js - Controlador Front-end Dinâmico

let CACHE_ALUNOS = [];
let CACHE_TURMAS = [];

document.addEventListener('DOMContentLoaded', () => {
    configurarEventos();
    carregarDadosIniciais();
});

function configurarEventos() {
    // Abertura Limpa dos Modais (Resolve avisos de aria-hidden)
    document.getElementById('btnAbrirModalTurma')?.addEventListener('click', () => {
        document.getElementById('turmaNome').value = '';
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalTurma')).show();
    });

    document.getElementById('btnAbrirModalAluno')?.addEventListener('click', () => {
        document.getElementById('alunoNome').value = '';
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalAluno')).show();
    });

    // Submissão de Formulários
    document.getElementById('formTurma')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (document.activeElement) document.activeElement.blur();

        const nome = document.getElementById('turmaNome').value;
        const btn = e.target.querySelector('button[type="submit"]');
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-1"></i>Salvando...`;
        btn.disabled = true;

        await API.salvarTurma(nome);

        btn.innerHTML = `Salvar Turma`;
        btn.disabled = false;
        bootstrap.Modal.getInstance(document.getElementById('modalTurma'))?.hide();
        carregarDadosIniciais();
    });

    document.getElementById('formAluno')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (document.activeElement) document.activeElement.blur();

        const nome = document.getElementById('alunoNome').value;
        const turma = document.getElementById('alunoTurma').value;
        const btn = e.target.querySelector('button[type="submit"]');
        
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-1"></i>Salvando...`;
        btn.disabled = true;

        await API.salvarAluno(nome, turma);

        btn.innerHTML = `Salvar Aluno`;
        btn.disabled = false;
        bootstrap.Modal.getInstance(document.getElementById('modalAluno'))?.hide();
        carregarDadosIniciais();
    });

    // Filtro e Busca em Tempo Real
    document.getElementById('buscaAluno')?.addEventListener('input', renderizarTabelaAlunos);
    document.getElementById('filtroTurmaAluno')?.addEventListener('change', renderizarTabelaAlunos);

    // Lote e WhatsApp
    document.getElementById('selectTurmaLote')?.addEventListener('change', carregarAlunosParaLote);
    document.getElementById('formLote')?.addEventListener('submit', salvarLoteXP);
    document.getElementById('selectTurmaWp')?.addEventListener('change', gerarLinksWhatsAppTurma);
}

async function carregarDadosIniciais() {
    CACHE_TURMAS = await API.getTurmas();
    CACHE_ALUNOS = await API.getAlunos();

    atualizarSelectsTurmas();
    renderizarTurmas();
    renderizarTabelaAlunos();
    atualizarMetricas();
}

function atualizarMetricas() {
    document.getElementById('metricTotalAlunos').innerText = CACHE_ALUNOS.length;
    document.getElementById('metricTotalTurmas').innerText = CACHE_TURMAS.length;

    let totalXP = 0;
    let somaNiveis = 0;

    CACHE_ALUNOS.forEach(a => {
        const xp = Number(a.xp) || 0;
        totalXP += xp;
        somaNiveis += API.calcularNivel(xp).nivel;
    });

    document.getElementById('metricTotalXP').innerText = totalXP.toLocaleString();
    document.getElementById('metricMediaNivel').innerText = CACHE_ALUNOS.length ? (somaNiveis / CACHE_ALUNOS.length).toFixed(1) : "0";
}

function atualizarSelectsTurmas() {
    const selects = ['filtroTurmaAluno', 'selectTurmaLote', 'selectTurmaWp', 'alunoTurma'];

    selects.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        const valAtual = el.value;
        if (id === 'filtroTurmaAluno') {
            el.innerHTML = '<option value="">Todas as Turmas</option>';
        } else if (id === 'alunoTurma') {
            el.innerHTML = '<option value="" disabled selected>Selecione a turma...</option>';
        } else {
            el.innerHTML = '<option value="">Selecione...</option>';
        }

        CACHE_TURMAS.forEach(t => {
            const nome = t.nome || t.Nome;
            el.innerHTML += `<option value="${nome}">${nome}</option>`;
        });

        el.value = valAtual;
    });
}

function renderizarTurmas() {
    const tbody = document.getElementById('tabelaTurmas');
    if (!CACHE_TURMAS || CACHE_TURMAS.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" class="text-center py-4 text-muted">Nenhuma turma cadastrada.</td></tr>`;
        return;
    }

    tbody.innerHTML = CACHE_TURMAS.map(t => `
        <tr>
            <td class="fw-bold text-light">${t.nome || t.Nome}</td>
            <td class="text-muted font-monospace">#${t.id || t.ID}</td>
        </tr>
    `).join('');
}

function renderizarTabelaAlunos() {
    const tbody = document.getElementById('tabelaAlunos');
    const termoBusca = (document.getElementById('buscaAluno')?.value || '').toLowerCase();
    const filtroTurma = document.getElementById('filtroTurmaAluno')?.value;

    let filtrados = CACHE_ALUNOS.filter(a => {
        const nome = (a.nome || a.Nome || '').toLowerCase();
        const turma = a.turma || a.Turma;
        const bateNome = nome.includes(termoBusca);
        const bateTurma = !filtroTurma || turma === filtroTurma;
        return bateNome && bateTurma;
    });

    if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Nenhum aluno encontrado.</td></tr>`;
        return;
    }

    filtrados.sort((a, b) => (Number(b.xp) || 0) - (Number(a.xp) || 0));

    tbody.innerHTML = filtrados.map(aluno => {
        const id = aluno.id || aluno.ID;
        const nome = aluno.nome || aluno.Nome;
        const turma = aluno.turma || aluno.Turma;
        const xp = Number(aluno.xp || aluno.XP) || 0;
        const info = API.calcularNivel(xp);

        return `
            <tr>
                <td>
                    <div class="fw-bold text-light">${nome}</div>
                    <small class="text-muted">ID: #${id}</small>
                </td>
                <td><span class="badge bg-dark border border-secondary">${turma}</span></td>
                <td>
                    <span class="badge badge-level">Nível ${info.nivel}</span>
                    <div class="small text-warning mt-1">${info.titulo}</div>
                </td>
                <td style="min-width: 150px;">
                    <div class="d-flex justify-content-between small mb-1">
                        <span class="text-success fw-bold">${xp} XP</span>
                        <span class="text-muted">${info.porcentagem}%</span>
                    </div>
                    <div class="progress bg-black border border-secondary" style="height: 6px;">
                        <div class="progress-bar bg-warning" style="width: ${info.porcentagem}%"></div>
                    </div>
                </td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-info" onclick="verDetalhesAluno('${id}')"><i class="fa-solid fa-eye me-1"></i>Histórico</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function verDetalhesAluno(id) {
    const aluno = CACHE_ALUNOS.find(a => String(a.id || a.ID) === String(id));
    if (!aluno) return;

    const historico = await API.getLancamentosPorAluno(id);
    const xp = Number(aluno.xp || aluno.XP) || 0;
    const info = API.calcularNivel(xp);

    document.getElementById('modalDetalhesNome').innerText = (aluno.nome || aluno.Nome) + " (" + (aluno.turma || aluno.Turma) + ")";
    document.getElementById('detalheNivel').innerText = info.nivel;
    document.getElementById('detalheTitulo').innerText = info.titulo;
    document.getElementById('detalheXP').innerText = xp + " XP";

    const tbody = document.getElementById('detalhesHistorico');
    if (!historico || historico.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-3">Sem registros de XP.</td></tr>`;
    } else {
        tbody.innerHTML = historico.map(h => `
            <tr>
                <td>${h.data || h.Data}</td>
                <td class="text-success">+${h.atividade || 0}</td>
                <td class="text-success">+${h.equipe || 0}</td>
                <td class="text-success">+${h.comportamento || 0}</td>
                <td class="text-success">+${h.participacao || 0}</td>
                <td class="fw-bold text-warning">+${(Number(h.atividade)||0)+(Number(h.equipe)||0)+(Number(h.comportamento)||0)+(Number(h.participacao)||0)}</td>
                <td class="small text-muted">${h.observacao || '-'}</td>
            </tr>
        `).join('');
    }

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDetalhesAluno')).show();
}

function carregarAlunosParaLote() {
    const turma = document.getElementById('selectTurmaLote').value;
    const tbody = document.getElementById('tabelaLote');
    const btn = document.getElementById('btnSalvarLote');

    if (!turma) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Selecione uma turma acima.</td></tr>`;
        btn.disabled = true;
        return;
    }

    const alunos = CACHE_ALUNOS.filter(a => (a.turma || a.Turma) === turma);

    if (alunos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Nenhum aluno nesta turma.</td></tr>`;
        btn.disabled = true;
        return;
    }

    tbody.innerHTML = alunos.map(aluno => `
        <tr>
            <td class="fw-bold align-middle">${aluno.nome || aluno.Nome}<input type="hidden" name="alunoId[]" value="${aluno.id || aluno.ID}"></td>
            <td><input type="number" name="atividade[]" class="form-control form-control-sm bg-black text-white border-secondary text-center" value="0" min="0"></td>
            <td><input type="number" name="equipe[]" class="form-control form-control-sm bg-black text-white border-secondary text-center" value="0" min="0"></td>
            <td><input type="number" name="comportamento[]" class="form-control form-control-sm bg-black text-white border-secondary text-center" value="0" min="0"></td>
            <td><input type="number" name="participacao[]" class="form-control form-control-sm bg-black text-white border-secondary text-center" value="0" min="0"></td>
            <td><input type="text" name="observacao[]" class="form-control form-control-sm bg-black text-white border-secondary" placeholder="Obs..."></td>
        </tr>
    `).join('');

    btn.disabled = false;
}

async function salvarLoteXP(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSalvarLote');
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-2"></i>Enviando...`;
    btn.disabled = true;

    const form = document.getElementById('formLote');
    const ids = Array.from(form.querySelectorAll('input[name="alunoId[]"]')).map(i => i.value);
    const atvs = Array.from(form.querySelectorAll('input[name="atividade[]"]')).map(i => i.value);
    const eqps = Array.from(form.querySelectorAll('input[name="equipe[]"]')).map(i => i.value);
    const comps = Array.from(form.querySelectorAll('input[name="comportamento[]"]')).map(i => i.value);
    const parts = Array.from(form.querySelectorAll('input[name="participacao[]"]')).map(i => i.value);
    const obss = Array.from(form.querySelectorAll('input[name="observacao[]"]')).map(i => i.value);

    for (let i = 0; i < ids.length; i++) {
        if (Number(atvs[i]) > 0 || Number(eqps[i]) > 0 || Number(comps[i]) > 0 || Number(parts[i]) > 0 || obss[i].trim() !== '') {
            await API.adicionarLancamento({
                alunoId: ids[i],
                data: new Date().toLocaleDateString('pt-BR'),
                atividade: atvs[i],
                equipe: eqps[i],
                comportamento: comps[i],
                participacao: parts[i],
                observacao: obss[i]
            });
        }
    }

    btn.innerHTML = `<i class="fa-solid fa-floppy-disk me-2"></i>Salvar Pontuações`;
    alert("Pontuações registradas com sucesso!");
    await carregarDadosIniciais();
    carregarAlunosParaLote();
}

function gerarLinksWhatsAppTurma() {
    const turma = document.getElementById('selectTurmaWp').value;
    const container = document.getElementById('containerLinksWp');

    if (!turma) {
        container.innerHTML = `<div class="text-center text-muted py-4">Selecione uma turma acima.</div>`;
        return;
    }

    const alunos = CACHE_ALUNOS.filter(a => (a.turma || a.Turma) === turma);
    const baseUrl = window.location.origin + window.location.pathname.replace('professor.html', 'aluno.html');

    container.innerHTML = alunos.map(a => {
        const link = `${baseUrl}?id=${a.id || a.ID}`;
        const msg = encodeURIComponent(`Olá ${a.nome || a.Nome}! Veja seu progresso no JonasXP: ${link}`);
        return `
            <div class="p-3 bg-black border border-secondary rounded d-flex justify-content-between align-items-center">
                <div>
                    <div class="fw-bold text-white">${a.nome || a.Nome}</div>
                    <small class="text-muted">${link}</small>
                </div>
                <a href="https://api.whatsapp.com/send?text=${msg}" target="_blank" class="btn btn-sm btn-success fw-bold">
                    <i class="fa-brands fa-whatsapp me-1"></i>Enviar
                </a>
            </div>
        `;
    }).join('');
}