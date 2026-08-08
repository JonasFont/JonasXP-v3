// js/professor.js - Sistema JonasXP V3

document.addEventListener('DOMContentLoaded', () => {
    carregarDadosIniciais();
});

// CARREGAMENTO INICIAL E MÉTRICAS
function carregarDadosIniciais() {
    renderizarTurmas();
    renderizarTabelaAlunos();
    atualizarSelectsTurmas();
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

// 1. TABELA DE ALUNOS & RANKING
function renderizarTabelaAlunos() {
    const tbody = document.getElementById('tabelaAlunos');
    const filtro = document.getElementById('filtroTurmaAluno').value;
    let alunos = API.getAlunos();

    if (filtro) {
        alunos = alunos.filter(a => a.turma === filtro);
    }

    if (alunos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Nenhum aluno encontrado.</td></tr>`;
        return;
    }

    // Ordenar por XP (Ranking)
    alunos.sort((a, b) => API.getAlunoXP(b.id) - API.getAlunoXP(a.id));

    tbody.innerHTML = alunos.map(aluno => {
        const xp = API.getAlunoXP(aluno.id);
        const nivelInfo = API.calcularNivel(xp);

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
                    <button class="btn btn-sm btn-outline-info me-1" onclick="verDetalhesAluno(${aluno.id})" title="Ver Historico"><i class="fa-solid fa-eye"></i></button>
                    <button class="btn btn-sm btn-outline-warning me-1" onclick="abrirQRModal(${aluno.id})" title="QR Code"><i class="fa-solid fa-qrcode"></i></button>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editarAluno(${aluno.id})"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="excluirAluno(${aluno.id})"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

// 2. LANÇAMENTO EM LOTE (OBSERVAÇÃO AMPLIADA + COMPORTAMENTO)
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
            <!-- ATITUDE FOI ALTERADA PARA COMPORTAMENTO -->
            <td><input type="number" name="comportamento[]" class="form-control form-control-sm bg-black text-light border-secondary text-center" value="0" min="0"></td>
            <td><input type="number" name="participacao[]" class="form-control form-control-sm bg-black text-light border-secondary text-center" value="0" min="0"></td>
            <!-- CAIXA DE OBSERVAÇÃO AMPLIADA PARA 2 LINHAS POR LINHA DA TABELA -->
            <td>
                <textarea name="observacao[]" class="form-control form-control-sm bg-black text-light border-secondary" rows="2" placeholder="Escreva observações pedagógicas ou de comportamento..."></textarea>
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
                comportamento: comp, // Atualizado para o novo campo
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

// 3. GERADOR DE LINKS WHATSAPP EM MASSA POR TURMA
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
            <div class="p-3 bg-black border border-secondary rounded d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
                <div>
                    <div class="fw-bold text-light">${aluno.nome}</div>
                    <div class="small font-mono text-info">${link}</div>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-secondary" onclick="navigator.clipboard.writeText('${mensagemPronta.replace(/'/g, "\\'")}'); alert('Mensagem copiada!')">
                        <i class="fa-regular fa-copy me-1"></i>Copiar
                    </button>
                    <a href="${urlWp}" target="_blank" class="btn btn-sm btn-success fw-bold">
                        <i class="fa-brands fa-whatsapp me-1"></i>Enviar WhatsApp
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

function copiarTodosLinksTurma() {
    const turma = document.getElementById('selectTurmaWp').value;
    if (!turma) {
        alert('Selecione uma turma primeiro!');
        return;
    }

    const alunos = API.getAlunos().filter(a => a.turma === turma);
    const template = document.getElementById('msgWpTemplate').value;
    const baseUrl = window.location.origin + window.location.pathname.replace('professor.html', 'aluno.html');

    let textoFinal = `*LINKS DE ACESSO - TURMA ${turma.toUpperCase()}*\n\n`;

    alunos.forEach((aluno, i) => {
        const link = `${baseUrl}?id=${aluno.id}`;
        const msg = template.replace(/{nome}/g, aluno.nome).replace(/{link}/g, link);
        textoFinal += `[${i + 1}] ${aluno.nome}\n${msg}\n\n`;
    });

    navigator.clipboard.writeText(textoFinal);
    alert(`Links de todos os ${alunos.length} alunos copiados para a área de transferência!`);
}

// 4. DETALHES DO ALUNO E HISTÓRICO
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
    document.getElementById('detalheProximoNivel').innerText = `Faltam ${nivelInfo.xpRestante} XP para o Nível ${nivelInfo.nivel + 1}`;

    const tbody = document.getElementById('detalhesHistorico');
    if (historico.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Nenhum lançamento registrado.</td></tr>`;
    } else {
        tbody.innerHTML = historico.map(h => `
            <tr>
                <td>${h.data}</td>
                <td class="text-success">+${h.atividade || 0}</td>
                <td class="text-success">+${h.equipe || 0}</td>
                <td class="text-success">+${h.comportamento || h.atitude || 0}</td>
                <td class="text-success">+${h.participacao || 0}</td>
                <td class="fw-bold text-warning">+${(h.atividade || 0) + (h.equipe || 0) + (h.comportamento || h.atitude || 0) + (h.participacao || 0)}</td>
                <td class="small text-muted">${h.observacao || '-'}</td>
            </tr>
        `).join('');
    }

    new bootstrap.Modal(document.getElementById('modalDetalhesAluno')).show();
}

// 5. QR CODE & MODAL DE LINKS
function abrirQRModal(id) {
    const aluno = API.getAlunoPorId(id);
    if (!aluno) return;

    const baseUrl = window.location.origin + window.location.pathname.replace('professor.html', 'aluno.html');
    const link = `${baseUrl}?id=${aluno.id}`;

    document.getElementById('modalQRTitulo').innerText = `QR Code - ${aluno.nome}`;

    const qrDiv = document.getElementById('qrcode');
    qrDiv.innerHTML = '';

    const typeNumber = 4;
    const errorCorrectionLevel = 'L';
    const qr = qrcode(typeNumber, errorCorrectionLevel);
    qr.addData(link);
    qr.make();
    qrDiv.innerHTML = qr.createImgTag(5);

    const btnCopiar = document.getElementById('btnCopiarModal');
    btnCopiar.onclick = () => {
        navigator.clipboard.writeText(link);
        alert('Link de acesso copiado!');
    };

    new bootstrap.Modal(document.getElementById('modalQR')).show();
}

// CRACHÁS PARA IMPRESSÃO
function gerarCrachasTurma() {
    const turma = document.getElementById('selectTurmaCracha').value;
    const container = document.getElementById('containerCrachas');

    if (!turma) {
        container.innerHTML = `<div class="text-center text-muted no-print py-5">Selecione uma turma para carregar os crachás com QR Code.</div>`;
        return;
    }

    const alunos = API.getAlunos().filter(a => a.turma === turma);
    const baseUrl = window.location.origin + window.location.pathname.replace('professor.html', 'aluno.html');

    if (alunos.length === 0) {
        container.innerHTML = `<div class="text-center text-muted no-print py-5">Nenhum aluno cadastrado nesta turma.</div>`;
        return;
    }

    container.innerHTML = alunos.map(aluno => {
        const link = `${baseUrl}?id=${aluno.id}`;
        const qr = qrcode(4, 'L');
        qr.addData(link);
        qr.make();
        const imgTag = qr.createImgTag(4);

        return `
            <div class="col-md-4 col-sm-6">
                <div class="cracha-card p-3 text-center shadow-sm">
                    <div class="fw-bold text-uppercase text-primary small">JONAS XP - CARTÃO DE ACESSO</div>
                    <hr class="my-2 border-secondary">
                    <h5 class="fw-bold mb-1">${aluno.nome}</h5>
                    <span class="badge bg-secondary mb-2">${aluno.turma}</span>
                    <div class="p-2 bg-white rounded d-inline-block my-2">${imgTag}</div>
                    <div class="text-muted font-mono" style="font-size: 10px;">Aponte a câmera para ver seu XP</div>
                </div>
            </div>
        `;
    }).join('');
}

// TURMAS E ALUNOS (CRUD)
// CORREÇÃO: Garante que turmas seja sempre um Array antes de chamar o .map()
function renderizarTurmas() {
    const tbody = document.getElementById('tabelaTurmas');
    let turmas = API.getTurmas();

    // Proteção contra valores nulos/indefinidos
    if (!Array.isArray(turmas)) {
        turmas = [];
    }

    if (turmas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" class="text-center py-4 text-muted">Nenhuma turma cadastrada.</td></tr>`;
        return;
    }

    tbody.innerHTML = turmas.map(t => `
        <tr>
            <td class="fw-bold text-light">${t.nome}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-danger" onclick="excluirTurma(${t.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function atualizarSelectsTurmas() {
    let turmas = API.getTurmas();
    
    // Proteção contra valores nulos/indefinidos
    if (!Array.isArray(turmas)) {
        turmas = [];
    }

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
function modalNovaTurma() {
    document.getElementById('turmaId').value = '';
    document.getElementById('turmaNome').value = '';
    new bootstrap.Modal(document.getElementById('modalTurma')).show();
}

function salvarTurma(e) {
    e.preventDefault();
    const nome = document.getElementById('turmaNome').value;
    API.salvarTurma({ nome });
    bootstrap.Modal.getInstance(document.getElementById('modalTurma')).hide();
    carregarDadosIniciais();
}

function excluirTurma(id) {
    if (confirm("Remover esta turma?")) {
        API.excluirTurma(id);
        carregarDadosIniciais();
    }
}

function modalNovoAluno() {
    document.getElementById('alunoId').value = '';
    document.getElementById('alunoNome').value = '';
    new bootstrap.Modal(document.getElementById('modalAluno')).show();
}

function salvarAluno(e) {
    e.preventDefault();
    const id = document.getElementById('alunoId').value;
    const nome = document.getElementById('alunoNome').value;
    const turma = document.getElementById('alunoTurma').value;

    API.salvarAluno({ id: id ? Number(id) : null, nome, turma });
    bootstrap.Modal.getInstance(document.getElementById('modalAluno')).hide();
    carregarDadosIniciais();
}

function editarAluno(id) {
    const aluno = API.getAlunoPorId(id);
    if (!aluno) return;

    document.getElementById('alunoId').value = aluno.id;
    document.getElementById('alunoNome').value = aluno.nome;
    document.getElementById('alunoTurma').value = aluno.turma;
    new bootstrap.Modal(document.getElementById('modalAluno')).show();
}

function excluirAluno(id) {
    if (confirm("Deseja realmente excluir este aluno?")) {
        API.excluirAluno(id);
        carregarDadosIniciais();
    }
}