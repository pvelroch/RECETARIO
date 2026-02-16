# Despliegue Gratis (Railway + Vercel)

## 1) Backend en Railway

- Crea un proyecto en Railway desde este repositorio.
- En el servicio backend configura:
  - Start Command: `npm run api` (o `npm start`)
  - Variables:
    - `NODE_ENV=production`
    - `CLIENT_ORIGIN=https://TU-FRONTEND.vercel.app`
    - `DATA_DIR=/data`
- Agrega un Volume y montalo en `/data`.

## 2) Frontend en Vercel

- Importa el repositorio en Vercel.
- Configura:
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Variable:
    - `VUE_APP_API_URL=https://TU-BACKEND.railway.app`

## 3) Redeploy

- Despliega backend primero en Railway.
- Despliega frontend en Vercel despues.
- Si cambia una URL, actualiza variables y vuelve a desplegar.

## Notas

- El login usa cookie de sesion (`HttpOnly`) y CORS con credenciales.
- En produccion la cookie usa `Secure` + `SameSite=None`.
