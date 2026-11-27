# xchango_cliente

Cliente web de XchanGo (Angular). Es la pagina que ven los usuarios y el panel de administracion.
No se conecta a la base de datos: todo lo pide al MID por HTTP.

Cliente (4200) -> MID (8080) -> CRUD (3000) -> PostgreSQL db_xchango (5432)

## 1. Antes de correrlo
Tienen que estar encendidos en este orden:
1. PostgreSQL con la base `db_xchango`
2. El CRUD (`go run main.go` en xchango_crud)
3. El MID (`go run main.go` en xchango_mid)

La direccion del MID esta en `src/app/config/api.ts` (`http://localhost:8080/api/v1`).

## 2. Instalar
Solo la primera vez:
```
npm install
```

## 3. Correr
```
npm start
```
Abrir en el navegador http://localhost:4200

## 4. Compilar
```
npm run build
```
Queda en la carpeta `dist/`.

## Como entrar
- Usuarios: con el correo, el MID manda un PIN al correo para entrar o registrarse.
- Panel de administracion: boton "XchanGo Admin" arriba a la derecha del login, o en http://localhost:4200/admin/login
  - Administrador: admin@xchango.com / admin123
  - Moderador: moderador@xchango.com / mod123

## Carpetas
- `src/app/pages`: las paginas (inicio, perfil, mis trueques, publicar, panel admin, etc).
- `src/app/components`: partes que se repiten (logo, iconos, aviso de cookies, graficas del panel).
- `src/app/layout`: el detalle de la publicacion y la ventana del codigo.
- `src/app/services`: las peticiones al MID.
- `src/app/models`: como son los datos (usuario, publicacion, trueque).
- `src/app/guards`: no dejan entrar a paginas sin iniciar sesion.
- `src/app/interceptors`: le pone el token a cada peticion.

## Ramas
- `main`: version final.
- `develop`: donde se junta el trabajo de todos.
- `release`: para probar antes de pasar a main. Al subir a esta rama se publica en GitHub Pages.
- `feature/yeferson`, `feature/miguel`, `feature/tomas`, `feature/stiven`: trabajo de cada uno.

## Integrantes
- Yeferson
- Miguel
- Tomas
- Stiven
