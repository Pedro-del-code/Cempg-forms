// =============================================
// CEPMG FORMS - Configuração do Firebase
// =============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ✅ Configuração do projeto CEPMG Forms
const firebaseConfig = {
  apiKey:            "AIzaSyAPSLHYRLKpOz6qS9ep7qyEQ9yWUPvBkhU",
  authDomain:        "cepmg-forms.firebaseapp.com",
  projectId:         "cepmg-forms",
  storageBucket:     "cepmg-forms.firebasestorage.app",
  messagingSenderId: "403954615027",
  appId:             "1:403954615027:web:9c858b799c3584e290ed86"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços para uso nos outros arquivos
export const auth = getAuth(app);
export const db   = getFirestore(app);
