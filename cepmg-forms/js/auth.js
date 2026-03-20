// =============================================
// CEPMG FORMS - Funções de Autenticação
// =============================================

import { auth, db } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const googleProvider = new GoogleAuthProvider();

// -----------------------------------------------
// Cadastrar aluno com email e senha
// -----------------------------------------------
export async function cadastrarAluno({ nome, email, senha, turma }) {
  const cred = await createUserWithEmailAndPassword(auth, email, senha);
  await salvarUsuarioNoBanco(cred.user, { nome, turma, tipo: 'aluno' });
  return cred.user;
}

// -----------------------------------------------
// Login com email e senha
// -----------------------------------------------
export async function loginEmail(email, senha) {
  const cred = await signInWithEmailAndPassword(auth, email, senha);
  return cred.user;
}

// -----------------------------------------------
// Login / Cadastro com Google
// -----------------------------------------------
export async function loginGoogle(tipoParaCadastro = null) {
  const cred = await signInWithPopup(auth, googleProvider);
  const user = cred.user;

  // Verifica se já existe no banco
  const ref = doc(db, 'usuarios', user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // Novo usuário via Google — salva como aluno (ou tipo informado)
    await salvarUsuarioNoBanco(user, {
      nome:  user.displayName || 'Usuário Google',
      turma: '',
      tipo:  tipoParaCadastro || 'aluno'
    });
  }

  return user;
}

// -----------------------------------------------
// Salvar usuário no Firestore
// -----------------------------------------------
async function salvarUsuarioNoBanco(user, { nome, turma, tipo }) {
  await setDoc(doc(db, 'usuarios', user.uid), {
    nome,
    email:        user.email,
    tipo,
    turma:        turma || '',
    dataCadastro: serverTimestamp()
  });
}

// -----------------------------------------------
// Buscar dados do usuário no banco
// -----------------------------------------------
export async function getDadosUsuario(uid) {
  const snap = await getDoc(doc(db, 'usuarios', uid));
  if (snap.exists()) return { id: snap.id, ...snap.data() };
  return null;
}

// -----------------------------------------------
// Logout
// -----------------------------------------------
export async function logout() {
  await signOut(auth);
  window.location.href = 'index.html';
}

// -----------------------------------------------
// Verificar autenticação e tipo de usuário
// Redireciona se não autorizado
// -----------------------------------------------
export function verificarAuth(tipoEsperado) {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub(); // Para de ouvir após primeira verificação
      if (!user) {
        window.location.href = 'index.html';
        return;
      }
      const dados = await getDadosUsuario(user.uid);
      if (!dados) {
        window.location.href = 'index.html';
        return;
      }
      if (tipoEsperado && dados.tipo !== tipoEsperado) {
        // Redireciona para o painel correto
        window.location.href = dados.tipo === 'admin' ? 'admin.html' : 'aluno.html';
        return;
      }
      resolve({ user, dados });
    });
  });
}
