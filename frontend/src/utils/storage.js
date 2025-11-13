// /src/utils/storage.js
export const storage = {
  setUser(userData) {
    localStorage.setItem("user", JSON.stringify(userData));
  },

  getUser() {
    const data = localStorage.getItem("user");
    return data ? JSON.parse(data) : null;
  },

  getToken() {
    const data = localStorage.getItem("user");
    if (!data) return null;
    try {
      const user = JSON.parse(data);
      return user.token || null;
    } catch {
      return null;
    }
  },

  clear() {
    localStorage.removeItem("user");
  },
};
