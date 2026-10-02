const Storage3C = {
  key: "piso3c-datos",

  load() {
    try {
      return JSON.parse(localStorage.getItem(this.key)) || {};
    } catch {
      return {};
    }
  },

  save(data) {
    localStorage.setItem(this.key, JSON.stringify(data));
  },

  clear() {
    localStorage.removeItem(this.key);
  }
};
