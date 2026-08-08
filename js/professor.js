// js/professor.js - Atualizado com QR Code e Copiar Link

let CACHE_ALUNOS = [];
let CACHE_TURMAS = [];

document.addEventListener('DOMContentLoaded', () => {
    configurarEventos();
    carregarDadosIniciais();
});

function configurarEventos() {
    document.getElementById('btnAbrirModalTurma')?.addEventListener('click', () => {
        document.getElementById('turmaNome').value = '';
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalTurma')).show();
    });

    document.getElementById('btnAbrirModalAluno')?.addEventListener('click', () => {
        document.getElementById('alunoNome').value = '';
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalAluno')).show();
    });

    document.getElementById('formTurma')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (document.activeElement) document.activeElement.blur();
        await API.salvarTurma(document.getElementById('turmaNome').value);
        bootstrap.Modal.getInstance(document.getElementById('modalTurma'))?.hide();
        carregarDadosIniciais();
    });

    document.getElementById('formAluno')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (document.activeElement) document.activeElement.blur();
        await API.salvarAluno(document.getElementById('alunoNome').value, document.getElementById('alunoTurma').value);
        bootstrap.Modal.getInstance(document.getElementById('modalAluno'))?.hide();
        carregarDadosIniciais();
    });

    document.getElementById('buscaAluno')?.addEventListener('input', renderizarTabelaAlunos);
    document.getElementById('filtroTurmaAluno')?.addEventListener('change', renderizarTabelaAlunos);
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
        const xp = Number(a.xp || a.XP) || 0;
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
        el.innerHTML = (id === 'filtroTurmaAluno') ? '<option value="">Todas as Turmas</option>' : '<option value="">Selecione...</option>';

        CACHE_TURMAS.forEach(t => {
            const nome = t.nome || t.Nome;
            el.innerHTML += `<option value="${nome}">${nome}</option>`;
        });
        el.value = valAtual;
    });
}

function renderizarTurmas() {
    const tbody = document.getElementById('tabelaTurmas');
    tbody.innerHTML = CACHE_TURMAS.map(t => `
        <tr><td class="fw-bold">${t.nome || t.Nome}</td><td class="text-muted font-monospace">#${t.id || t.ID}</td></tr>
    `).join('');
}

function renderizarTabelaAlunos() {
    const tbody = document.getElementById('tabelaAlunos');
    const termoBusca = (document.getElementById('buscaAluno')?.value || '').toLowerCase();
    const filtroTurma = document.getElementById('filtroTurmaAluno')?.value;

    let filtrados = CACHE_ALUNOS.filter(a => {
        const nome = (a.nome || a.Nome || '').toLowerCase();
        const turma = a.turma || a.Turma;
        return nome.includes(termoBusca) && (!filtroTurma || turma === filtroTurma);
    });

    filtrados.sort((a, b) => (Number(b.xp || b.XP) || 0) - (Number(a.xp || a.XP) || 0));

    tbody.innerHTML = filtrados.map(aluno => {
        const id = aluno.id || aluno.ID;
        const nome = aluno.nome || aluno.Nome;
        const turma = aluno.turma || aluno.Turma;
        const xp = Number(aluno.xp || aluno.XP) || 0;
        const info = API.calcularNivel(xp);

        return `
            <tr>
                <td><div class="fw-bold">${nome}</div><small class="text-muted">ID: #${id}</small></td>
                <td><span class="badge bg-dark border border-secondary">${turma}</span></td>
                <td><span class="badge badge-level">Nível ${info.nivel}</span><div class="small text-warning mt-1">${info.titulo}</div></td>
                <td><span class="text-success fw-bold">${xp} XP</span></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-info" onclick="verDetalhesAluno('${id}')"><i class="fa-solid fa-eye me-1"></i>Ver</button>
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

    document.getElementById('modalDetalhesNome').innerText = (aluno.nome || aluno.Nome);
    document.getElementById('detalheNivel').innerText = info.nivel;
    document.getElementById('detalheTitulo').innerText = info.titulo;
    document.getElementById('detalheXP').innerText = xp + " XP";

    const tbody = document.getElementById('detalhesHistorico');
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

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDetalhesAluno')).show();
}

function carregarAlunosParaLote() {
    const turma = document.getElementById('selectTurmaLote').value;
    const tbody = document.getElementById('tabelaLote');
    const btn = document.getElementById('btnSalvarLote');

    if (!turma) { tbody.innerHTML = ''; btn.disabled = true; return; }

    const alunos = CACHE_ALUNOS.filter(a => (a.turma || a.Turma) === turma);
    tbody.innerHTML = alunos.map(aluno => `
        <tr>
            <td class="fw-bold">${aluno.nome || aluno.Nome}<input type="hidden" name="alunoId[]" value="${aluno.id || aluno.ID}"></td>
            <td><input type="number" name="atividade[]" class="form-control form-control-sm bg-black text-white text-center" value="0"></td>
            <td><input type="number" name="equipe[]" class="form-control form-control-sm bg-black text-white text-center" value="0"></td>
            <td><input type="number" name="comportamento[]" class="form-control form-control-sm bg-black text-white text-center" value="0"></td>
            <td><input type="number" name="participacao[]" class="form-control form-control-sm bg-black text-white text-center" value="0"></td>
            <td><input type="text" name="observacao[]" class="form-control form-control-sm bg-black text-white" placeholder="Obs..."></td>
        </tr>
    `).join('');
    btn.disabled = false;
}

async function salvarLoteXP(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSalvarLote');
    btn.innerText = "Salvando...";
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

    btn.innerText = "Salvar Pontuações";
    alert("XP atualizado!");
    await carregarDadosIniciais();
    carregarAlunosParaLote();
}

function gerarLinksWhatsAppTurma() {
    const turma = document.getElementById('selectTurmaWp').value;
    const container = document.getElementById('containerLinksWp');

    if (!turma) { container.innerHTML = ''; return; }

    const alunos = CACHE_ALUNOS.filter(a => (a.turma || a.Turma) === turma);
    const baseUrl = window.location.origin + window.location.pathname.replace('professor.html', 'aluno.html');

    container.innerHTML = alunos.map(a => {
        const id = a.id || a.ID;
        const nome = a.nome || a.Nome;
        const link = `${baseUrl}?id=${id}`;
        const msg = encodeURIComponent(`Olá ${nome}! Seu acesso ao JonasXP: ${link}`);

        return `
            <div class="p-3 bg-black border border-secondary rounded d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                    <div class="fw-bold text-white">${nome}</div>
                    <small class="text-info">${link}</small>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-light" onclick="copiarLink('${link}')"><i class="fa-solid fa-copy me-1"></i>Copiar Link</button>
                    <button class="btn btn-sm btn-outline-warning" onclick="abrirQRCode('${nome}', '${link}')"><i class="fa-solid fa-qrcode me-1"></i>QR Code</button>
                    <a href="https://api.whatsapp.com/send?text=${msg}" target="_blank" class="btn btn-sm btn-success fw-bold"><i class="fa-brands fa-whatsapp me-1"></i>WhatsApp</a>
                </div>
            </div>
        `;
    }).join('');
}

function copiarLink(link) {
    navigator.clipboard.writeText(link);
    alert("Link copiado para a área de transferência!");
}

function abrirQRCode(nome, link) {
    document.getElementById('qrModalNome').innerText = `QR Code: ${nome}`;
    document.getElementById('txtLinkQR').innerText = link;
    document.getElementById('imgQRCode').src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(link)}`;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalQRCode')).show();
}