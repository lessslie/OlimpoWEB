#!/bin/bash

# Navegar al directorio del frontend
cd front

# Eliminar package-lock.json si existe
rm -f package-lock.json

# Crear un nuevo package.json sin la dependencia problemática
cat > package.json << 'EOL'
{
  "name": "front",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.8.4",
    "date-fns": "^4.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-slick": "^0.30.3",
    "slick-carousel": "^1.8.1"
  },
  "devDependencies": {
    "@eslint/js": "^9.21.0",
    "@heroicons/react": "^2.2.0",
    "@supabase/supabase-js": "^2.49.1",
    "@types/react": "^19.0.12",
    "@types/react-dom": "^19.0.4",
    "@types/react-slick": "^0.23.13",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.18",
    "eslint": "^9.21.0",
    "eslint-plugin-react-hooks": "^5.1.0",
    "eslint-plugin-react-refresh": "^0.4.19",
    "globals": "^15.15.0",
    "postcss": "^8.4.35",
    "qrcode.react": "^4.2.0",
    "react-hot-toast": "^2.5.2",
    "react-router-dom": "^7.4.0",
    "tailwindcss": "^3.4.1",
    "typescript": "~5.7.2",
    "typescript-eslint": "^8.24.1",
    "vite": "^6.2.0"
  }
}
EOL

# Instalar dependencias
npm install

# Construir el proyecto
npm run build
