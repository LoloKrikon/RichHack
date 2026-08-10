# 🛡️ RichHack — Portal de Seguridad Informática

Portal educativo interactivo sobre ciberseguridad, diseñado para enseñar a los usuarios sobre amenazas digitales y cómo protegerse en internet.

## 🚀 Funcionalidades

- **Autenticación** — Registro, login, acceso como invitado y Google Sign-In (Firebase Auth)
- **Catálogo de ataques** — Phishing, Ransomware, Man-in-the-Middle, Fuerza Bruta
- **Plan de Ciberseguridad** — Checklist interactivo con barra de progreso
- **Analizador de contraseñas** — Medidor de fuerza con cálculo de tiempo de hackeo
- **Quiz de Ciberseguridad** — Cuestionario de 5 preguntas con puntuación
- **Asistente IA** — Chatbot con la API de Google Gemini
- **Alertas comunitarias** — Sistema de reportes en tiempo real con Firestore

## 📁 Estructura del Proyecto

```
RichHack/
├── index.html              # Página principal
├── pages/
│   └── servidor.php        # Página dinámica con PHP
├── assets/
│   ├── css/
│   │   └── styles.css      # Estilos globales
│   ├── js/
│   │   └── app.js          # Lógica principal (Firebase, Quiz, Chat, etc.)
│   └── img/
│       └── hacker.png      # Imagen decorativa
├── firebase.json           # Configuración de Firebase Hosting
├── .gitignore              # Archivos ignorados por Git
└── README.md               # Este archivo
```

## 🛠️ Tecnologías

- HTML5, CSS3, JavaScript (ES Modules)
- Firebase Authentication, Firestore, Hosting
- Google Gemini API (Asistente IA)
- Font Awesome, Google Fonts (Outfit)

## 📦 Despliegue

El proyecto está configurado para despliegue en **Firebase Hosting**:

```bash
npx firebase-tools deploy --only hosting
```

## 👤 Autor

Desarrollado por **LoloKrikon**
