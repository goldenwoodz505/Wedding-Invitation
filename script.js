(() => {
  'use strict';

  /* ========================================================================
     1. Konfigurasi Undangan (Ubah sebelum deploy ke GitHub Pages)
     ======================================================================== */
  const INVITATION_CONFIG = {
    eventTitle: 'Pernikahan Hosea & Zahra',
    songTitle: "You're Still the One - Shania Twain",
    eventStartIso: '2026-12-13T16:00:00+07:00',
    eventEndIso: '2026-12-13T20:00:00+07:00',

    venueName: 'Astanaraya Suites Hotel',
    venueAddress: 'Jl. Ciledug Raya No. 17, Kreo Selatan, Kec. Larangan, Kota Tangerang, Banten 15156',
    mapsUrl: 'https://www.google.com/maps/place//data=!4m2!3m1!1s0x2e69f11cc99b7415:0x208f138cfdf9eafe?sa=X&ved=1t:8290&ictx=111',

    gifts: [
      {
        bank: 'BCA',
        number: '4740687170',
        holder: 'a.n. Zahra Aqila',
      },
    ],

    gallery: [
      {
        id: '01',
        layout: 'arch',
        src: './assets/image/prewed-1.jpg',
        expectedFile: 'prewed-1.jpg',
        objectPosition: 'center 82%',
        alt: 'Foto Prewedding Hosea dan Zahra di bawah pohon hijau',
      },
      {
        id: '02',
        layout: 'tall',
        src: './assets/image/prewed-3.jpg',
        expectedFile: 'prewed-3.jpg',
        objectPosition: 'center 62%',
        alt: 'Foto Prewedding Hosea dan Zahra berdiri di depan rak buku kayu',
      },
      {
        id: '03',
        layout: 'tall',
        src: './assets/image/prewed-4.jpg',
        expectedFile: 'prewed-4.jpg',
        objectPosition: 'center 85%',
        alt: 'Foto Prewedding Hosea dan Zahra duduk bersama di depan rak buku',
      },
      {
        id: '04',
        layout: 'wide',
        src: './assets/image/prewed-2.jpg',
        expectedFile: 'prewed-2.jpg',
        objectPosition: 'center center',
        alt: 'Foto Prewedding Hosea dan Zahra menikmati teh bersama di meja dapur',
      },
    ],

    // TODO: Tempel URL Web App Google Apps Script di sini agar RSVP tersimpan ke Google Sheets.
    // Jika dibiarkan kosong, form tetap berfungsi menggunakan penyimpanan lokal browser (localStorage).
    googleScriptUrl: '',
    storageKey: 'hosea_zahra_rsvp_v2',
  };

  /* ========================================================================
     2. Referensi Elemen DOM
     ======================================================================== */
  const dom = {
    body: document.body,
    coverGate: document.getElementById('cover-gate'),
    guestName: document.getElementById('guest-name'),
    openBtn: document.getElementById('open-invitation-btn'),
    mainContent: document.getElementById('main-content'),

    audio: document.getElementById('bgm-audio'),
    audioToggle: document.getElementById('audio-toggle'),
    bottomNav: document.getElementById('bottom-nav'),
    navLinks: Array.from(document.querySelectorAll('.bottom-nav__link')),

    cdDays: document.getElementById('cd-days'),
    cdHours: document.getElementById('cd-hours'),
    cdMinutes: document.getElementById('cd-minutes'),
    cdSeconds: document.getElementById('cd-seconds'),
    cdStatus: document.getElementById('countdown-status'),

    venueName: document.getElementById('venue-name'),
    venueAddress: document.getElementById('venue-address'),
    mapsLink: document.getElementById('maps-link'),
    downloadIcsBtn: document.getElementById('download-ics-btn'),

    giftModal: document.getElementById('gift-modal'),
    openGiftBtn: document.getElementById('open-gift-modal-btn'),
    closeGiftBtn: document.getElementById('close-gift-modal-btn'),
    giftAccountsList: document.getElementById('gift-accounts-list'),

    gallerySpread: document.getElementById('gallery-spread'),
    lightbox: document.getElementById('lightbox-modal'),
    lightboxImg: document.getElementById('lightbox-img'),
    lightboxCaption: document.getElementById('lightbox-caption'),
    lightboxCloseBtn: document.getElementById('lightbox-close-btn'),
    lightboxPrevBtn: document.getElementById('lightbox-prev-btn'),
    lightboxNextBtn: document.getElementById('lightbox-next-btn'),

    rsvpForm: document.getElementById('rsvp-form'),
    rsvpName: document.getElementById('rsvp-name'),
    rsvpNameError: document.getElementById('rsvp-name-error'),
    rsvpStatusSelect: document.getElementById('rsvp-status-select'),
    rsvpGuests: document.getElementById('rsvp-guests'),
    rsvpMessage: document.getElementById('rsvp-message'),
    rsvpMessageError: document.getElementById('rsvp-message-error'),
    rsvpFeedback: document.getElementById('rsvp-form-feedback'),
    rsvpSubmitBtn: document.getElementById('rsvp-submit-btn'),

    wishesCount: document.getElementById('wishes-count'),
    wishesLoading: document.getElementById('wishes-loading'),
    wishesError: document.getElementById('wishes-error'),
    wishesEmpty: document.getElementById('wishes-empty'),
    wishesList: document.getElementById('wishes-list'),

    toast: document.getElementById('toast'),
  };

  let toastTimer = null;
  let lastFocusedEl = null;
  let activeGalleryItems = [];
  let currentLightboxIndex = 0;

  /* ========================================================================
     3. Toast Notification
     ======================================================================== */
  function showToast(message) {
    if (!dom.toast) return;
    dom.toast.textContent = message;
    dom.toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      dom.toast.hidden = true;
    }, 3200);
  }

  /* ========================================================================
     4. Parameter URL (?to=Nama+Tamu)
     ======================================================================== */
  function initGuestName() {
    const params = new URLSearchParams(window.location.search);
    const rawGuest = params.get('to');
    const cleanGuest = rawGuest ? rawGuest.trim().slice(0, 80) : '';
    const finalName = cleanGuest || 'Tamu Undangan';

    if (dom.guestName) {
      dom.guestName.textContent = finalName;
    }

    if (cleanGuest && dom.rsvpName && !dom.rsvpName.value) {
      dom.rsvpName.value = cleanGuest;
    }
  }

  /* ========================================================================
     5. Hydrate Venue Info
     ======================================================================== */
  function initVenueInfo() {
    if (dom.venueName) dom.venueName.textContent = INVITATION_CONFIG.venueName;
    if (dom.venueAddress) dom.venueAddress.textContent = INVITATION_CONFIG.venueAddress;
    if (dom.mapsLink) dom.mapsLink.href = INVITATION_CONFIG.mapsUrl;
  }

  /* ========================================================================
     6. Cover Gate & Audio Controller
     ======================================================================== */
  function updateAudioButton(isPlaying) {
    if (!dom.audioToggle) return;
    dom.audioToggle.classList.toggle('is-playing', isPlaying);
    dom.audioToggle.setAttribute('aria-pressed', String(isPlaying));
    dom.audioToggle.setAttribute(
      'aria-label',
      isPlaying
        ? `Jeda ${INVITATION_CONFIG.songTitle}`
        : `Putar ${INVITATION_CONFIG.songTitle}`
    );
  }

  async function playAudio(notifyOnFail) {
    if (!dom.audio) return false;
    try {
      await dom.audio.play();
      updateAudioButton(true);
      return true;
    } catch {
      updateAudioButton(false);
      if (notifyOnFail) {
        showToast(
          `File audio "${INVITATION_CONFIG.songTitle}" belum ditemukan. Simpan file MP3 ke ./assets/audio/youre-still-the-one.mp3.`
        );
      }
      return false;
    }
  }

  function initCoverAndAudio() {
    if (dom.openBtn && dom.coverGate) {
      dom.openBtn.addEventListener('click', () => {
        dom.coverGate.classList.add('is-opened');
        dom.coverGate.setAttribute('aria-hidden', 'true');
        dom.body.classList.remove('is-locked');

        if (dom.audioToggle) dom.audioToggle.hidden = false;
        if (dom.bottomNav) dom.bottomNav.hidden = false;

        playAudio(false);

        document.querySelectorAll('.hero-section .reveal').forEach((el) => {
          el.classList.add('is-visible');
        });

        if (dom.mainContent) {
          dom.mainContent.focus({ preventScroll: true });
        }
      });
    }

    if (dom.audioToggle && dom.audio) {
      dom.audioToggle.addEventListener('click', () => {
        if (dom.audio.paused) {
          playAudio(true);
        } else {
          dom.audio.pause();
          updateAudioButton(false);
        }
      });

      dom.audio.addEventListener('play', () => updateAudioButton(true));
      dom.audio.addEventListener('pause', () => updateAudioButton(false));
    }
  }

  /* ========================================================================
     7. Live Countdown (13 Desember 2026, 16:00 WIB)
     ======================================================================== */
  function initCountdown() {
    const targetMs = new Date(INVITATION_CONFIG.eventStartIso).getTime();

    function pad(value) {
      return String(Math.max(0, value)).padStart(2, '0');
    }

    function update() {
      const diff = targetMs - Date.now();
      if (diff <= 0) {
        dom.cdDays.textContent = '00';
        dom.cdHours.textContent = '00';
        dom.cdMinutes.textContent = '00';
        dom.cdSeconds.textContent = '00';
        if (dom.cdStatus) {
          dom.cdStatus.textContent = 'Hari bahagia telah tiba.';
          dom.cdStatus.hidden = false;
        }
        return false;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      dom.cdDays.textContent = pad(days);
      dom.cdHours.textContent = pad(hours);
      dom.cdMinutes.textContent = pad(minutes);
      dom.cdSeconds.textContent = pad(seconds);
      return true;
    }

    if (update()) {
      const timer = window.setInterval(() => {
        if (!update()) window.clearInterval(timer);
      }, 1000);
    }
  }

  /* ========================================================================
     8. Generator File Kalender (.ics)
     ======================================================================== */
  function toIcsUtc(isoString) {
    return new Date(isoString).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  }

  function escapeIcs(text) {
    return String(text)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  function initCalendarGenerator() {
    if (!dom.downloadIcsBtn) return;

    dom.downloadIcsBtn.addEventListener('click', () => {
      const location = `${INVITATION_CONFIG.venueName}, ${INVITATION_CONFIG.venueAddress}`;
      const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Hosea Zahra Wedding//ID',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        'UID:hosea-zahra-20261213@wedding',
        `DTSTAMP:${toIcsUtc(new Date().toISOString())}`,
        `DTSTART:${toIcsUtc(INVITATION_CONFIG.eventStartIso)}`,
        `DTEND:${toIcsUtc(INVITATION_CONFIG.eventEndIso)}`,
        `SUMMARY:${escapeIcs(INVITATION_CONFIG.eventTitle)}`,
        'DESCRIPTION:Akad Nikah: 16.00 - 17.00 WIB\\nResepsi: 17.00 - 20.00 WIB\\nPernikahan Hosea Dicky Pratama & Zahra Aqila.',
        `LOCATION:${escapeIcs(location)}`,
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');

      const blob = new Blob([lines], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pernikahan-hosea-zahra.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('File kalender (.ics) berhasil diunduh.');
    });
  }

  /* ========================================================================
     9. Amplop Digital Modal & 1-Click Copy Clipboard
     ======================================================================== */
  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const input = document.createElement('textarea');
    input.value = text;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  }

  function renderGiftAccounts() {
    if (!dom.giftAccountsList) return;
    dom.giftAccountsList.textContent = '';

    INVITATION_CONFIG.gifts.forEach((acc) => {
      const card = document.createElement('div');
      card.className = 'gift-account';

      const bank = document.createElement('p');
      bank.className = 'gift-account__bank';
      bank.textContent = acc.bank;

      const number = document.createElement('p');
      number.className = 'gift-account__number';
      number.textContent = acc.number;

      const holder = document.createElement('p');
      holder.className = 'gift-account__holder';
      holder.textContent = acc.holder;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn--outline-velvet gift-account__btn';
      btn.textContent = 'Salin Nomor';
      btn.addEventListener('click', async () => {
        try {
          await copyText(acc.number);
          showToast(`Nomor rekening ${acc.bank} berhasil disalin.`);
        } catch {
          showToast('Tidak dapat menyalin otomatis. Silakan salin nomor secara manual.');
        }
      });

      card.append(bank, number, holder, btn);
      dom.giftAccountsList.appendChild(card);
    });
  }

  function openGiftModal() {
    if (!dom.giftModal) return;
    lastFocusedEl = document.activeElement;
    dom.giftModal.hidden = false;
    dom.body.classList.add('modal-open');
    if (dom.closeGiftBtn) dom.closeGiftBtn.focus();
  }

  function closeGiftModal() {
    if (!dom.giftModal || dom.giftModal.hidden) return;
    dom.giftModal.hidden = true;
    dom.body.classList.remove('modal-open');
    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
      lastFocusedEl.focus();
    }
  }

  function initGiftModal() {
    renderGiftAccounts();

    if (dom.openGiftBtn) dom.openGiftBtn.addEventListener('click', openGiftModal);
    if (dom.closeGiftBtn) dom.closeGiftBtn.addEventListener('click', closeGiftModal);

    if (dom.giftModal) {
      dom.giftModal.addEventListener('click', (event) => {
        if (event.target && event.target.getAttribute('data-close-modal') === 'true') {
          closeGiftModal();
        }
      });
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && dom.giftModal && !dom.giftModal.hidden) {
        closeGiftModal();
      }
    });
  }

  /* ========================================================================
     9B. Galeri Foto Prewedding & Lightbox Modal
     ======================================================================== */
  function buildGalleryFigure(item) {
    const figure = document.createElement('figure');
    figure.className = 'gallery-item';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `gallery-card gallery-card--${item.layout}`;

    const media = document.createElement('div');
    media.className = 'gallery-card__media';

    if (item.src) {
      btn.setAttribute('aria-label', `Lihat ukuran penuh: ${item.alt}`);
      const img = document.createElement('img');
      img.className = 'gallery-card__img';
      img.src = item.src;
      img.alt = item.alt;
      img.loading = 'lazy';
      img.decoding = 'async';
      if (item.objectPosition) {
        img.style.objectPosition = item.objectPosition;
      }
      media.appendChild(img);

      btn.addEventListener('click', () => {
        const idx = activeGalleryItems.findIndex((g) => g.id === item.id);
        openLightbox(idx >= 0 ? idx : 0);
      });
    } else {
      btn.setAttribute('aria-label', `Slot foto prewedding ${item.id} belum diisi`);
      const placeholder = document.createElement('div');
      placeholder.className = 'gallery-card__placeholder';

      const indexEl = document.createElement('span');
      indexEl.className = 'gallery-card__index';
      indexEl.textContent = item.id;

      const labelEl = document.createElement('span');
      labelEl.className = 'gallery-card__slot-label';
      labelEl.textContent = `[Foto Prewed ${item.id}]`;

      const fileEl = document.createElement('span');
      fileEl.className = 'gallery-card__slot-file';
      fileEl.textContent = item.expectedFile;

      placeholder.append(indexEl, labelEl, fileEl);
      media.appendChild(placeholder);

      btn.addEventListener('click', () => {
        showToast(`Tambahkan foto ke ./assets/image/${item.expectedFile} untuk mengisi slot ini.`);
      });
    }

    btn.appendChild(media);
    figure.appendChild(btn);

    return figure;
  }

  function updateLightboxView() {
    const item = activeGalleryItems[currentLightboxIndex];
    if (!item || !dom.lightboxImg || !dom.lightboxCaption) return;
    dom.lightboxImg.src = item.src;
    dom.lightboxImg.alt = item.alt;
    dom.lightboxCaption.textContent = item.caption || item.alt;

    const single = activeGalleryItems.length <= 1;
    if (dom.lightboxPrevBtn) dom.lightboxPrevBtn.disabled = single;
    if (dom.lightboxNextBtn) dom.lightboxNextBtn.disabled = single;
  }

  function openLightbox(index) {
    if (!dom.lightbox || activeGalleryItems.length === 0) return;
    lastFocusedEl = document.activeElement;
    currentLightboxIndex = index;
    updateLightboxView();
    dom.lightbox.hidden = false;
    dom.body.classList.add('modal-open');
    if (dom.lightboxCloseBtn) dom.lightboxCloseBtn.focus();
  }

  function closeLightbox() {
    if (!dom.lightbox || dom.lightbox.hidden) return;
    dom.lightbox.hidden = true;
    dom.body.classList.remove('modal-open');
    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
      lastFocusedEl.focus();
    }
  }

  function stepLightbox(delta) {
    if (activeGalleryItems.length <= 1) return;
    currentLightboxIndex =
      (currentLightboxIndex + delta + activeGalleryItems.length) % activeGalleryItems.length;
    updateLightboxView();
  }

  function initGallery() {
    if (!dom.gallerySpread) return;
    const items = INVITATION_CONFIG.gallery || [];
    activeGalleryItems = items.filter((item) => Boolean(item.src));
    dom.gallerySpread.textContent = '';

    let i = 0;
    while (i < items.length) {
      const current = items[i];
      const next = items[i + 1];

      if (current.layout === 'tall' && next && next.layout === 'tall') {
        const row = document.createElement('div');
        row.className = 'gallery-row gallery-row--stagger';
        row.append(buildGalleryFigure(current), buildGalleryFigure(next));
        dom.gallerySpread.appendChild(row);
        i += 2;
      } else {
        dom.gallerySpread.appendChild(buildGalleryFigure(current));
        i += 1;
      }
    }

    if (dom.lightboxCloseBtn) dom.lightboxCloseBtn.addEventListener('click', closeLightbox);
    if (dom.lightboxPrevBtn) dom.lightboxPrevBtn.addEventListener('click', () => stepLightbox(-1));
    if (dom.lightboxNextBtn) dom.lightboxNextBtn.addEventListener('click', () => stepLightbox(1));

    if (dom.lightbox) {
      dom.lightbox.addEventListener('click', (event) => {
        if (event.target && event.target.getAttribute('data-close-lightbox') === 'true') {
          closeLightbox();
        }
      });
    }

    document.addEventListener('keydown', (event) => {
      if (!dom.lightbox || dom.lightbox.hidden) return;
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') stepLightbox(-1);
      if (event.key === 'ArrowRight') stepLightbox(1);
    });
  }

  /* ========================================================================
     10. RSVP & Ucapan Handler (Siap Google Apps Script fetch POST + fallback localStorage)
     ======================================================================== */
  function readLocalWishes() {
    const raw = window.localStorage.getItem(INVITATION_CONFIG.storageKey);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  }

  function saveLocalWishes(list) {
    window.localStorage.setItem(INVITATION_CONFIG.storageKey, JSON.stringify(list));
  }

  function formatTimestamp(isoString) {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(isoString));
    } catch {
      return '';
    }
  }

  function renderWishes(wishes) {
    dom.wishesLoading.hidden = true;
    dom.wishesError.hidden = true;
    dom.wishesList.textContent = '';

    dom.wishesCount.textContent = `${wishes.length} ucapan`;

    if (wishes.length === 0) {
      dom.wishesEmpty.hidden = false;
      return;
    }

    dom.wishesEmpty.hidden = true;

    wishes.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'wish-item';

      const top = document.createElement('div');
      top.className = 'wish-item__top';

      const name = document.createElement('p');
      name.className = 'wish-item__name';
      name.textContent = item.nama;

      const badge = document.createElement('span');
      badge.className = 'wish-item__badge';
      badge.textContent =
        item.status === 'Hadir'
          ? `Hadir (${item.jumlahTamu} orang)`
          : 'Berhalangan Hadir';

      top.append(name, badge);

      const message = document.createElement('p');
      message.className = 'wish-item__message';
      message.textContent = item.ucapan;

      const time = document.createElement('p');
      time.className = 'wish-item__time';
      time.textContent = formatTimestamp(item.waktu);

      li.append(top, message, time);
      dom.wishesList.appendChild(li);
    });
  }

  async function loadWishes() {
    dom.wishesLoading.hidden = false;
    dom.wishesEmpty.hidden = true;
    dom.wishesError.hidden = true;

    if (INVITATION_CONFIG.googleScriptUrl) {
      try {
        const res = await fetch(INVITATION_CONFIG.googleScriptUrl, { method: 'GET' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const items = Array.isArray(data) ? data : (Array.isArray(data.records) ? data.records : []);
        renderWishes(items);
        return;
      } catch {
        dom.wishesLoading.hidden = true;
        dom.wishesError.hidden = false;
        return;
      }
    }

    try {
      renderWishes(readLocalWishes());
    } catch {
      dom.wishesLoading.hidden = true;
      dom.wishesError.hidden = false;
    }
  }

  async function submitRsvpPayload(payload) {
    if (INVITATION_CONFIG.googleScriptUrl) {
      const response = await fetch(INVITATION_CONFIG.googleScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Request gagal dengan status ${response.status}`);
      }
    }

    const updated = [payload, ...readLocalWishes()];
    saveLocalWishes(updated);
    return updated;
  }

  function setFieldError(inputEl, errorEl, text) {
    if (text) {
      inputEl.setAttribute('aria-invalid', 'true');
      errorEl.textContent = text;
      errorEl.hidden = false;
    } else {
      inputEl.removeAttribute('aria-invalid');
      errorEl.textContent = '';
      errorEl.hidden = true;
    }
  }

  function initRsvp() {
    loadWishes();
    if (!dom.rsvpForm) return;

    dom.rsvpStatusSelect.addEventListener('change', () => {
      const attending = dom.rsvpStatusSelect.value === 'Hadir';
      dom.rsvpGuests.disabled = !attending;
    });

    dom.rsvpForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const nama = dom.rsvpName.value.trim();
      const status = dom.rsvpStatusSelect.value;
      const jumlahTamu = status === 'Hadir' ? dom.rsvpGuests.value : '0';
      const ucapan = dom.rsvpMessage.value.trim();

      let invalid = false;
      if (!nama) {
        setFieldError(dom.rsvpName, dom.rsvpNameError, 'Mohon isi nama lengkap Anda.');
        invalid = true;
      } else {
        setFieldError(dom.rsvpName, dom.rsvpNameError, '');
      }

      if (!ucapan) {
        setFieldError(dom.rsvpMessage, dom.rsvpMessageError, 'Mohon tuliskan ucapan atau doa Anda.');
        invalid = true;
      } else {
        setFieldError(dom.rsvpMessage, dom.rsvpMessageError, '');
      }

      if (invalid) {
        dom.rsvpFeedback.hidden = true;
        return;
      }

      dom.rsvpSubmitBtn.disabled = true;
      dom.rsvpSubmitBtn.setAttribute('aria-busy', 'true');
      dom.rsvpSubmitBtn.textContent = 'Mengirim konfirmasi...';

      const payload = {
        nama,
        status,
        jumlahTamu,
        ucapan,
        waktu: new Date().toISOString(),
      };

      try {
        const updatedWishes = await submitRsvpPayload(payload);
        renderWishes(updatedWishes);

        dom.rsvpFeedback.className = 'form-feedback';
        dom.rsvpFeedback.textContent = 'Terima kasih. Konfirmasi kehadiran dan ucapan Anda telah tersimpan.';
        dom.rsvpFeedback.hidden = false;

        dom.rsvpMessage.value = '';
        showToast('Ucapan Anda berhasil dikirim.');
      } catch {
        dom.rsvpFeedback.className = 'form-feedback form-feedback--error';
        dom.rsvpFeedback.textContent = 'Gagal mengirim ucapan. Periksa koneksi Anda lalu coba kembali.';
        dom.rsvpFeedback.hidden = false;
      } finally {
        dom.rsvpSubmitBtn.disabled = false;
        dom.rsvpSubmitBtn.removeAttribute('aria-busy');
        dom.rsvpSubmitBtn.textContent = 'Kirim Konfirmasi & Ucapan';
      }
    });
  }

  /* ========================================================================
     11. Scroll Reveal & Active Bottom Navigation
     ======================================================================== */
  function initObservers() {
    const revealEls = document.querySelectorAll('.reveal');

    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.14 }
      );
      revealEls.forEach((el) => revealObserver.observe(el));

      const sections = ['mempelai', 'acara', 'galeri', 'amplop', 'rsvp']
        .map((id) => document.getElementById(id))
        .filter(Boolean);

      const navObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const targetHref = `#${entry.target.id}`;
            dom.navLinks.forEach((link) => {
              const active = link.getAttribute('href') === targetHref;
              link.classList.toggle('is-active', active);
              if (active) {
                link.setAttribute('aria-current', 'location');
              } else {
                link.removeAttribute('aria-current');
              }
            });
          });
        },
        { rootMargin: '-35% 0px -50% 0px' }
      );

      sections.forEach((section) => navObserver.observe(section));
    } else {
      revealEls.forEach((el) => el.classList.add('is-visible'));
    }
  }

  /* ========================================================================
     12. Init
     ======================================================================== */
  initGuestName();
  initVenueInfo();
  initCoverAndAudio();
  initCountdown();
  initCalendarGenerator();
  initGallery();
  initGiftModal();
  initRsvp();
  initObservers();
})();
