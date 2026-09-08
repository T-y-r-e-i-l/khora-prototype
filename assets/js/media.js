/* ============================================================
   Palinode — Media store

   Photos, video and audio live in IndexedDB rather than in the
   note record. localStorage would be exhausted by a single
   photograph; IndexedDB holds hundreds of megabytes and keeps
   binaries out of the JSON that gets serialised on every save.

   Object URLs are cached and revoked, so a note can be reopened
   repeatedly without leaking handles.
   ============================================================ */

(function () {
  const DB = 'palinode.media';
  const STORE = 'blobs';
  let dbp = null;
  const urls = new Map();          // attachmentId -> objectURL
  let available = true;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      let req;
      try { req = indexedDB.open(DB, 1); }
      catch (e) { available = false; return reject(e); }
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => { available = false; reject(req.error); };
    });
    return dbp;
  }

  function tx(mode, fn) {
    return open().then(db => new Promise((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const store = t.objectStore(STORE);
      const req = fn(store);
      t.oncomplete = () => resolve(req && req.result);
      t.onerror = () => reject(t.error);
    }));
  }

  const Media = {
    supported: () => available && typeof indexedDB !== 'undefined',

    put(id, blob) { return tx('readwrite', s => s.put(blob, id)); },

    get(id) { return tx('readonly', s => s.get(id)); },

    async url(id) {
      if (urls.has(id)) return urls.get(id);
      const blob = await Media.get(id);
      if (!blob) return null;
      const u = URL.createObjectURL(blob);
      urls.set(id, u);
      return u;
    },

    async del(id) {
      if (urls.has(id)) { URL.revokeObjectURL(urls.get(id)); urls.delete(id); }
      return tx('readwrite', s => s.delete(id));
    },

    release() {
      urls.forEach(u => URL.revokeObjectURL(u));
      urls.clear();
    },

    // For export: the blob as a data: URI so the file stands alone.
    async dataUrl(id) {
      const blob = await Media.get(id);
      if (!blob) return null;
      return await new Promise(res => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = () => res(null);
        r.readAsDataURL(blob);
      });
    },

    kindOf(file) {
      const t = (file.type || '').toLowerCase();
      if (t.startsWith('image/')) return 'image';
      if (t.startsWith('video/')) return 'video';
      if (t.startsWith('audio/')) return 'audio';
      return 'file';
    },

    human(bytes) {
      if (!bytes && bytes !== 0) return '';
      const u = ['B', 'KB', 'MB', 'GB'];
      let i = 0, n = bytes;
      while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
      return (n < 10 && i > 0 ? n.toFixed(1) : Math.round(n)) + ' ' + u[i];
    }
  };

  window.PalinodeMedia = Media;
})();
