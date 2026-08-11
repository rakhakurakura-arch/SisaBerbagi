/* ==============================================================================
 * NAVBAR.JS - LOGIKA HAMBURGER TOGGLE MENU MOBILE RESPONSIVE
 * ==============================================================================
 * Mengendalikan buka/tutup menu navigasi (.nav-links) pada layar HP/tablet (<768px)
 * saat tombol hamburger (#navToggle) diklik.
 * ==============================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.querySelector(".nav-links");

  if (navToggle && navLinks) {
    // Toggle class 'open' saat tombol hamburger diklik
    navToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      navLinks.classList.toggle("open");
      navToggle.classList.toggle("open");
    });

    // Otomatis tutup menu jika pengguna mengklik area di luar navbar
    document.addEventListener("click", (e) => {
      if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove("open");
        navToggle.classList.remove("open");
      }
    });

    // Otomatis tutup menu saat memilih salah satu link
    const links = navLinks.querySelectorAll(".nav-link");
    links.forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        navToggle.classList.remove("open");
      });
    });
  }
});
