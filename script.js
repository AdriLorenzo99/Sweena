/* =====================================================================
   Sweena – script.js
   1. Util            5. Keranjang (data & tampilan)
   2. Responsif       6. Katalog: tambah ke keranjang
   3. Dekorasi        7. Checkout: form, struk, unduh & kirim DM
      (teks berjalan,  8. Notifikasi
       garis retro)
   4. Navigasi
   ===================================================================== */

/* ---------- 1. Util ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const rupiah = n => "Rp " + Number(n).toLocaleString("id-ID");
const parseRupiah = s => Number(String(s).replace(/[^\d]/g, "")) || 0;
const IG_URL = "https://instagram.com/sweena.flo", DM_URL = "https://ig.me/m/sweena.flo";
const currentPage = () => location.pathname.split("/").pop() || "index.html";
const isMobile = () => document.documentElement.clientWidth < 768;
const visible = el => el.getClientRects().length > 0;

/* ---------- 2. Responsif ----------
   Frame desktop (1280px) & mobile (402px) diskalakan mengikuti lebar layar. */
function fit() {
  const vw = document.documentElement.clientWidth;
  $$(".fit").forEach(box => {
    const w = +box.dataset.width, h = +box.dataset.height, desktop = box.classList.contains("fit--desktop");
    const scale = desktop ? Math.min(1, vw / w) : Math.min(1.6, vw / w);
    box.style.width = w * scale + "px";
    box.style.height = h * scale + "px";
    const frame = box.firstElementChild;
    frame.style.width = w + "px"; frame.style.height = h + "px";
    frame.style.transform = `scale(${scale})`;
  });
}
addEventListener("resize", fit);

/* ---------- 3. Dekorasi ----------
   a) Garis retro: isi tiap <div class="retro-line*"> dengan kotak 14px selang-seling atas/bawah,
      jumlahnya mengikuti lebar elemen (1680px -> 120 kotak, 420px -> 30 kotak). */
function buildRetroLines() {
  $$('[class^="retro-line"]').forEach(line => {
    if (line.childElementCount) return;
    const SIZE = 14, count = Math.ceil(parseFloat(getComputedStyle(line).width) / SIZE);
    const squares = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const square = document.createElement("div");
      square.className = "retro-square"; square.style.left = i * SIZE + "px";
      squares.appendChild(square);
    }
    line.appendChild(squares);
  });
}

/* b) Teks berjalan "Celebrate Your Beautiful Moments..." */
function startMarquee() {
  $$(".frame p").forEach(p => {
    const text = p.textContent;
    if (p.dataset.marquee || !text.startsWith("Celebrate Your Beautiful Moments")) return;
    const second = text.indexOf("Celebrate", 1), unit = second > 0 ? text.slice(0, second) : text.trim() + " - ";
    const COPIES = 16, track = document.createElement("span");
    track.textContent = unit.repeat(COPIES); track.style.display = "inline-block";
    p.textContent = ""; p.appendChild(track); p.dataset.marquee = "1";
    const unitWidth = track.offsetWidth / COPIES; if (!unitWidth) return;
    track.animate([{ transform: "translateX(0)" }, { transform: `translateX(${-unitWidth}px)` }],
                  { duration: unitWidth / 70 * 1000, iterations: Infinity, easing: "linear" });
  });
}

/* ---------- 4. Navigasi ---------- */
function scrollToSection(key) {
  const target = [key, key + "-mobile"].map(id => document.getElementById(id)).find(el => el && visible(el));
  if (target) scrollTo({ top: target.getBoundingClientRect().top + scrollY - 24, behavior: "smooth" });
}
function goTo(url) {
  try { sessionStorage.setItem("sweena-prev", currentPage()); } catch (e) {}
  location.href = url;
}
function goBack() {
  let prev = "index.html";
  try { prev = sessionStorage.getItem("sweena-prev") || prev; } catch (e) {}
  location.href = prev === currentPage() ? "index.html" : prev;
}
/* Daftar aksi tombol (data-action="..."), diisi di bagian bawah file ini */
const ACTIONS = {};
const menu = $("#mobile-menu");
const overlay = $("#cart-overlay");
const openCart = () => { if (!overlay) return; overlay.hidden = false; $$(".toasts .fit").forEach(t => t.classList.remove("is-visible")); };
const closeCart = () => overlay && (overlay.hidden = true);

document.addEventListener("click", event => {
  /* tautan ke bagian di halaman utama (index.html#order, dst) */
  const link = event.target.closest("a[href]");
  if (link && !link.hasAttribute("download") && !event.target.closest("[data-action=checkout]")) {
    const [file, hash] = link.getAttribute("href").split("#");
    if (hash && file === "index.html" && currentPage() === "index.html") { event.preventDefault(); scrollToSection(hash); menu && (menu.hidden = true); return; }
    if (!link.target) { event.preventDefault(); goTo(link.getAttribute("href")); return; }
  }
  /* kartu kategori di landing page desktop (area persegi besar) */
  if (!event.target.closest("[data-action]") && !link) {
    const card = $$("[data-link]").find(el => { const r = el.getBoundingClientRect(); return r.width && event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom; });
    if (card) return goTo(card.dataset.link);
  }
  const action = event.target.closest("[data-action]"); if (!action) { if (menu && !event.target.closest("#mobile-menu")) menu.hidden = true; return; }
  const run = ACTIONS[action.dataset.action]; if (run) run(action, event);
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") { closeCart(); menu && (menu.hidden = true); }
  if ((event.key === "Enter" || event.key === " ") && event.target.matches("[role=button]")) { event.preventDefault(); event.target.click(); }
});

/* ---------- 5. Keranjang ----------
   Data disimpan di localStorage agar terbawa antar halaman. */
let receipt = null; /* struk terakhir yang dibuat; dihapus bila isi keranjang berubah */
const CART_KEY = "sweena-cart-v2"; /* "v2": data keranjang versi lama diabaikan agar tidak bentrok */
const isValidItem = i => i && typeof i.id === "string" && typeof i.name === "string" &&
  Number.isFinite(Number(i.price)) && Number.isFinite(Number(i.qty)) && Number(i.qty) > 0;
const Cart = {
  items: [],
  /* Selalu menghasilkan array; data rusak / format lama dibuang, bukan membuat skrip error */
  load() {
    let data = [];
    try { localStorage.removeItem("sweena-cart"); data = JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch (e) {}
    this.items = (Array.isArray(data) ? data : []).filter(isValidItem)
      .map(i => ({ id: i.id, name: i.name, price: Number(i.price), image: String(i.image || ""), qty: Math.floor(Number(i.qty)) }));
  },
  save() { receipt = null; try { localStorage.setItem(CART_KEY, JSON.stringify(this.items)); } catch (e) {} },
  add(product) {
    const found = this.items.find(i => i.id === product.id);
    found ? found.qty++ : this.items.push({ ...product, qty: 1 });
    this.save(); render();
  },
  change(id, delta) {
    const item = this.items.find(i => i.id === id); if (!item) return;
    item.qty += delta; if (item.qty <= 0) this.items = this.items.filter(i => i !== item);
    this.save(); render();
  },
  remove(id) { this.items = this.items.filter(i => i.id !== id); this.save(); render(); },
  clear() { this.items = []; this.save(); render(); },
  count() { return this.items.reduce((a, i) => a + i.qty, 0); },
  total() { return this.items.reduce((a, i) => a + i.qty * i.price, 0); }
};

/* Layout dinamis: elemen di bawah daerah yang berubah tinggi digeser (data-follow),
   dan wadah yang membungkusnya dipanjangkan (data-grow). Nilai awal dicatat sekali. */
const deltas = {};
function sum(ids) { return ids.split(" ").reduce((a, id) => a + (deltas[id] || 0), 0); }
function applyLayout() {
  $$("[data-follow]").forEach(el => { el.style.top = +el.dataset.baseTop + sum(el.dataset.follow) + "px"; });
  $$("[data-grow]").forEach(el => {
    el.style.height = +el.dataset.baseHeight + sum(el.dataset.grow) + "px";
    if (el.parentElement.classList.contains("frame")) el.closest(".fit").dataset.height = el.offsetHeight; /* frame paling luar ikut memanjang */
  });
  fit();
}

/* Item keranjang: dibuat dari template baris (hasil konversi desain) */
function fillRow(row, item) {
  const set = (name, text) => $$(`[data-bind="${name}"]`, row).forEach(el => (el.textContent = text));
  set("name", item.name); set("qty", item.qty); set("subtotal", rupiah(item.price * item.qty));
  $$('[data-bind="unit-price"]', row).forEach(el => (el.textContent = el.dataset.compact === "1" ? `Rp${item.price.toLocaleString("id-ID")}/Item` : `${rupiah(item.price)}/Item`));
  $$('[data-bind="image"]', row).forEach(el => (el.style.backgroundImage = `url(${item.image})`));
  $$("[data-action]", row).forEach(el => (el.dataset.id = item.id));
}
function renderRegion(slot) {
  const rowH = +slot.dataset.rowH, gap = +slot.dataset.gap, template = $("template", slot), empty = $(".items-empty", slot);
  $$(".item-clone", slot).forEach(el => el.remove());
  const items = Cart.items;
  empty.hidden = items.length > 0;
  items.forEach((item, i) => {
    const row = template.content.firstElementChild.cloneNode(true);
    row.classList.add("item-clone"); row.style.top = i * (rowH + gap) + "px"; fillRow(row, item); slot.appendChild(row);
  });
  const height = items.length ? items.length * rowH + (items.length - 1) * gap : +slot.dataset.emptyH;
  slot.style.height = height + "px";
  deltas[slot.dataset.region] = height - rowH;
}
function renderCount() {
  const count = Cart.count();
  $$('[data-bind="count"]').forEach(el => (el.textContent = count > 99 ? "99+" : count)); /* angka lama (timpaan "1" di HTML) diganti total sebenarnya */
  $$('[data-bind="count"], [data-bind="badge"]').forEach(el => (el.hidden = count === 0));
  $$('[data-bind="total"]').forEach(el => (el.textContent = rupiah(Cart.total())));
}
/* Tiap langkah dijalankan terpisah: kalau satu gagal, yang lain tetap berjalan */
const attempt = fn => { try { fn(); } catch (e) { console.error(e); } };
function render() {
  attempt(() => $$('[data-kind="items"]').forEach(renderRegion));
  attempt(renderCount);
  attempt(renderReceiptSection);
  attempt(applyLayout);
}

/* tombol di dalam baris item (+, -, hapus) */
Object.assign(ACTIONS, {
  inc: el => Cart.change(el.dataset.id, +1),
  dec: el => Cart.change(el.dataset.id, -1),
  remove: el => Cart.remove(el.dataset.id),
  "open-cart": openCart, "close-cart": closeCart, back: goBack,
  "toggle-menu": () => menu && (menu.hidden = !menu.hidden),
  checkout: (el, e) => { e.preventDefault(); if (!Cart.items.length) return toast("error", "Keranjang masih kosong"); goTo("checkout.html"); }
});

/* ---------- 6. Katalog: tambah ke keranjang ---------- */
ACTIONS["add-to-cart"] = el => {
  const card = el.closest("[data-product]"); if (!card) return;
  const name = $('[data-field="name"]', card).textContent.trim();
  const price = parseRupiah($('[data-field="price"]', card).textContent);
  const bg = getComputedStyle($('[data-field="image"]', card)).backgroundImage;
  const image = bg.replace(/^url\(["']?|["']?\)$/g, "").replace(/^.*\/images\//, "images/"); /* simpan path relatif */
  Cart.add({ id: (document.body.dataset.category || "x") + ":" + name.toLowerCase(), name, price, image });
  toast("added");
};

/* ---------- 7. Checkout ---------- */
const form = {}; /* nilai isian, dipakai bersama oleh versi desktop & mobile */
const REQUIRED = ["nama", "kontak", "jalan", "kelurahan", "kecamatan", "kota", "provinsi", "kodepos"];
/* (variabel `receipt` dideklarasikan di bagian Keranjang) */

document.addEventListener("input", event => {
  const input = event.target.closest("[data-field-input]"); if (!input) return;
  form[input.name] = input.value; input.classList.remove("is-invalid");
  $$(`[data-field-input="${input.name}"]`).forEach(other => { if (other !== input) other.value = input.value; });
});

function makeReceipt() {
  const id = new Date().toISOString().replace(/\D/g, "").slice(0, 14) + Math.floor(Math.random() * 90 + 10);
  const f = k => (form[k] || "").trim();
  const rt = f("rt") ? ` RT ${f("rt")}` : "", rw = f("rw") ? `, RW ${f("rw")}` : "";
  const order = Cart.items.map(i => `${i.name} (Qty : ${i.qty})\n${rupiah(i.price)} (x${i.qty})`).join("\n");
  return {
    id,
    rows: [["ID Pesanan", id], ["Nama Pemesan", f("nama")], ["Kontak", f("kontak")],
           ["Alamat", `${f("jalan")}${rt}${rw}.\nKelurahan ${f("kelurahan")}, Kecamatan ${f("kecamatan")},\nKota ${f("kota")}, Provinsi ${f("provinsi")}, ${f("kodepos")}`],
           ["Pesanan", order], ["Harga Total", rupiah(Cart.total())], ["Catatan", f("catatan") || "-"]]
  };
}
const receiptText = r => r.rows.map(([k, v]) => `${k} : ${v}`).join("\n");

/* Kartu "Detail Belanja": tersembunyi sampai struk dicetak, tingginya mengikuti isi struk */
function renderReceiptSection() {
  $$('[data-kind="toggle"]').forEach(card => {
    card.hidden = !receipt;
    deltas[card.dataset.region] = receipt ? 0 : -(+card.dataset.baseH);
  });
  $$('[data-kind="receipt"]').forEach(region => {
    deltas[region.dataset.region] = 0;
    if (!receipt) return;
    const body = $(".receipt", region); body.textContent = "";
    receipt.rows.forEach(([label, value]) => {
      const row = document.createElement("div"); row.className = "receipt__row";
      row.innerHTML = '<span class="receipt__label"></span><span class="receipt__value"></span>';
      row.firstChild.textContent = label; row.lastChild.textContent = value; body.appendChild(row);
    });
    region.style.height = body.offsetHeight + "px";
    deltas[region.dataset.region] = body.offsetHeight - +region.dataset.baseH;
  });
}

ACTIONS["generate-receipt"] = () => {
  const missing = REQUIRED.filter(k => !(form[k] || "").trim());
  $$("[data-field-input]").forEach(el => el.classList.toggle("is-invalid", missing.includes(el.name)));
  if (!Cart.items.length) return toast("error", "Keranjang masih kosong");
  if (missing.length) {
    toast("error", "Lengkapi data pemesan yang wajib diisi");
    return $$("[data-field-input].is-invalid").find(visible)?.focus();
  }
  receipt = makeReceipt(); render();
  const card = $$('[data-kind="toggle"]').find(visible); card && card.scrollIntoView({ behavior: "smooth", block: "start" });
};

ACTIONS["send-receipt"] = async () => {
  if (!receipt) return toast("error", "Cetak struk belanja dulu");
  try { await navigator.clipboard.writeText(receiptText(receipt)); toast("added", "Struk disalin, tempel di DM Instagram"); } catch (e) {}
  open(DM_URL, "_blank", "noopener");
};

ACTIONS["download-receipt"] = () => {
  if (!receipt) return toast("error", "Cetak struk belanja dulu");
  const W = 900, pad = 48, lh = 34, labelW = 235, font = "22px Poppins, Inter, sans-serif";
  const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d");
  ctx.font = font;
  const lines = [];
  receipt.rows.forEach(([label, value]) => {
    const wrapped = []; value.split("\n").forEach(part => {
      let line = ""; part.split(" ").forEach(word => { const t = line ? line + " " + word : word; if (ctx.measureText(t).width > W - 2 * pad - labelW && line) { wrapped.push(line); line = word; } else line = t; });
      wrapped.push(line);
    });
    wrapped.forEach((text, i) => lines.push([i === 0 ? label + " :" : "", text]));
    lines.push(["", ""]);
  });
  canvas.width = W; canvas.height = pad * 2 + 70 + lines.length * lh;
  ctx.fillStyle = "#f7fbff"; ctx.fillRect(0, 0, W, canvas.height);
  ctx.strokeStyle = "#a9cde8"; ctx.lineWidth = 3; ctx.strokeRect(12, 12, W - 24, canvas.height - 24);
  ctx.fillStyle = "#204b70"; ctx.font = "40px 'DM Serif Display', Georgia, serif"; ctx.fillText("Detail Belanja Sweena", pad, pad + 36);
  ctx.font = font; lines.forEach(([label, text], i) => {
    const y = pad + 90 + i * lh; ctx.fillStyle = "#204b70"; ctx.fillText(label, pad, y); ctx.fillStyle = "#466c8c"; ctx.fillText(text, pad + labelW, y);
  });
  const filename = `struk-sweena-${receipt.id}.png`;
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000); toast("downloaded");
  }, "image/png");
};

/* ---------- 8. Notifikasi ---------- */
let toastTimer;
function toast(kind, message) {
  $$(".toasts .fit").forEach(t => t.classList.remove("is-visible"));
  const variant = isMobile() ? "mobile" : "desktop";
  const type = kind === "error" ? "added" : kind;
  const box = $(`.toasts .fit--${variant}[data-toast="${type}"]`); if (!box) return;
  const text = $('[data-bind="toast-text"]', box), icon = $("[data-toast-icon]", box);
  if (!box.dataset.original) box.dataset.original = text.textContent;
  text.textContent = message || box.dataset.original; if (icon) icon.hidden = kind === "error";
  box.classList.add("is-visible"); clearTimeout(toastTimer); toastTimer = setTimeout(() => box.classList.remove("is-visible"), 2400);
}

/* ---------- Mulai ---------- */
Cart.load();
buildRetroLines();
fit(); render();
(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => { startMarquee(); applyLayout(); });
addEventListener("load", () => { const key = location.hash.slice(1); if (key) setTimeout(() => scrollToSection(key), 300); });
