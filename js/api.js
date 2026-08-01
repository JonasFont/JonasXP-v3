const API_URL = "https://script.google.com/macros/s/AKfycbxVE7-w9Ea9UYM6s4kGg4TmDIAdjKwwIYZh38DcBMdJ5AaZP9D6J9yqaWsRoD53ZAd5/exec"; // Mantenha sua URL atual aqui

const API = {
  async getAlunos() {
    const res = await fetch(`${API_URL}?action=getAlunos`);
    return await res.json();
  },
  async getTurmas() {
    const res = await fetch(`${API_URL}?action=getTurmas`);
    return await res.json();
  },
  async getAlunoById(id) {
    const res = await fetch(`${API_URL}?action=getAluno&id=${id}`);
    return await res.json();
  },
  async addAluno(alunoData) {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "addAluno", ...alunoData })
    });
    return await res.json();
  },
  async addTurma(nome) {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "addTurma", nome })
    });
    return await res.json();
  },
  async editTurma(id, nome) {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "editTurma", id, nome })
    });
    return await res.json();
  },
  async deleteTurma(id) {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "deleteTurma", id })
    });
    return await res.json();
  },
  async addAvaliacao(avaliacaoData) {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "addAvaliacao", ...avaliacaoData })
    });
    return await res.json();
  },
  // Adicione esta função dentro do objeto API no seu js/api.js:
  async addAvaliacoesLote(listaAvaliacoes) {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "addAvaliacoesLote", avaliacoes: listaAvaliacoes })
    });
    return await res.json();
  }
};