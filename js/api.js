// js/api.js - Módulo de Conexão com Google Sheets

const API_URL = "https://script.google.com/macros/s/AKfycbxsOr7vf038H0zxZP3RT6FHixBDzbREwqqy-DvaXDUu1Uq0ol-GSlhtD2hj88Kpr1XR/exec";

const API = {
    _request: function(action, params = {}) {
        return new Promise((resolve, reject) => {
            const callbackName = 'jsonp_cb_' + Math.round(100000 * Math.random());
            window[callbackName] = function(data) {
                delete window[callbackName];
                if (script.parentNode) document.body.removeChild(script);
                resolve(data);
            };

            const script = document.createElement('script');
            let query = `?action=${action}&callback=${callbackName}`;
            
            Object.keys(params).forEach(key => {
                query += `&${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
            });

            script.src = API_URL + query;
            script.onerror = () => {
                delete window[callbackName];
                if (script.parentNode) document.body.removeChild(script);
                reject(new Error("Falha na sincronização."));
            };
            document.body.appendChild(script);
        });
    },

    getTurmas: async function() {
        const res = await this._request('getTurmas');
        return Array.isArray(res) ? res : [];
    },

    salvarTurma: async function(nome) {
        return await this._request('salvarTurma', { nome });
    },

    getAlunos: async function() {
        const res = await this._request('getAlunos');
        return Array.isArray(res) ? res : [];
    },

    getAlunoPorId: async function(id) {
        const idLimpo = String(id).trim();
        const res = await this._request('getAlunoPorId', { id: idLimpo });
        return (res && !res.erro) ? res : null;
    },

    salvarAluno: async function(nome, turma) {
        return await this._request('salvarAluno', { nome, turma });
    },

    getLancamentosPorAluno: async function(alunoId) {
        const idLimpo = String(alunoId).trim();
        const res = await this._request('getLancamentosPorAluno', { alunoId: idLimpo });
        return Array.isArray(res) ? res : [];
    },

    adicionarLancamento: async function(dados) {
        return await this._request('salvarLancamento', dados);
    },

    calcularNivel: function(xpTotal) {
        const xp = Number(xpTotal) || 0;
        const niveis = [
            { nivel: 1, xpNecessario: 0, titulo: "Novato 🛡️" },
            { nivel: 2, xpNecessario: 100, titulo: "Aprendiz ⚔️" },
            { nivel: 3, xpNecessario: 300, titulo: "Explorador 🏹" },
            { nivel: 4, xpNecessario: 600, titulo: "Estrategista 📜" },
            { nivel: 5, xpNecessario: 1000, titulo: "Mestre 👑" },
            { nivel: 6, xpNecessario: 1500, titulo: "Lorde do XP 🌟" }
        ];

        let nivelAtual = niveis[0];
        let proximoNivel = niveis[1];

        for (let i = niveis.length - 1; i >= 0; i--) {
            if (xp >= niveis[i].xpNecessario) {
                nivelAtual = niveis[i];
                proximoNivel = niveis[i + 1] || { xpNecessario: niveis[i].xpNecessario * 1.5 };
                break;
            }
        }

        const xpInicio = nivelAtual.xpNecessario;
        const xpFim = proximoNivel.xpNecessario;
        const progresso = Math.min(100, Math.max(0, Math.floor(((xp - xpInicio) / (xpFim - xpInicio)) * 100)));

        return {
            nivel: nivelAtual.nivel,
            titulo: nivelAtual.titulo,
            porcentagem: progresso,
            xpProxNivel: xpFim
        };
    }
};