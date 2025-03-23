# Olimpo Gym - Next.js

## Descripción
Aplicación web para el gimnasio Olimpo, desarrollada con Next.js, React y TypeScript. Esta versión es una migración de la aplicación original de React a Next.js para mejorar el SEO, el rendimiento y la experiencia de usuario.

## Estructura del proyecto
- `src/app`: Páginas y rutas de la aplicación (estructura de carpetas de Next.js App Router)
- `src/components`: Componentes reutilizables
- `src/contexts`: Contextos de React, incluyendo autenticación
- `src/types`: Definiciones de tipos de TypeScript

## Características
- Página de inicio con secciones para:
  - Hero
  - Características
  - Membresías
  - Clases
  - Testimonios
  - Llamado a la acción
- Sistema de autenticación
- Panel de administración
- Panel de usuario
- Blog
- Responsive design

## Tecnologías utilizadas
- Next.js 14+
- React 18+
- TypeScript
- Tailwind CSS
- React Hot Toast

## Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Iniciar en modo producción
npm run start
```

## Variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Despliegue en Vercel

Esta aplicación está optimizada para ser desplegada en Vercel. Para desplegar:

1. Sube el código a un repositorio de GitHub
2. Conecta el repositorio a Vercel
3. Configura las variables de entorno en Vercel
4. ¡Listo!

## Migración desde la versión anterior

Esta versión es una migración completa de la aplicación original desarrollada con React. Principales cambios:

1. Migración a Next.js App Router
2. Mejoras en SEO
3. Mejor rendimiento con Server Components
4. Optimización de imágenes con next/image
5. Rutas dinámicas mejoradas

## Notas importantes

- Para evitar problemas con el despliegue en Vercel, se ha incluido un archivo `vercel.json` que configura correctamente las rutas
- Se ha eliminado la dependencia específica de Windows (@rollup/rollup-win32-x64-msvc) que causaba problemas en el despliegue
- Se utiliza `window.location.href` en lugar de `router.push()` después del inicio de sesión para forzar una recarga completa y actualizar correctamente el contexto de autenticación
