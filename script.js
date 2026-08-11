/* ==============================================================================
 * CARA MEMBUAT PROJECT FIREBASE & MENDAPATKAN CONFIG:
 * ==============================================================================
 * 1. Buka browser, masuk ke: https://console.firebase.google.com/
 * 2. Login menggunakan akun Google Anda.
 * 3. Klik "Add project" (atau "Tambah proyek"), beri nama project (misal: "Belajar-Firestore"),
 *    lalu ikuti langkahnya sampai selesai (Google Analytics bisa dinonaktifkan).
 * 4. Setelah project dibuat, di halaman utama project (Dashboard):
 *    - Klik ikon Web (ikon "</>") untuk menambahkan Aplikasi Web baru.
 *    - Masukkan nama aplikasi (misal: "My Web App"), lalu klik "Register app".
 * 5. Gulir ke bawah di bagian "Firebase SDK snippet", pilih "Config".
 * 6. Salin (copy) objek `firebaseConfig` yang tampil di sana, lalu PASTE untuk menggantikan
 *    objek `firebaseConfig` di bawah ini.
 * 7. AKTIFKAN FIRESTORE DATABASE di Firebase Console:
 *    - Di menu sebelah kiri Console, klik "Build" -> "Firestore Database".
 *    - Klik "Create database" (Buat database).
 *    - Pilih lokasi (default saja), klik Next.
 *    - Pilih "Start in test mode" (Mulai dalam mode pengujian) agar aplikasi bisa
 *      membaca dan menulis data tanpa sistem login terlebih dahulu.
 *    - Klik "Enable" (Aktifkan).
 * ==============================================================================
 */

// 1. IMPORT SDK FIREBASE TERBARU DARI CDN (Menggunakan ES Modules)
// Kita hanya mengimpor fungsi-fungsi yang kita butuhkan saja (Modular SDK v9+)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. KONFIGURASI FIREBASE PROJECT
// Ganti nilai di bawah ini dengan firebaseConfig asli milik Anda dari Firebase Console!
const firebaseConfig = {
  apiKey: "AIzaSyCGwJwirzM3ijEkDdU51Tb4LBj1JG_kmWk",
  authDomain: "platform-food-waste.firebaseapp.com",
  projectId: "platform-food-waste",
  storageBucket: "platform-food-waste.firebasestorage.app",
  messagingSenderId: "125556305585",
  appId: "1:125556305585:web:437b4a978c9e94be28bc90",
  measurementId: "G-8M6H89D91L"
};

// 3. INISIALISASI FIREBASE & FIRESTORE
// `initializeApp` menghubungkan kode web kita ke project Firebase
const app = initializeApp(firebaseConfig);

// `getFirestore` menginisialisasi layanan database Firestore
const db = getFirestore(app);

// Referential elemen DOM (HTML)
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const messagesList = document.getElementById("messagesList");

// ==============================================================================
// FITUR 1: MENYIMPAN PESAN KE FIRESTORE (WRITE OPERATION)
// ==============================================================================
messageForm.addEventListener("submit", async (e) => {
  e.preventDefault(); // Mencegah browser reload halaman saat form di-submit

  const text = messageInput.value.trim();

  // Validasi agar tidak mengirim pesan kosong
  if (!text) return;

  try {
    // `addDoc` digunakan untuk menambah dokumen baru ke sebuah collection.
    // Jika collection "test_messages" belum ada di Firestore, Firestore akan otomatis membuatnya!
    await addDoc(collection(db, "test_messages"), {
      text: text,
      timestamp: serverTimestamp() // Menggunakan waktu server Firebase agar konsisten
    });

    // Reset isi input teks setelah berhasil dikirim
    messageInput.value = "";
  } catch (error) {
    console.error("Gagal mengirim pesan ke Firestore:", error);
    alert("Gagal mengirim pesan. Pastikan Anda sudah mengisi firebaseConfig dan mengaktifkan Firestore Database dalam Test Mode!");
  }
});

// ==============================================================================
// FITUR 2: MENDENGARKAN PERUBAHAN DATA SECARA REAL-TIME (READ REAL-TIME)
// ==============================================================================
// Kita membuat query ke collection "test_messages" yang diurutkan berdasarkan "timestamp" secara ascending (lama ke baru)
const messagesQuery = query(collection(db, "test_messages"), orderBy("timestamp", "asc"));

// `onSnapshot` adalah fungsi AJAIB dari Firestore!
// Fungsi ini akan terus 'mendengarkan' (listen) setiap kali ada perubahan pada collection/query.
// Jika ada pesan baru masuk (dari tab ini atau tab browser lain), callback di bawah akan OTOMATIS berjalan.
onSnapshot(messagesQuery, (snapshot) => {
  // Kosongkan kontainer daftar pesan sebelum menampilkan data terbaru
  messagesList.innerHTML = "";

  // Jika belum ada pesan sama sekali di Firestore
  if (snapshot.empty) {
    messagesList.innerHTML = `<p class="empty-state">Belum ada pesan. Ketik sesuatu di atas!</p>`;
    return;
  }

  // `snapshot.docs` berisi array dari semua dokumen pesan yang ada di collection
  snapshot.docs.forEach((doc) => {
    const data = doc.data(); // Mengambil data objek dari dokumen { text, timestamp }

    // Format timestamp jika tersedia (serverTimestamp butuh beberapa milidetik untuk tersimpan)
    let formattedTime = "Baru saja";
    if (data.timestamp) {
      const date = data.timestamp.toDate();
      formattedTime = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }

    // Buat elemen div untuk setiap pesan
    const messageEl = document.createElement("div");
    messageEl.className = "message-item";
    messageEl.innerHTML = `
      <div class="message-text">${escapeHtml(data.text)}</div>
      <span class="message-time">${formattedTime}</span>
    `;

    // Tambahkan elemen pesan ke dalam kontainer di HTML
    messagesList.appendChild(messageEl);
  });

  // Otomatis scroll ke pesan paling bawah jika pesan banyak
  messagesList.scrollTop = messagesList.scrollHeight;
}, (error) => {
  console.error("Gagal mendengarkan data Firestore real-time:", error);
  messagesList.innerHTML = `
    <p class="empty-state" style="color: #e53e3e;">
      ⚠️ Gagal memuat data. Mohon pastikan firebaseConfig sudah diisi dengan benar dari Firebase Console dan Firestore sudah diaktifkan dalam Test Mode.
    </p>
  `;
});

// Helper function sederhana untuk mencegah Cross-Site Scripting (XSS)
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
