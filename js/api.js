// js/api.js - Módulo de Comunicação com Google Apps Script

const API_CONFIG = {
    // Apenas UMA url válida aqui:
    URL: "https://script.google.com/macros/s/AKfycbxQRPMgyh5MgfpucbkbaOZBZjx9QxWCFxjx6kWwDftcdRnDQh5wM2qjp_ORUaUGLBQM/exec",
    TIMEOUT: 15000,
    DEBUG: true
};
async function fetchComTimeout(resource, options = {}) {
    const { timeout = API_CONFIG.TIMEOUT } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(resource, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

const API = {
    async getAlunos() {
        try {
            const res = await fetchComTimeout(`${API_CONFIG.URL}?acao=getAlunos`);
            return await res.json();
        } catch (e) {
            console.error("Erro ao carregar alunos:", e);
            return [];
        }
    },

    async getTurmas() {
        try {
            const res = await fetchComTimeout(`${API_CONFIG.URL}?acao=getTurmas`);
            return await res.json();
        } catch (e) {
            console.error("Erro ao carregar turmas:", e);
            return [];
        }
    },

    async getAlunoPorId(idAluno) {
        const url = `${API_CONFIG.URL}?acao=getAluno&id=${encodeURIComponent(idAluno)}`;
        const res = await fetchComTimeout(url);
        return await res.json();
    },

    async getLancamentosPorAluno(idAluno) {
        try {
            const url = `${API_CONFIG.URL}?acao=getHistorico&id=${encodeURIComponent(idAluno)}`;
            const res = await fetchComTimeout(url);
            const dados = await res.json();
            return Array.isArray(dados) ? dados : [];
        } catch (e) {
            console.error("Erro ao buscar histórico:", e);
            return [];
        }
    },

    async salvarLancamento(payload) {
        const params = new URLSearchParams();
        params.append('acao', 'salvarLancamento');
        params.append('dados', JSON.stringify(payload));

        const res = await fetchComTimeout(API_CONFIG.URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });
        return await res.json();
    },

    // Dentro do objeto API em js/api.js:
    calcularNivel: function(xp) {
        const pontos = Number(xp) || 0;

        // Sistema de Níveis & Auras estilo Anime (Ajuste os valores de XP se preferir)
        if (pontos >= 2000) {
            return { nivel: 6, titulo: "Kage / Aura Divina SSJ", cor: "#ff0055", icone: "🌌", porcentagem: 100 };
        }
        if (pontos >= 1200) {
            return { nivel: 5, titulo: "Proton / Aura Dourada", cor: "#ffaa00", icone: "🔥", porcentagem: Math.min(100, ((pontos - 1200) / 800) * 100) };
        }
        if (pontos >= 700) {
            return { nivel: 4, titulo: "Caçador / Aura Roxa", cor: "#9d00ff", icone: "⚡", porcentagem: Math.min(100, ((pontos - 700) / 500) * 100) };
        }
        if (pontos >= 350) {
            return { nivel: 3, titulo: "Chunin / Aura Azul", cor: "#00d4ff", icone: "🌊", porcentagem: Math.min(100, ((pontos - 350) / 350) * 100) };
        }
        if (pontos >= 150) {
            return { nivel: 2, titulo: "Recruta / Aura Verde", cor: "#00ff66", icone: "🍃", porcentagem: Math.min(100, ((pontos - 150) / 200) * 100) };
        }

        // Nível 1 - Inicial
        return { nivel: 1, titulo: "NPC Sem Aura", cor: "#888888", icone: "👤", porcentagem: Math.min(100, (pontos / 150) * 100) };
    },
    async cadastrarTurma(nomeTurma) {
        try {
            const res = await fetchComTimeout(API_CONFIG.URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ acao: 'cadastrarTurma', nomeTurma })
            });
            return await res.json();
        } catch (e) {
            console.error("Erro ao cadastrar turma:", e);
            return { sucesso: false, mensagem: "Erro na conexão." };
        }
    },

    async salvarAluno(alunoData) {
        try {
            const res = await fetchComTimeout(API_CONFIG.URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ acao: 'salvarAluno', ...alunoData })
            });
            return await res.json();
        } catch (e) {
            console.error("Erro ao salvar aluno:", e);
            return { sucesso: false, mensagem: "Erro na conexão." };
        }
    },
};