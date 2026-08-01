// Substitua pela URL da sua implantação do Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbwdKDdXRr_arUOyOz0eliAGSDiySaFqVrvtTX0oleeGK0MEAiZoBEDKGpyQCBE2mawg/exec";

const API = {
  // --- LEITURA (GET) ---
  getAlunos: async () => {
    try {
      const url = `${API_URL}?action=getAlunos`;
      const res = await fetch(url, { method: "GET", redirect: "follow" });
      return await res.json();
    } catch (err) {
      console.error("Erro ao buscar alunos:", err);
      return [];
    }
  },

  getTurmas: async () => {
    try {
      const url = `${API_URL}?action=getTurmas`;
      const res = await fetch(url, { method: "GET", redirect: "follow" });
      return await res.json();
    } catch (err) {
      console.error("Erro ao buscar turmas:", err);
      return [];
    }
  },

  getAlunoById: async (id) => {
    try {
      const url = `${API_URL}?action=getAluno&id=${encodeURIComponent(id)}`;
      const res = await fetch(url, { method: "GET", redirect: "follow" });
      return await res.json();
    } catch (err) {
      console.error("Erro ao buscar aluno por ID:", err);
      return { error: true };
    }
  },

  // --- ESCRITA E MODIFICAÇÃO (POST) ---
  addAluno: async (nome, turma) => {
    return await API.postData({ action: 'addAluno', nome, turma });
  },

  editAluno: async (id, nome, turma) => {
    return await API.postData({ action: 'editAluno', id, nome, turma });
  },

  deleteAluno: async (id) => {
    return await API.postData({ action: 'deleteAluno', id });
  },

  addTurma: async (nome) => {
    return await API.postData({ action: 'addTurma', nome });
  },

  editTurma: async (id, nome) => {
    return await API.postData({ action: 'editTurma', id, nome });
  },

  deleteTurma: async (id) => {
    return await API.postData({ action: 'deleteTurma', id });
  },

  addAvaliacoesLote: async (avaliacoes) => {
    return await API.postData({ action: 'addAvaliacoesLote', avaliacoes });
  },

  postData: async (payload) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });
      return await res.json();
    } catch (err) {
      console.error("Erro na requisição POST:", err);
      return { error: err.toString() };
    }
  }
};