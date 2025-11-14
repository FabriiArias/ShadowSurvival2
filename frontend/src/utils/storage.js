// /src/utils/storage.js
export const storage = {
  setUser(userData) {
    localStorage.setItem("user", JSON.stringify(userData));
  },

  getUser() {
    const data = localStorage.getItem("user");
    if (!data) return null;
    
    try {
      const user = JSON.parse(data);
      
      // 🔹 NORMALIZAR ESTRUCTURA: Si tiene user.user, aplanarlo
      if (user.user && typeof user.user === 'object') {
        // Combinar las propiedades del user interno con el objeto principal
        const normalizedUser = {
          ...user.user,  // Propiedades del user interno (id, username)
          token: user.token || user["token: "] // Mantener el token
        };
        
        // Guardar la estructura normalizada
        this.setUser(normalizedUser);
        return normalizedUser;
      }
      
      // 🔹 Normalizar clave del token (remover espacio si existe)
      if (user["token: "]) {
        user.token = user["token: "];
        delete user["token: "];
        this.setUser(user);
      }
      
      return user;
    } catch {
      return null;
    }
  },

  getToken() {
    const user = this.getUser();
    return user?.token || null;
  },

  clear() {
    localStorage.removeItem("user");
  },
};