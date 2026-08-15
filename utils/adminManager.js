// utils/adminManager.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ADMINS_FILE = path.join(process.cwd(), 'admins.json');

// Cargar administradores
export function loadAdmins() {
  try {
    if (!fs.existsSync(ADMINS_FILE)) {
      fs.writeFileSync(ADMINS_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(ADMINS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error cargando admins:', error);
    return [];
  }
}

// Guardar administradores
export function saveAdmins(admins) {
  try {
    fs.writeFileSync(ADMINS_FILE, JSON.stringify(admins, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error guardando admins:', error);
    return false;
  }
}

// Verificar si un número es administrador
export function isAdmin(number) {
  const admins = loadAdmins();
  return admins.includes(number);
}

// Agregar administrador
export function addAdmin(number) {
  const admins = loadAdmins();
  if (!admins.includes(number)) {
    admins.push(number);
    return saveAdmins(admins);
  }
  return false;
}

// Eliminar administrador
export function removeAdmin(number) {
  let admins = loadAdmins();
  const index = admins.indexOf(number);
  if (index !== -1) {
    admins.splice(index, 1);
    return saveAdmins(admins);
  }
  return false;
}

// Listar administradores
export function listAdmins() {
  return loadAdmins();
}
