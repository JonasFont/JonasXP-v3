// js/api.js - Módulo de Comunicação com Google Apps Script

const API_CONFIG = {
    URL: "https://script.google.com/macros/s/AKfycbx4UYuGkCI61POD4QHuqjT2T-4K2wV6RFU9ZrRhrcVuXtgGQSyGmIuL_ceIDV1XgWYm/exec",
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

    /**
     * Calculadora de níveis e títulos sincronizada com as Conquistas
     */
    calcularNivel(totalXP) {
        const xp = Number(totalXP) || 0;

        if (xp >= 10000) {
            return { nivel: 6, titulo: "Lorde Lendário", xpProxNivel: 10000, porcentagem: 100 };
        }
        if (xp >= 5000) {
            const pct = Math.min(100, Math.round(((xp - 5000) / 5000) * 100));
            return { nivel: 5, titulo: "Mestre Supremo", xpProxNivel: 10000, porcentagem: pct };
        }
        if (xp >= 3000) {
            const pct = Math.min(100, Math.round(((xp - 3000) / 2000) * 100));
            return { nivel: 4, titulo: "Especialista", xpProxNivel: 5000, porcentagem: pct };
        }
        if (xp >= 1500) {
            const pct = Math.min(100, Math.round(((xp - 1500) / 1500) * 100));
            return { nivel: 3, titulo: "Avançado", xpProxNivel: 3000, porcentagem: pct };
        }
        if (xp >= 500) {
            const pct = Math.min(100, Math.round(((xp - 500) / 1000) * 100));
            return { nivel: 2, titulo: "Aprendiz", xpProxNivel: 1500, porcentagem: pct };
        }

        const pct = Math.min(100, Math.round((xp / 500) * 100));
        return { nivel: 1, titulo: "Iniciante", xpProxNivel: 500, porcentagem: pct };
    }
};