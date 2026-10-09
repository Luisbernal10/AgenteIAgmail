# AgenteIA Gmail

Aplicación web local para leer, clasificar y resumir en español los correos recientes de una cuenta personal de Gmail. Usa una página sencilla y puede ejecutar la IA en el mismo equipo mediante Ollama.

> **Privacidad:** la aplicación solicita permiso para leer mensajes y moverlos a la papelera de Gmail. No envía ni responde mensajes. Está pensada para ejecutarse en tu computadora, no para publicarse como un servicio de internet.

## Funciones

- Lee hasta 15 mensajes recientes de la bandeja de entrada.
- Clasifica los mensajes en **Promociones**, **Universidad**, **Facturas o banco**, **Personal** y **Otro**.
- Permite filtrar mensajes por categoría y ver el texto del correo.
- Permite mover mensajes a la papelera de Gmail desde la página. No es un borrado permanente.
- Con Ollama, genera clasificación y resumen usando un modelo local, sin una API key de IA.
- Sin Ollama, sigue funcionando con clasificación por palabras clave y una vista previa.
- Guarda el token de Gmail localmente y excluye credenciales y dependencias de Git.

## Requisitos

- Windows, macOS o Linux.
- [Node.js 20 o posterior](https://nodejs.org/).
- Una cuenta de Google y un proyecto en [Google Cloud Console](https://console.cloud.google.com/) con Gmail API habilitada.
- Opcional: [Ollama](https://ollama.com/download) para clasificación y resúmenes con IA local.

## Instalación y configuración

### 1. Descargar el proyecto e instalar dependencias

En PowerShell, abre esta carpeta y ejecuta:

```powershell
npm install
Copy-Item .env.example .env
```

### 2. Configurar el acceso de Gmail

La aplicación usa OAuth de Google; **no** requiere ni debe recibir tu contraseña de Gmail.

1. En Google Cloud Console, crea o selecciona un proyecto y habilita **Gmail API**.
2. Configura la pantalla de consentimiento OAuth. Si la aplicación está en modo de prueba, añade tu dirección de Gmail como usuario de prueba.
3. Crea un ID de cliente OAuth de tipo **Aplicación web**.
4. En **URI de redirección autorizados**, añade exactamente:

   ```text
   http://localhost:3000/oauth2callback
   ```

5. Abre `.env` en tu equipo y completa `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` con los valores de Google. No compartas este archivo ni publiques esos valores.

No es necesario configurar un origen JavaScript autorizado: el intercambio OAuth lo realiza el servidor local.

### 3. (Opcional) Preparar Ollama

Instala Ollama y descarga el modelo configurado por defecto:

```powershell
ollama pull qwen2.5:3b
```

Deja Ollama ejecutándose mientras uses la aplicación. Puedes comprobar los modelos instalados con:

```powershell
ollama list
```

Si Ollama no está instalado o el modelo no está disponible, la app utilizará su clasificador sencillo por palabras clave.

### 4. Iniciar la aplicación

Desde la carpeta del proyecto:

```powershell
npm start
```

Abre [http://localhost:3000](http://localhost:3000), pulsa **Conectar Gmail** y revisa los permisos en la página de Google. Acepta el permiso para leer mensajes y moverlos a la papelera.

Para cerrar la aplicación, vuelve a la terminal donde corre `npm start` y pulsa `Ctrl+C`.

## Privacidad y seguridad

- Gmail se autoriza con el permiso `gmail.modify`, necesario para mover mensajes a la papelera.
- El botón **Mover a la papelera** mueve el correo a la papelera de Gmail; desde allí puedes recuperarlo o eliminarlo permanentemente en Gmail.
- El servidor escucha solo en `127.0.0.1`; no está diseñado para acceso remoto.
- El token OAuth se guarda en `.gmail-token.json`.
- Las credenciales locales se guardan en `.env`.
- `.env`, `.gmail-token.json` y `node_modules/` están excluidos de Git.
- Con Ollama, el contenido se envía al servicio local de Ollama en el mismo equipo para su análisis; no se necesita un proveedor externo de IA.
- No expongas el servidor a internet ni subas `.env` o `.gmail-token.json` al repositorio.

Para revocar el permiso concedido, elimina el acceso de esta aplicación desde la configuración de seguridad de tu cuenta de Google y borra `.gmail-token.json` de tu equipo.

## Publicar el proyecto en GitHub

Primero crea un repositorio nuevo en [GitHub](https://github.com/new). Puedes hacerlo público o privado. **Créalo vacío**, sin README, licencia ni `.gitignore`, porque esos archivos ya están en esta carpeta.

En PowerShell, desde la carpeta `agenteIA`, inicializa el repositorio y comprueba que Git ignore los archivos privados:

```powershell
git init
git status --short
git check-ignore -v .env .gmail-token.json node_modules
```

El último comando debe mostrar reglas de `.gitignore` para `.env`, `.gmail-token.json` y `node_modules`. Si no las muestra, o esos archivos aparecen en `git status`, **no continúes** hasta corregir `.gitignore`.

Después crea la rama principal y prepara el primer commit:

```powershell
git branch -M main
git add .
git status
```

En la salida de `git status`, confirma que `.env`, `.gmail-token.json` y `node_modules/` no estén en la lista de archivos por confirmar. Si todo está correcto:

```powershell
git commit -m "Crear aplicación local para clasificar Gmail"
```

Copia la URL del repositorio recién creado en GitHub y enlázala así —reemplaza el ejemplo por tu URL real—:

```powershell
git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
git push -u origin main
```

GitHub puede pedirte iniciar sesión o autorizar Git Credential Manager. **No escribas tu contraseña de Gmail ni pegues secretos OAuth en el repositorio.** El archivo `.env.example` contiene únicamente nombres de configuración vacíos y sí se puede compartir.

En futuras actualizaciones:

```powershell
git add .
git commit -m "Describe brevemente el cambio"
git push
```

## Estructura del proyecto

```text
agenteIA/
├── public/
│   ├── app.js        # Interfaz y filtros de correo
│   ├── index.html    # Página principal
│   └── styles.css    # Estilos
├── .env.example      # Plantilla de configuración sin secretos
├── .gitignore        # Archivos privados y dependencias excluidas de Git
├── package.json
├── package-lock.json
└── server.js         # Servidor local, OAuth, Gmail y Ollama
```

## Solución de problemas

- **`node` o `npm` no se reconoce:** instala Node.js 20 o posterior y abre una nueva terminal.
- **`ollama` no se reconoce:** confirma que Ollama esté instalado; abre una nueva terminal y ejecuta `ollama list`. La app seguirá funcionando sin Ollama.
- **Google muestra un error de redirección:** revisa que la URI autorizada coincida exactamente con `http://localhost:3000/oauth2callback`.
- **La app no detecta OAuth:** confirma que `.env` esté en la carpeta del proyecto y que las variables `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` tengan valores.
- **El puerto 3000 está ocupado:** cierra la instancia anterior de la app antes de ejecutar `npm start` nuevamente.
