// ============================================================================
// js/api.js - Módulo de Comunicação com Google Apps Script e Regras de Negócio
// Sistema: JonasXP
// ============================================================================

const API_CONFIG = {
    // Insira aqui a URL do Web App gerado no Google Apps Script
    URL: "https://script.google.com/macros/s/AKfycbwl7yLpOF-QLeU6d-NcoLttuwwDs_RwAD_39YABPQpyUzcHXuf0GX3EPLTqWp43Qd15/exec",
    TIMEOUT: 15000, // Timeout em ms (15s)
    DEBUG: true     // Ativa logs no console
};

/**
 * Utilitário interno para logs padronizados de depuração
 */
const Logger = {
    info: (msg, payload = null) => {
        if (API_CONFIG.DEBUG) {
            console.log(`[JonasXP API - INFO] ${msg}`, payload || '');
        }
    },
    error: (msg, err = null) => {
        console.error(`[JonasXP API - ERRO] ${msg}`, err || '');
    }
};

/**
 * Wrapper para requisições Fetch com suporte a Timeout
 */
async function fetchComTimeout(resource, options = {}) {
    const { timeout = API_CONFIG.TIMEOUT } = options;
    
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error('A requisição excedeu o tempo limite de resposta.');
        }
        throw error;
    }
}

const API = {

    /**
     * Busca a lista completa de todos os alunos cadastrados
     * @returns {Promise<Array>} Lista de objetos de alunos
     */
    async getAlunos() {
        Logger.info("Iniciando busca de todos os alunos...");
        try {
            const url = `${API_CONFIG.URL}?acao=getAlunos`;
            const response = await fetchComTimeout(url);

            if (!response.ok) {
                throw new Error(`Falha HTTP ao carregar alunos. Status: ${response.status}`);
            }

            const dados = await response.json();
            Logger.info(`Sucesso ao carregar alunos. Total recebido: ${Array.isArray(dados) ? dados.length : 0}`);
            
            return Array.isArray(dados) ? dados : [];
        } catch (error) {
            Logger.error("Erro ao executar getAlunos:", error);
            throw error;
        }
    },

    /**
     * Busca os dados específicos de um único aluno pelo seu ID
     * @param {string|number} idAluno 
     * @returns {Promise<Object>} Dados do aluno retornado
     */
    async getAlunoPorId(idAluno) {
        if (!idAluno) {
            Logger.error("ID do aluno não fornecido para getAlunoPorId.");
            throw new Error("ID do aluno é obrigatório.");
        }

        Logger.info(`Buscando dados do aluno ID: ${idAluno}`);
        try {
            const url = `${API_CONFIG.URL}?acao=getAluno&id=${encodeURIComponent(idAluno)}`;
            const response = await fetchComTimeout(url);

            if (!response.ok) {
                throw new Error(`Erro ao buscar aluno ID ${idAluno}. Status: ${response.status}`);
            }

            const dados = await response.json();
            Logger.info(`Dados do aluno ID ${idAluno} recebidos com sucesso.`, dados);
            return dados;
        } catch (error) {
            Logger.error(`Erro ao buscar o aluno ID ${idAluno}:`, error);
            throw error;
        }
    },

    /**
     * Busca o histórico de pontuações e observações de um aluno específico
     * @param {string|number} idAluno 
     * @returns {Promise<Array>} Lista de registros do histórico
     */
    async getHistoricoAluno(idAluno) {
        if (!idAluno) {
            Logger.error("ID do aluno não informado para consulta de histórico.");
            return [];
        }

        Logger.info(`Buscando histórico do aluno ID: ${idAluno}`);
        try {
            const url = `${API_CONFIG.URL}?acao=getHistorico&id=${encodeURIComponent(idAluno)}`;
            const response = await fetchComTimeout(url);

            if (!response.ok) {
                throw new Error(`Erro ao buscar histórico. Status: ${response.status}`);
            }

            const dados = await response.json();
            Logger.info(`Histórico carregado para o aluno ID ${idAluno}. Total de lançamentos: ${Array.isArray(dados) ? dados.length : 0}`);
            return Array.isArray(dados) ? dados : [];
        } catch (error) {
            Logger.error(`Erro ao consultar histórico do aluno ID ${idAluno}:`, error);
            return [];
        }
    },

    /**
     * Salva um novo lançamento de pontos (XP) no Google Sheets
     * @param {Object} payload Dados do lançamento (alunoId, atividade, equipe, comportamento, participacao, observacao, data)
     * @returns {Promise<Object>} Resposta do servidor
     */
    async salvarLancamento(payload) {
        if (!payload || !payload.alunoId) {
            Logger.error("Payload de lançamento inválido ou sem ID do aluno.");
            throw new Error("Dados de lançamento inválidos.");
        }

        Logger.info("Enviando novo lançamento de XP...", payload);

        try {
            // Utilização de URLSearchParams para envio x-www-form-urlencoded
            // Evita requisições OPTIONS pré-flight bloqueadas pelo Google Apps Script
            const params = new URLSearchParams();
            params.append('acao', 'salvarLancamento');
            params.append('dados', JSON.stringify(payload));

            const response = await fetchComTimeout(API_CONFIG.URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params
            });

            if (!response.ok) {
                throw new Error(`Erro de rede ao salvar lançamento. Status: ${response.status}`);
            }

            const resultado = await response.json();
            Logger.info("Lançamento salvo com sucesso no servidor!", resultado);
            return resultado;
        } catch (error) {
            Logger.error("Erro ao salvar lançamento de XP:", error);
            throw error;
        }
    },

    /**
     * Calculadora das regras de nível e titulação do JonasXP
     * @param {number} totalXP Total de pontos do aluno
     * @returns {Object} Dados com nivel, titulo, proximoXP e porcentagem de progresso
     */
    calcularNivel(totalXP) {
        const xp = Number(totalXP) || 0;

        if (xp >= 5000) {
            return { nivel: 5, titulo: "Mestre Supremo", proximoXP: 5000, progresso: 100 };
        }
        if (xp >= 3000) {
            const progresso = Math.min(100, Math.round(((xp - 3000) / 2000) * 100));
            return { nivel: 4, titulo: "Especialista", proximoXP: 5000, progresso };
        }
        if (xp >= 1500) {
            const progresso = Math.min(100, Math.round(((xp - 1500) / 1500) * 100));
            return { nivel: 3, titulo: "Avançado", proximoXP: 3000, progresso };
        }
        if (xp >= 500) {
            const progresso = Math.min(100, Math.round(((xp - 500) / 1000) * 100));
            return { nivel: 2, titulo: "Aprendiz", proximoXP: 1500, progresso };
        }

        const progresso = Math.min(100, Math.round((xp / 500) * 100));
        return { nivel: 1, titulo: "Iniciante", proximoXP: 500, progresso };
    }
};