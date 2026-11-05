# Comida Ñeru · Sábado 7/11 — V0.2

Web App móvil para 13 asistentes ya precargados. Cada persona toca su nombre, marca los entrantes compartidos que le apetecen y elige primero, principal y postre. Incluye resumen común, estado de quién ha respondido y totales individuales.

## 1. Probarla sin configurar nada

Abre `index.html` en un navegador. Funcionará en **modo demo local**: guarda datos solo en ese navegador/dispositivo.

## 2. Publicarla en GitHub

1. Crea un repositorio, por ejemplo `comida-neru`.
2. Copia en él estos archivos: `index.html`, `styles.css`, `app.js`, `config.js`.
3. Haz commit y push desde GitHub Desktop.

## 3. Crear la tabla compartida en Supabase

1. Entra en tu proyecto de Supabase.
2. Abre **SQL Editor**.
3. Pulsa **New query**.
4. Copia y ejecuta todo el contenido de `supabase.sql`.

## 4. Copiar las claves de Supabase

En Supabase abre **Project Settings > API** (en algunas versiones aparece como **Settings > API**).

Necesitas:
- Project URL
- anon / public key (o Publishable key, según la interfaz)

## 5. Pegarlas en config.js

Cambia:

```js
window.NERU_CONFIG = {
  eventId: 'neru-2026-11-07',
  supabaseUrl: '',
  supabaseAnonKey: ''
};
```

por tus valores reales:

```js
window.NERU_CONFIG = {
  eventId: 'neru-2026-11-07',
  supabaseUrl: 'https://TU-PROYECTO.supabase.co',
  supabaseAnonKey: 'TU_CLAVE_PUBLICA'
};
```

**No uses la service_role key.** Solo la clave pública/anon/publishable.

Haz commit + push otra vez.

## 6. Publicarla en Vercel

1. Entra en Vercel.
2. **Add New > Project**.
3. Importa el repositorio `comida-neru`.
4. Framework Preset: **Other**.
5. No hace falta Build Command.
6. Output Directory: déjalo vacío.
7. Pulsa **Deploy**.

Vercel te dará una URL similar a:

`https://comida-neru.vercel.app`

Esa es la URL que puedes enviar al grupo de WhatsApp.

## 7. Cómo funciona para tus amigos

1. Abren el enlace.
2. Tocan su nombre en la lista de 13 asistentes.
3. En **Compartir**, marcan todos los entrantes que les apetecen.
4. En **Primeros**, eligen uno o “Sin primero”.
5. En **Principal**, eligen un plato.
6. En **Postre**, eligen uno o “Sin postre”.
7. En **Resumen** todos pueden ver la selección conjunta.

La app propone además un número orientativo de raciones de entrantes: **1 ración por cada 4 personas interesadas**.

## Nota de privacidad de esta V0.1

Está pensada para un grupo privado de amigos con un enlace compartido. No hay login. Los 13 nombres están precargados y quien tenga la URL puede tocar cualquiera de ellos para ver o modificar sus elecciones. Para esta comida es deliberadamente simple. Si quieres, en una V0.2 se puede añadir PIN de invitación o modo anfitrión.


## Asistentes precargados

- Antonio y Eva
- Rafa y Paloma
- Enrique y Rosa
- Fernando y Chelo
- Oscar P. y Ana
- Oscar A. y Elena
- Javi

La pantalla inicial muestra quién ya ha respondido y quién sigue pendiente.
