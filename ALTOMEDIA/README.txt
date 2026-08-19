======================================================
  FOLDER ALTOMEDIA — PAKET RILIS CASHPOP
  Developer: ALTOMEDIA
  Kontak: altomediaindonesia@gmail.com
  Package: com.altomedia.cashpop
  Versi: 1.0.0
======================================================

Folder ini berisi semua dokumen dan aset yang dibutuhkan
untuk merilis CashPOP di Google Play Store.

========================================
DAFTAR FILE
========================================

📄 DOKUMEN LEGAL & KEBIJAKAN:
  PRIVACY_POLICY.md       - Kebijakan Privasi lengkap (Bahasa Indonesia)
  TERMS_OF_SERVICE.md     - Syarat & Ketentuan Layanan lengkap

📋 PANDUAN RILIS:
  UPLOAD_GUIDE.txt        - Panduan lengkap upload ke Play Console
  STORE_LISTING.txt       - Konten Store Listing (nama, deskripsi, keywords)
  BUILD_CONFIG.txt        - Konfigurasi build, keystore, dan EAS

📝 CATATAN & MARKETING:
  RELEASE_NOTES.txt       - Catatan rilis v1.0.0 + template versi berikutnya
  BLOG_ARTICLE.txt        - Artikel blog 4500+ karakter tentang CashPOP
  GRAPHICS_GUIDE.txt      - Panduan pembuatan aset visual Play Store

🖼️ ASET GRAFIS:
  graphics/
    feature_graphic.jpg   - Feature Graphic 1024×500 untuk Play Store
    screenshot_mining.jpg - Screenshot halaman Mining
    icon_512.png          - App icon 512×512 px

========================================
INFORMASI KEYSTORE
========================================

File        : ALTOMEDIA.jks (generate dengan perintah di BUILD_CONFIG.txt)
Password    : Kdsmedia@123
Alias       : kdsmedia
Key Pass    : Kdsmedia@123
Validity    : 10000 hari

⚠️  SIMPAN KEYSTORE DENGAN AMAN!
    Tanpa keystore, update aplikasi di Play Store TIDAK BISA dilakukan.

========================================
QUICK START CHECKLIST
========================================

Sebelum Upload ke Play Store:

1. BUILD:
   [ ] Jalankan: eas build --platform android --profile production-aab
   [ ] File AAB tersedia dan terverifikasi
   [ ] versionCode sudah diupdate (mulai dari 1)

2. STORE LISTING:
   [ ] App icon 512×512 siap
   [ ] Feature Graphic 1024×500 siap
   [ ] Min 2 screenshot ponsel siap
   [ ] Deskripsi dari STORE_LISTING.txt sudah dicopy

3. DOKUMEN LEGAL:
   [ ] Privacy Policy sudah di-host online
   [ ] URL Privacy Policy sudah dicatat
   [ ] Kuesioner rating konten IARC sudah dilengkapi

4. TEKNIS:
   [ ] minSdkVersion = 23 ✅
   [ ] targetSdkVersion = 34 ✅
   [ ] AdMob App ID sudah di AndroidManifest.xml
   [ ] google-services.json sudah ada

5. KONTAK:
   [ ] Email developer: altomediaindonesia@gmail.com ✅
   [ ] Akun Play Console aktif

========================================
ADMOB IDS
========================================

App ID      : ca-app-pub-6881903056221433~3325421892
Banner      : ca-app-pub-6881903056221433/7424449002
Interstitial: ca-app-pub-6881903056221433/7727701333
Rewarded    : ca-app-pub-6881903056221433/1162292985

======================================================
© 2025-2026 ALTOMEDIA
altomediaindonesia@gmail.com | Karawang, Jawa Barat, ID
======================================================
