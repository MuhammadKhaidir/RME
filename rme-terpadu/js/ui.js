/* Helper UI: escape HTML, format tanggal, toast, dialog, lencana, highlight. */
(function () {
  const App = (window.App = window.App || {});
  const ui = (App.ui = {});

  /* ---------- Dasar ---------- */
  ui.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  };
  ui.$ = (sel, root) => (root || document).querySelector(sel);
  ui.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  ui.debounce = function (fn, ms) {
    let t;
    return function (...a) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, a), ms);
    };
  };

  /** localStorage yang aman (bisa gagal di mode privat) */
  ui.storage = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        return false;
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    },
  };

  /* ---------- Tanggal & angka ---------- */
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const BULAN_PANJANG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const p2 = (n) => String(n).padStart(2, '0');

  ui.BULAN = BULAN;
  ui.toISO = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
  ui.toDateStr = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
  ui.parse = (s) => (s ? new Date(s.length === 10 ? s + 'T00:00' : s) : null);
  ui.sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  ui.dayDiff = (a, b) => Math.round((new Date(b.getFullYear(), b.getMonth(), b.getDate()) - new Date(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000);

  ui.fmtDate = (s) => {
    const d = ui.parse(s);
    return d ? `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}` : '-';
  };
  ui.fmtDateLong = (d) => `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN_PANJANG[d.getMonth()]} ${d.getFullYear()}`;
  ui.fmtTime = (s) => {
    const d = ui.parse(s);
    return d ? `${p2(d.getHours())}.${p2(d.getMinutes())}` : '-';
  };
  ui.fmtDateTime = (s) => (s ? `${ui.fmtDate(s)}, ${ui.fmtTime(s)}` : '-');
  ui.fmtNum = (n) => new Intl.NumberFormat('id-ID').format(n);

  ui.age = function (tglLahir, ref) {
    const b = ui.parse(tglLahir);
    const r = ref || new Date();
    if (!b) return { years: 0, text: '-' };
    let y = r.getFullYear() - b.getFullYear();
    let m = r.getMonth() - b.getMonth();
    if (r.getDate() < b.getDate()) m--;
    if (m < 0) {
      y--;
      m += 12;
    }
    return { years: y, text: y >= 5 ? `${y} tahun` : y >= 1 ? `${y} tahun ${m} bulan` : `${m} bulan` };
  };

  ui.relDay = function (s) {
    const d = ui.parse(s);
    if (!d) return '-';
    const n = ui.dayDiff(d, new Date());
    if (n === 0) return 'Hari ini';
    if (n === 1) return 'Kemarin';
    if (n < 30) return `${n} hari lalu`;
    if (n < 365) return `${Math.round(n / 30)} bulan lalu`;
    return `${(n / 365).toFixed(1).replace('.', ',')} tahun lalu`;
  };

  ui.greeting = function () {
    const h = new Date().getHours();
    return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam';
  };

  ui.maskNik = (nik) => (nik && nik.length === 16 ? `${nik.slice(0, 4)} •••• •••• ${nik.slice(12)}` : nik || '-');
  ui.initials = (nama) =>
    String(nama || '?')
      .replace(/^(dr\.|ns\.)\s*/i, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');

  /* ---------- Pencarian & highlight ---------- */
  ui.norm = (s) => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  /** Escape lalu bungkus kata kunci dengan <mark>. tokens = array kata (sudah dinormalisasi) */
  ui.hl = function (text, tokens) {
    const safe = ui.esc(text);
    const words = (tokens || []).filter((t) => t && t.length >= 1);
    if (!words.length) return safe;
    // Pencocokan dilakukan pada teks ternormalisasi dengan panjang yang sama, supaya posisi tetap sejajar
    const plain = String(text == null ? '' : text);
    const lower = plain.toLowerCase();
    const ranges = [];
    words.forEach((w) => {
      const needle = w.toLowerCase();
      if (!needle) return;
      let i = 0;
      while ((i = lower.indexOf(needle, i)) !== -1) {
        ranges.push([i, i + needle.length]);
        i += needle.length;
      }
    });
    if (!ranges.length) return safe;
    ranges.sort((a, b) => a[0] - b[0]);
    const merged = [ranges[0].slice()];
    for (let k = 1; k < ranges.length; k++) {
      const last = merged[merged.length - 1];
      if (ranges[k][0] <= last[1]) last[1] = Math.max(last[1], ranges[k][1]);
      else merged.push(ranges[k].slice());
    }
    let out = '';
    let pos = 0;
    merged.forEach(([s, e]) => {
      out += ui.esc(plain.slice(pos, s)) + '<mark>' + ui.esc(plain.slice(s, e)) + '</mark>';
      pos = e;
    });
    return out + ui.esc(plain.slice(pos));
  };

  /* ---------- Lencana ---------- */
  ui.jenisBadge = function (jenis) {
    return jenis === 'RI'
      ? `<span class="badge bg-violet-100 text-violet-800">${App.icon('bed', 'size-3.5')}Rawat inap</span>`
      : `<span class="badge bg-sky-100 text-sky-800">${App.icon('stethoscope', 'size-3.5')}Rawat jalan</span>`;
  };
  ui.statusBadge = function (status) {
    const map = {
      Terdaftar: 'bg-amber-100 text-amber-900',
      Diperiksa: 'bg-sky-100 text-sky-800',
      Selesai: 'bg-ink-100 text-ink-700',
      Dirawat: 'bg-violet-100 text-violet-800',
      Pulang: 'bg-ink-100 text-ink-700',
    };
    return `<span class="badge ${map[status] || 'bg-ink-100 text-ink-700'}">${ui.esc(status)}</span>`;
  };
  ui.roleBadge = function (role) {
    const map = {
      admin: 'bg-ink-800 text-white',
      pendaftaran: 'bg-amber-100 text-amber-900',
      klinisi: 'bg-sky-100 text-sky-800',
      rm: 'bg-brand-100 text-brand-800',
    };
    const r = App.auth.ROLES[role];
    return `<span class="badge ${map[role] || ''}">${ui.esc(r ? r.label : role)}</span>`;
  };
  ui.avatar = function (nama, size) {
    return `<span class="${size || 'size-10 text-sm'} inline-flex shrink-0 items-center justify-center rounded-md bg-brand-100 font-semibold text-brand-800" aria-hidden="true">${ui.esc(ui.initials(nama))}</span>`;
  };
  ui.alertBox = function (kind, html, iconName) {
    const styles = {
      warn: 'border-amber-300 bg-amber-50 text-amber-950',
      danger: 'border-rose-300 bg-rose-50 text-rose-950',
      info: 'border-violet-200 bg-violet-50 text-violet-950',
      ok: 'border-brand-200 bg-brand-50 text-brand-900',
    };
    const ic = iconName || (kind === 'danger' || kind === 'warn' ? 'alert' : kind === 'ok' ? 'circle-check' : 'info');
    return `<div class="flex items-start gap-3 rounded-md border px-3.5 py-3 text-sm ${styles[kind] || styles.info}" role="${kind === 'danger' ? 'alert' : 'note'}">${App.icon(ic, 'mt-0.5 size-4 shrink-0')}<div class="min-w-0">${html}</div></div>`;
  };
  ui.empty = function (title, body, actionHtml) {
    return `<div class="px-6 py-12 text-center">
      <p class="font-medium text-ink-900">${title}</p>
      ${body ? `<p class="mx-auto mt-1 max-w-md text-sm text-ink-500">${body}</p>` : ''}
      ${actionHtml ? `<div class="mt-4 flex justify-center">${actionHtml}</div>` : ''}
    </div>`;
  };

  /* ---------- Toast ---------- */
  ui.toast = function (message, kind) {
    const root = document.getElementById('toasts');
    if (!root) return;
    const el = document.createElement('div');
    const tone = kind === 'error' ? 'bg-rose-800' : 'bg-ink-900';
    el.className = `pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-md ${tone} px-4 py-3 text-sm text-white shadow-lg motion-safe:animate-[toast-in_.18s_ease-out]`;
    el.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    el.innerHTML = `${App.icon(kind === 'error' ? 'circle-alert' : 'circle-check', 'mt-0.5 size-4 shrink-0')}<span>${ui.esc(message)}</span>`;
    root.appendChild(el);
    setTimeout(() => el.remove(), kind === 'error' ? 6000 : 3800);
  };

  /* ---------- Dialog ---------- */
  /** Membuka <dialog> modal. Mengembalikan elemen dialog. */
  ui.dialog = function (html, opts) {
    const o = opts || {};
    const dlg = document.createElement('dialog');
    dlg.className = `m-auto w-[min(92vw,${o.width || '32rem'})] rounded-lg border border-ink-200 bg-white p-0 shadow-xl backdrop:bg-ink-900/45`;
    dlg.innerHTML = html;
    document.body.appendChild(dlg);
    dlg.addEventListener('close', () => dlg.remove());
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) dlg.close('cancel');
    });
    dlg.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => dlg.close('cancel')));
    dlg.showModal();
    return dlg;
  };

  ui.confirm = function ({ title, message, confirmText, danger }) {
    return new Promise((resolve) => {
      const dlg = ui.dialog(
        `<form method="dialog" class="p-5">
          <h2 class="text-base font-semibold">${ui.esc(title)}</h2>
          <p class="mt-2 text-sm text-ink-600">${message}</p>
          <div class="mt-5 flex justify-end gap-2">
            <button type="button" class="btn btn-secondary" data-close>Batal</button>
            <button value="ok" class="btn ${danger ? 'btn-danger' : 'btn-primary'}">${ui.esc(confirmText || 'Lanjutkan')}</button>
          </div>
        </form>`,
        { width: '26rem' }
      );
      dlg.addEventListener('close', () => resolve(dlg.returnValue === 'ok'));
    });
  };

  /* ---------- Input tag (alergi, tindakan, terapi) ---------- */
  /**
   * Mengubah <div data-tags> menjadi input tag.
   * opts: { values, placeholder, listId, onChange(values) }
   * Mengembalikan { get(), set(values) }
   */
  ui.tagInput = function (root, opts) {
    let values = (opts.values || []).slice();
    const inputId = 'tag-' + Math.random().toString(36).slice(2, 8);
    root.className = 'flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-ink-300 bg-white px-2 py-1.5 focus-within:border-brand-500 focus-within:outline-2 focus-within:outline-brand-500/30 hover:border-ink-400';
    let painting = false;
    function paint() {
      painting = true;
      root.innerHTML =
        values
          .map(
            (v, i) =>
              `<span class="inline-flex items-center gap-1 rounded bg-ink-100 py-0.5 pl-2 pr-1 text-sm text-ink-900">${ui.esc(v)}<button type="button" data-rm="${i}" class="rounded p-0.5 text-ink-500 hover:bg-ink-200 hover:text-ink-900" aria-label="Hapus ${ui.esc(v)}">${App.icon('x', 'size-3.5')}</button></span>`
          )
          .join('') +
        `<input id="${inputId}" class="min-w-32 flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-ink-400" placeholder="${ui.esc(opts.placeholder || '')}" ${opts.listId ? `list="${opts.listId}"` : ''} aria-label="${ui.esc(opts.label || opts.placeholder || 'Tambah')}" autocomplete="off">`;
      painting = false;
    }
    function commit(raw) {
      const t = raw.trim().replace(/,$/, '').trim();
      if (!t) return false;
      if (!values.some((v) => v.toLowerCase() === t.toLowerCase())) values.push(t);
      const cur = root.querySelector('input');
      if (cur) cur.value = ''; // kosongkan dulu supaya focusout saat input diganti tidak memproses ulang
      paint();
      root.querySelector('input').focus();
      opts.onChange && opts.onChange(values.slice());
      return true;
    }
    root.addEventListener('keydown', (e) => {
      if (e.target.tagName !== 'INPUT') return;
      if (e.key === 'Enter' || e.key === ',') {
        if (e.target.value.trim()) {
          e.preventDefault();
          commit(e.target.value);
        } else if (e.key === ',') e.preventDefault();
      } else if (e.key === 'Backspace' && !e.target.value && values.length) {
        values.pop();
        paint();
        root.querySelector('input').focus();
        opts.onChange && opts.onChange(values.slice());
      }
    });
    root.addEventListener('change', (e) => {
      // pilihan dari datalist memicu 'change'
      if (e.target.tagName === 'INPUT' && e.target.value.trim()) commit(e.target.value);
    });
    root.addEventListener('focusout', (e) => {
      if (painting) return;
      if (e.target.tagName === 'INPUT' && e.target.value.trim() && !root.contains(e.relatedTarget)) commit(e.target.value);
    });
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-rm]');
      if (b) {
        values.splice(Number(b.dataset.rm), 1);
        paint();
        root.querySelector('input').focus();
        opts.onChange && opts.onChange(values.slice());
      } else if (e.target === root) root.querySelector('input').focus();
    });
    paint();
    return {
      get: () => {
        const inp = root.querySelector('input');
        if (inp && inp.value.trim()) commit(inp.value);
        return values.slice();
      },
      set: (v) => {
        values = v.slice();
        paint();
      },
    };
  };

  /* ---------- Pagination ---------- */
  ui.pager = function (total, page, size) {
    const pages = Math.max(1, Math.ceil(total / size));
    if (pages <= 1) return '';
    const from = (page - 1) * size + 1;
    const to = Math.min(total, page * size);
    return `<div class="flex items-center justify-between gap-3 border-t border-ink-200 px-4 py-2.5 text-sm text-ink-600">
      <span>${from}–${to} dari ${ui.fmtNum(total)}</span>
      <div class="flex items-center gap-1">
        <button class="btn btn-secondary btn-sm" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>${App.icon('chevron-left', 'size-4')}Sebelumnya</button>
        <span class="px-2">Hal. ${page} / ${pages}</span>
        <button class="btn btn-secondary btn-sm" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>Berikutnya${App.icon('chevron-right', 'size-4')}</button>
      </div>
    </div>`;
  };

  ui.copy = async function (text, label) {
    try {
      await navigator.clipboard.writeText(text);
      ui.toast(`${label || 'Teks'} disalin`);
    } catch (e) {
      ui.toast('Tidak bisa menyalin otomatis. Salin secara manual.', 'error');
    }
  };
})();
