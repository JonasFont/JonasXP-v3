// js/professor.js - Controle Completo do Painel do Professor JonasXP

let CACHE_ALUNOS = [];
let CACHE_TURMAS = [];

document.addEventListener('DOMContentLoaded', async () => {
    await carregarDadosIniciais();
    configurarEventos();
});

// 1. Carregamento Inicial do Banco de Dados
async function carregarDadosIniciais() {
    exibirStatusCarregando(true);
    try {
        // Carrega turmas e alunos em paralelo
        const [turmas, alunos] = await Promise.all([
            API.getTurmas(),
            API.getAlunos()
        ]);

        CACHE_TURMAS = turmas;
        CACHE_ALUNOS = alunos;

        preencherSelectTurmas();
        renderizarTabelaAlunos(CACHE_ALUNOS);
        
    } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
        mostrarAlerta("Erro ao conectar com o banco de dados. Atualize a página.", "danger");
    } finally {
        exibirStatusCarregando(false);
    }
}

// 2. Preenche os Menus Suspensos (Dropdowns) de Turma sem 'undefined'
function preencherSelectTurmas() {
    const selects = [
        document.getElementById('selectTurmaFiltro'),
        document.getElementById('selectTurmaLancamento'),
        document.getElementById('selectTurmaWp')
    ];

    selects.forEach(select => {
        if (!select) return;
        const valorAtual = select.value;
        
        // Mantém a opção padrão (Ex: "Todas as Turmas")
        const primeiraOpcao = select.options[0] ? select.options[0].outerHTML : '<option value="">Selecione a Turma</option>';
        
        select.innerHTML = primeiraOpcao + CACHE_TURMAS.map(t => `<option value="${t}">${t}</option>`).join('');
        select.value = valorAtual;
    });
}

// 3. Renderiza a Tabela Principal de Alunos e XP
function renderizarTabelaAlunos(listaAlunos) {
    const tbody = document.getElementById('tabelaAlunos');
    if (!tbody) return;

    if (!listaAlunos || listaAlunos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Nenhum aluno localizado.</td></tr>`;
        return;
    }

    tbody.innerHTML = listaAlunos.map(aluno => {
        const id = String(aluno.id || aluno.ID || '').replace(/['"\s]/g, '');
        const nome = aluno.nome || aluno.Nome || 'Sem nome';
        const turma = aluno.turma || aluno.Turma || aluno.TURMA || aluno.curso || aluno.Curso || 'Geral';
        const xp = Number(aluno.xp || aluno.XP) || 0;
        const infoNivel = API.calcularNivel(xp);

        return `
            <tr>
                <td class="fw-bold">#${id}</td>
                <td class="fw-bold text-white">${nome}</td>
                <td><span class="badge bg-secondary">${turma}</span></td>
                <td>
                    <span class="badge bg-warning text-dark me-1">Nível ${infoNivel.nivel}</span>
                    <small class="text-muted">${infoNivel.titulo}</small>
                </td>
                <td class="fw-bold text-success">+${xp.toLocaleString()} XP</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="abrirModalLancamentoUnico('${id}', '${nome}')">
                        <i class="fa-solid fa-plus me-1"></i>XP
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="verHistoricoAluno('${id}', '${nome}')">
                        <i class="fa-solid fa-clock-rotate-left"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// 4. Filtro de Alunos por Nome e Turma
function configurarEventos() {
    const inputBusca = document.getElementById('inputBuscaAluno');
    const selectFiltro = document.getElementById('selectTurmaFiltro');
    const selectTurmaWp = document.getElementById('selectTurmaWp');

    if (inputBusca) inputBusca.addEventListener('input', filtrarAlunos);
    if (selectFiltro) selectFiltro.addEventListener('change', filtrarAlunos);
    if (selectTurmaWp) selectTurmaWp.addEventListener('change', gerarLinksWhatsAppTurma);

    const formLancamento = document.getElementById('formLancamentoXP');
    if (formLancamento) {
        formLancamento.addEventListener('submit', processarLancamentoXP);
    }
}

function filtrarAlunos() {
    const termo = (document.getElementById('inputBuscaAluno')?.value || '').toLowerCase();
    const turmaSel = document.getElementById('selectTurmaFiltro')?.value || '';

    const filtrados = CACHE_ALUNOS.filter(aluno => {
        const nome = (aluno.nome || aluno.Nome || '').toLowerCase();
        const turma = aluno.turma || aluno.Turma || aluno.TURMA || aluno.curso || aluno.Curso || '';
        
        const bateNome = nome.includes(termo);
        const bateTurma = !turmaSel || turma === turmaSel;

        return bateNome && bateTurma;
    });

    renderizarTabelaAlunos(filtrados);
}

// 5. Geração dos Links do WhatsApp e Acessos
function gerarLinksWhatsAppTurma() {
    const turma = document.getElementById('selectTurmaWp')?.value;
    const container = document.getElementById('containerLinksWp');

    if (!container) return;
    if (!turma) { container.innerHTML = ''; return; }

    const alunosTurma = CACHE_ALUNOS.filter(a => {
        const t = a.turma || a.Turma || a.TURMA || a.curso || a.Curso || '';
        return t === turma;
    });

    if (alunosTurma.length === 0) {
        container.innerHTML = `<div class="alert alert-warning text-center">Nenhum aluno encontrado para a turma selecionada.</div>`;
        return;
    }

    // Pega o caminho base dinâmico onde o sistema está hospedado
    const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/')) + '/aluno.html';

    container.innerHTML = alunosTurma.map(a => {
        const id = String(a.id || a.ID).replace(/['"\s]/g, '');
        const nome = a.nome || a.Nome;
        const link = `${baseUrl}?id=${id}`;
        const msg = encodeURIComponent(`Olá ${nome}! Confira o seu progresso e conquistas no JonasXP: ${link}`);

        return `
            <div class="p-3 bg-black border border-secondary rounded d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                <div>
                    <div class="fw-bold text-white">${nome}</div>
                    <small class="text-info">${link}</small>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-light" onclick="copiarLink('${link}')">
                        <i class="fa-solid fa-copy me-1"></i>Copiar Link
                    </button>
                    <button class="btn btn-sm btn-outline-warning" onclick="abrirQRCode('${nome}', '${link}')">
                        <i class="fa-solid fa-qrcode me-1"></i>QR Code
                    </button>
                    <a href="https://api.whatsapp.com/send?text=${msg}" target="_blank" class="btn btn-sm btn-success fw-bold">
                        <i class="fa-brands fa-whatsapp me-1"></i>WhatsApp
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

// 6. Gerador Local de QR Code via Canvas/JS
function abrirQRCode(nome, link) {
    const title = document.getElementById('qrModalNome');
    const textLink = document.getElementById('txtLinkQR');
    const qrContainer = document.getElementById('qrcodeCanvas');

    if (title) title.innerText = `QR Code: ${nome}`;
    if (textLink) textLink.innerText = link;

    if (qrContainer) {
        qrContainer.innerHTML = ''; // Limpa QR Code anterior

        // Renderiza via qrcode.min.js sem depender de servidor externo
        new QRCode(qrContainer, {
            text: link,
            width: 220,
            height: 220,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    const modalEl = document.getElementById('modalQRCode');
    if (modalEl) {
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }
}

// 7. Envio de Lançamentos de XP para a Planilha
async function processarLancamentoXP(event) {
    event.preventDefault();

    const idAluno = document.getElementById('selectAlunoLancamento')?.value;
    const atividade = Number(document.getElementById('xpAtividade')?.value) || 0;
    const equipe = Number(document.getElementById('xpEquipe')?.value) || 0;
    const comportamento = Number(document.getElementById('xpComportamento')?.value) || 0;
    const participacao = Number(document.getElementById('xpParticipacao')?.value) || 0;
    const observacao = document.getElementById('txtObservacao')?.value || '';

    if (!idAluno) {
        mostrarAlerta("Selecione um aluno para lançar XP.", "warning");
        return;
    }

    const payload = {
        alunoId: idAluno,
        atividade: atividade,
        equipe: equipe,
        comportamento: comportamento,
        participacao: participacao,
        observacao: observacao,
        data: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    try {
        mostrarAlerta("Salvando lançamento...", "info");
        await API.salvarLancamento(payload);
        
        mostrarAlerta("XP lançado com sucesso!", "success");
        document.getElementById('formLancamentoXP').reset();
        
        // Atualiza a tabela
        await carregarDadosIniciais();

    } catch (err) {
        console.error("Erro ao salvar:", err);
        mostrarAlerta("Ocorreu um erro ao salvar o XP.", "danger");
    }
}

// Auxiliares
function copiarLink(link) {
    navigator.clipboard.writeText(link);
    mostrarAlerta("Link copiado para a área de transferência!", "success");
}

function exibirStatusCarregando(ativo) {
    const spinner = document.getElementById('spinnerCarregando');
    if (spinner) spinner.style.display = ativo ? 'block' : 'none';
}

function mostrarAlerta(mensagem, tipo) {
    const alertBox = document.getElementById('alertaNotificacao');
    if (alertBox) {
        alertBox.className = `alert alert-${tipo} alert-dismissible fade show`;
        alertBox.innerHTML = `${mensagem} <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
        alertBox.style.display = 'block';
        setTimeout(() => { alertBox.style.display = 'none'; }, 4000);
    }
}