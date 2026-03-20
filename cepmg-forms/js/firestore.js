// =============================================
// CEPMG FORMS - Funções do Firestore (Banco)
// =============================================

import { db } from './firebase-config.js';
import {
  collection, addDoc, getDocs, getDoc, doc,
  updateDoc, deleteDoc, query, where,
  serverTimestamp, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==================================================
//  FORMS
// ==================================================

// Criar novo form
export async function criarForm({ titulo, link, descricao, criadoPor }) {
  return await addDoc(collection(db, 'forms'), {
    titulo,
    link,
    descricao,
    dataCriacao: serverTimestamp(),
    criadoPor
  });
}

// Listar todos os forms
export async function listarForms() {
  const q = query(collection(db, 'forms'), orderBy('dataCriacao', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Atualizar form
export async function atualizarForm(id, dados) {
  await updateDoc(doc(db, 'forms', id), dados);
}

// Excluir form (e suas liberações)
export async function excluirForm(id) {
  await deleteDoc(doc(db, 'forms', id));
  // Remove liberações relacionadas
  const q = query(collection(db, 'liberacoes'), where('formId', '==', id));
  const snap = await getDocs(q);
  const promises = snap.docs.map(d => deleteDoc(d.ref));
  await Promise.all(promises);
}

// ==================================================
//  LIBERAÇÕES
// ==================================================

// Liberar form
export async function liberarForm({ formId, tipoLiberacao, turma, alunoId, liberadoPor }) {
  // Desativa liberações anteriores do mesmo form com mesmo escopo (evita duplicata)
  await bloquearLiberacoesExistentes(formId, tipoLiberacao, turma, alunoId);

  return await addDoc(collection(db, 'liberacoes'), {
    formId,
    tipoLiberacao,   // "todos" | "turma" | "aluno"
    turma:   turma   || null,
    alunoId: alunoId || null,
    dataLiberacao: serverTimestamp(),
    liberadoPor,
    ativo: true
  });
}

// Bloquear/desativar liberação
export async function bloquearLiberacao(liberacaoId) {
  await updateDoc(doc(db, 'liberacoes', liberacaoId), { ativo: false });
}

// Desativa liberações existentes ativas para o mesmo escopo
async function bloquearLiberacoesExistentes(formId, tipoLiberacao, turma, alunoId) {
  let q = query(
    collection(db, 'liberacoes'),
    where('formId', '==', formId),
    where('tipoLiberacao', '==', tipoLiberacao),
    where('ativo', '==', true)
  );
  const snap = await getDocs(q);
  const promises = snap.docs
    .filter(d => {
      const data = d.data();
      if (tipoLiberacao === 'turma')  return data.turma === turma;
      if (tipoLiberacao === 'aluno')  return data.alunoId === alunoId;
      return true; // 'todos'
    })
    .map(d => updateDoc(d.ref, { ativo: false }));
  await Promise.all(promises);
}

// Listar todas as liberações (admin)
export async function listarLiberacoes() {
  const snap = await getDocs(collection(db, 'liberacoes'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Listar liberações ativas de um form específico
export async function listarLiberacoesDoForm(formId) {
  const q = query(
    collection(db, 'liberacoes'),
    where('formId', '==', formId),
    where('ativo', '==', true)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ==================================================
//  FORMS VISÍVEIS PARA UM ALUNO
// ==================================================
export async function listarFormsDoAluno(alunoId, turmaAluno) {
  // Busca todas as liberações ativas
  const q = query(collection(db, 'liberacoes'), where('ativo', '==', true));
  const liberacoesSnap = await getDocs(q);
  const liberacoes = liberacoesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Filtra as que se aplicam a este aluno
  const formIdsVisiveis = new Set();
  liberacoes.forEach(lib => {
    if (lib.tipoLiberacao === 'todos') {
      formIdsVisiveis.add(lib.formId);
    } else if (lib.tipoLiberacao === 'turma' && lib.turma === turmaAluno) {
      formIdsVisiveis.add(lib.formId);
    } else if (lib.tipoLiberacao === 'aluno' && lib.alunoId === alunoId) {
      formIdsVisiveis.add(lib.formId);
    }
  });

  if (formIdsVisiveis.size === 0) return [];

  // Busca os forms correspondentes
  const formsSnap = await getDocs(collection(db, 'forms'));
  return formsSnap.docs
    .filter(d => formIdsVisiveis.has(d.id))
    .map(d => ({ id: d.id, ...d.data() }));
}

// ==================================================
//  USUÁRIOS (para o Admin)
// ==================================================

export async function listarAlunos() {
  const q = query(collection(db, 'usuarios'), where('tipo', '==', 'aluno'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function listarTurmas() {
  const alunos = await listarAlunos();
  const turmas = [...new Set(alunos.map(a => a.turma).filter(Boolean))];
  return turmas.sort();
}
