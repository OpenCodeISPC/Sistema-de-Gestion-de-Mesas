/**
 * auth.constants.ts
 * ------------------
 * Fuente única de verdad para los nombres de las keys de localStorage
 * usadas en el flujo de autenticación (JWT con Simple JWT en el backend).
 *
 * POR QUÉ EXISTE ESTE ARCHIVO:
 * Antes, cada archivo (login.ts, auth.interceptor.ts) usaba strings
 * hardcodeados ('access', 'refresh', o incluso 'access_token'/'refresh_token'
 * en una versión anterior). Como Angular no valida esos strings en
 * tiempo de compilación, un typo o una inconsistencia entre archivos
 * rompía la sesión de forma silenciosa: el login guardaba el token
 * bajo una key y el interceptor leía otra, así que ningún request
 * salía autenticado (401 constante) sin ningún error visible en el
 * código.
 *
 * A partir de ahora, login.ts, auth.interceptor.ts y cualquier otro
 * lugar que necesite leer o escribir estos tokens DEBEN importar estas
 * constantes en vez de escribir el string a mano. Si el nombre de la
 * key cambia en el futuro, se cambia acá una sola vez.
 */

/** Key de localStorage donde se guarda el JWT access token (vida corta, 60 min). */
export const AUTH_TOKEN_KEY = 'access';

/** Key de localStorage donde se guarda el JWT refresh token (vida larga, 1 día). */
export const REFRESH_TOKEN_KEY = 'refresh';