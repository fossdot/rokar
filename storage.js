/* storage.js — the only file that knows WHERE the books are kept.
 *
 * Today: this browser, on this computer (localStorage). Nothing leaves the machine.
 * That means a cleared browser, a reinstall or a new computer loses the books,
 * so the app pushes a daily JSON backup. Treat that file as the real record.
 *
 * To move the books to a server, replace the two functions below with calls to
 * your backend and make them async (app.js awaits nothing today, so also change
 * boot() to await Storage.load()). The shape passed to save() and returned by
 * load() is one JSON object — see payload() in app.js.
 */
window.Storage = {
  key: "rokar.v1",

  /** @returns {string|null} raw JSON, or null when nothing is stored yet */
  load: function () {
    try {
      return localStorage.getItem(this.key);
    } catch (e) {
      return null; // private window, or site data blocked
    }
  },

  /** @returns {{ok:boolean, error?:string}} */
  save: function (obj) {
    try {
      localStorage.setItem(this.key, JSON.stringify(obj));
      return { ok: true };
    } catch (e) {
      var full = e && (e.name === "QuotaExceededError" || e.code === 22);
      return {
        ok: false,
        error: full
          ? "this browser's storage is full — back up and clear old months"
          : "storage is blocked in this browser"
      };
    }
  }
};
