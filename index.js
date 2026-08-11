/* ==============================================================================
 * INDEX.JS - LOGIKA REALTIME COUNTER DAMPAK UTAMA (LANDING PAGE)
 * ==============================================================================
 * Menggunakan `onSnapshot` dari Firestore untuk mendengarkan seluruh perubahan pada 
 * collection "food_listings". Dari data snapshot tersebut, kita menghitung 3 angka 
 * statistik agregasi secara real-time di sisi client:
 * 
 * 1. Total Porsi Diinput  : SUM(jumlahPorsi) dari seluruh dokumen.
 * 2. Total Disalurkan     : SUM(jumlahPorsi) dari dokumen dengan status "sudah diklaim".
 * 3. Jumlah Mitra Unik    : Jumlah namaRestoran unik (COUNT DISTINCT).
 * ==============================================================================
 */

import { db, collection, onSnapshot } from "./firebase-config.js";

// DOM Elements untuk angka statistik
const counterTotalPorsi = document.getElementById("counterTotalPorsi");
const counterPorsiDisalurkan = document.getElementById("counterPorsiDisalurkan");
const counterMitraUnik = document.getElementById("counterMitraUnik");

// Menyimpan nilai terakhir untuk animasi smooth count-up
let lastTotalPorsi = 0;
let lastPorsiDisalurkan = 0;
let lastMitraUnik = 0;

// ==============================================================================
// FIRESTORE REALTIME LISTENER UNTUK AGREGASI DAMPAK
// ==============================================================================
const foodListingsRef = collection(db, "food_listings");

onSnapshot(foodListingsRef, (snapshot) => {
  let totalPorsiAll = 0;
  let totalPorsiDisalurkan = 0;
  const uniqueRestaurants = new Set(); // Menggunakan Set JS untuk mendapatkan nilai unik (DISTINCT)

  // Iterasi dokumen di dalam snapshot Firestore
  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const porsi = Number(data.jumlahPorsi || 0);

    // 1. Tambahkan ke Total Porsi Keseluruhan
    totalPorsiAll += porsi;

    // 2. Jika status "sudah diklaim", tambahkan ke Total Porsi Disalurkan
    if (data.status === "sudah diklaim") {
      totalPorsiDisalurkan += porsi;
    }

    // 3. Catat nama restoran untuk menghitung mitra unik (case-insensitive & trimmed)
    if (data.namaRestoran && data.namaRestoran.trim() !== "") {
      uniqueRestaurants.add(data.namaRestoran.trim().toLowerCase());
    }
  });

  const totalMitraUnik = uniqueRestaurants.size;

  // Jalankan animasi count-up dari nilai lama ke nilai baru
  animateValue(counterTotalPorsi, lastTotalPorsi, totalPorsiAll, 1000);
  animateValue(counterPorsiDisalurkan, lastPorsiDisalurkan, totalPorsiDisalurkan, 1000);
  animateValue(counterMitraUnik, lastMitraUnik, totalMitraUnik, 1000);

  // Simpan nilai terbaru
  lastTotalPorsi = totalPorsiAll;
  lastPorsiDisalurkan = totalPorsiDisalurkan;
  lastMitraUnik = totalMitraUnik;

}, (error) => {
  console.error("Gagal mengambil data counter dampak realtime:", error);
  if (counterTotalPorsi) counterTotalPorsi.textContent = "0";
  if (counterPorsiDisalurkan) counterPorsiDisalurkan.textContent = "0";
  if (counterMitraUnik) counterMitraUnik.textContent = "0";
});

// ==============================================================================
// HELPER FUNCTION: ANIMASI COUNT-UP ANGKA
// ==============================================================================
function animateValue(element, start, end, duration) {
  if (!element) return;
  if (start === end) {
    element.textContent = end.toLocaleString("id-ID");
    return;
  }

  const range = end - start;
  let current = start;
  const increment = end > start ? 1 : -1;
  const stepTime = Math.abs(Math.floor(duration / (range || 1)));

  // Batasi kecepatan animasi jika angkanya sangat besar
  const actualStepTime = Math.max(stepTime, 20);
  const stepAmount = Math.max(1, Math.floor(Math.abs(range) / (duration / actualStepTime)));

  const timer = setInterval(() => {
    if (increment > 0) {
      current = Math.min(current + stepAmount, end);
    } else {
      current = Math.max(current - stepAmount, end);
    }
    
    element.textContent = current.toLocaleString("id-ID");

    if (current === end) {
      clearInterval(timer);
    }
  }, actualStepTime);
}
