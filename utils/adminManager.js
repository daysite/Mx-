// utils/adminManager.js
import db from '#db';

// ============================================
// FUNCIONES PARA MANEJAR ADMINISTRADORES CON DB
// ============================================

// Obtener la lista de administradores desde la base de datos
export function loadAdmins() {
  try {
    // Buscar en la base de datos la clave 'admins'
    const adminsData = db.get('admins');
    
    if (!adminsData) {
      // Si no existe, crearla con un array vacío
      db.set('admins', []);
      return [];
    }
    
    return adminsData;
  } catch (error) {
    console.error('❌ Error cargando admins desde DB:', error);
    return [];
  }
}

// Guardar la lista de administradores en la base de datos
export function saveAdmins(admins) {
  try {
    db.set('admins', admins);
    return true;
  } catch (error) {
    console.error('❌ Error guardando admins en DB:', error);
    return false;
  }
}

// Verificar si un número es administrador
export function isAdmin(number) {
  try {
    const admins = loadAdmins();
    return admins.includes(number);
  } catch (error) {
    console.error('❌ Error verificando admin:', error);
    return false;
  }
}

// Agregar administrador
export function addAdmin(number) {
  try {
    const admins = loadAdmins();
    if (!admins.includes(number)) {
      admins.push(number);
      return saveAdmins(admins);
    }
    return false;
  } catch (error) {
    console.error('❌ Error agregando admin:', error);
    return false;
  }
}

// Eliminar administrador
export function removeAdmin(number) {
  try {
    let admins = loadAdmins();
    const index = admins.indexOf(number);
    if (index !== -1) {
      admins.splice(index, 1);
      return saveAdmins(admins);
    }
    return false;
  } catch (error) {
    console.error('❌ Error eliminando admin:', error);
    return false;
  }
}

// Listar administradores
export function listAdmins() {
  return loadAdmins();
}
