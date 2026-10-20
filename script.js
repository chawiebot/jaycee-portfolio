/* Jaycee's Portfolio - sticky navbar, section reveals and website theme inversion. */
document.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("siteHeader");
  const navLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  const sectionIds = ["about", ...navLinks.map(link => link.getAttribute("href").slice(1))];
  const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

  // Sticky header: add a subtle shadow when the page is scrolled.
  let scrollScheduled = false;
  function updateNavigation() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);

    // Highlight the section the visitor is currently reading.
    const marker = window.scrollY + (header?.offsetHeight || 0) + 100;
    let activeSection = "about";
    for (const section of sections) {
      if (section.getBoundingClientRect().top + window.scrollY <= marker) {
        activeSection = section.id;
      }
    }
    for (const link of navLinks) {
      const active = link.getAttribute("href") === `#${activeSection}`;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
    scrollScheduled = false;
  }
  function scheduleNavigationUpdate() {
    if (!scrollScheduled) {
      scrollScheduled = true;
      window.requestAnimationFrame(updateNavigation);
    }
  }
  updateNavigation();
  window.addEventListener("scroll", scheduleNavigationUpdate, { passive: true });
  window.addEventListener("resize", scheduleNavigationUpdate);

  // The same picture frame cycles between two photos, while each click also
  // reverses the WEBSITE colors (without changing either photo's colors).
  const page = document.getElementById("portfolioPage");
  const photoButton = document.getElementById("photoToggle");
  const photo = document.getElementById("jayceePhoto");
  const photoHint = document.querySelector(".photo-hint");
  const photos = ["images/jaycee.jpg", "images/jaycee2.jpg"];
  let currentPhoto = 0;

  if (page && photoButton && photo) {
    photoButton.addEventListener("click", () => {
      // Change to the other image in this same photo frame.
      currentPhoto = (currentPhoto + 1) % photos.length;
      photo.src = photos[currentPhoto];
      photo.alt = currentPhoto === 0 ? "Portrait of Jaycee" : "Second portrait of Jaycee";
      photo.classList.remove("photo-swapping");
      void photo.offsetWidth; // Restart the subtle swap animation each time.
      photo.classList.add("photo-swapping");

      // Existing behavior: reverse the entire page's colors, not the portrait.
      const inverted = page.classList.toggle("theme-inverted");
      // The certificate popup lives outside the portfolio's inverted wrapper,
      // so synchronize its colors with the main page when the photo is clicked.
      document.getElementById("certificateModal")?.classList.toggle("theme-inverted", inverted);
      photoButton.setAttribute("aria-pressed", String(inverted));
      photoButton.setAttribute("aria-label", inverted
        ? "Switch photo and restore the portfolio colors"
        : "Switch photo and reverse the portfolio colors");
      photoButton.title = inverted
        ? "Switch photo and restore original website colors"
        : "Switch photo and reverse website colors";
      if (photoHint) {
        photoHint.textContent = inverted
          ? "↗ Click again to switch photos and restore the original colors"
          : "↗ Click the photo to switch images and reverse website colors";
      }
    });
  }

  // Animate sections once as they scroll into view (no library needed).
  const revealSections = Array.from(document.querySelectorAll(".reveal-section"));
  if ("IntersectionObserver" in window &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    // The class is applied only after we're ready to observe elements.
    const revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });

    // Mark already visible sections first to avoid hiding content briefly.
    for (const section of revealSections) {
      if (section.getBoundingClientRect().top < window.innerHeight * 0.92) {
        section.classList.add("is-visible");
      }
      revealObserver.observe(section);
    }
    document.documentElement.classList.add("motion-ready");
  }


  // Certificate viewer. Each seminar title is a button with a certificate path.
  // Add real pictures to images/certificates/; we never invent certificate images.
  const certificateButtons = Array.from(document.querySelectorAll('.certificate-trigger'));
  const certificateModal = document.getElementById('certificateModal');
  const certificateDialog = certificateModal?.querySelector('.certificate-dialog');
  const certificateTitle = document.getElementById('certificateModalTitle');
  const certificateImage = document.getElementById('certificateImage');
  const certificateLoading = document.getElementById('certificateLoading');
  const certificateMissing = document.getElementById('certificateMissing');
  const certificateFileName = document.getElementById('certificateFileName');
  const certificateCounter = document.getElementById('certificateCounter');
  const certificateClose = document.getElementById('certificateClose');
  const certificatePrevious = document.getElementById('certificatePrevious');
  const certificateNext = document.getElementById('certificateNext');
  let activeCertificate = 0;
  let certificateRequest = 0;
  let returnFocusTo = null;

  function showCertificate(index) {
    if (!certificateButtons.length || !certificateModal) return;
    activeCertificate = (index + certificateButtons.length) % certificateButtons.length;
    const button = certificateButtons[activeCertificate];
    const title = button.querySelector('span')?.textContent?.trim() || 'Seminar certificate';
    const preferredPath = button.dataset.certificate;
    const currentRequest = ++certificateRequest;

    certificateTitle.textContent = title;
    certificateCounter.textContent = `${String(activeCertificate + 1).padStart(2, '0')} / ${String(certificateButtons.length).padStart(2, '0')}`;
    certificateFileName.textContent = preferredPath;
    certificateImage.hidden = true;
    certificateImage.removeAttribute('src');
    certificateMissing.hidden = true;
    certificateLoading.hidden = false;

    // The user can save certificates as JPG, JPEG, PNG or WebP without modifying JS.
    const base = preferredPath.replace(/\.(jpe?g|png|webp)$/i, '');
    const paths = ['.jpg', '.jpeg', '.png', '.webp'].map(ext => base + ext);
    function tryImage(candidateIndex) {
      if (currentRequest !== certificateRequest) return;
      if (candidateIndex >= paths.length) {
        certificateLoading.hidden = true;
        certificateMissing.hidden = false;
        return;
      }
      const candidate = new Image();
      candidate.onload = () => {
        if (currentRequest !== certificateRequest) return;
        certificateImage.src = paths[candidateIndex];
        certificateImage.alt = `Certificate for ${title}`;
        certificateImage.hidden = false;
        certificateLoading.hidden = true;
        certificateMissing.hidden = true;
      };
      candidate.onerror = () => tryImage(candidateIndex + 1);
      candidate.src = paths[candidateIndex];
    }
    tryImage(0);
  }

  function openCertificate(index) {
    if (!certificateModal) return;
    returnFocusTo = document.activeElement;
    certificateModal.hidden = false;
    document.body.classList.add('certificate-open');
    showCertificate(index);
    certificateClose.focus();
  }

  function closeCertificate() {
    if (!certificateModal || certificateModal.hidden) return;
    ++certificateRequest; // Ignore images that finish loading after close.
    certificateModal.hidden = true;
    document.body.classList.remove('certificate-open');
    if (returnFocusTo && returnFocusTo.isConnected) returnFocusTo.focus();
  }

  certificateButtons.forEach((button, index) => {
    button.addEventListener('click', () => openCertificate(index));
  });
  certificateClose?.addEventListener('click', closeCertificate);
  certificateModal?.querySelector('[data-close-certificate]')?.addEventListener('click', closeCertificate);
  certificatePrevious?.addEventListener('click', () => showCertificate(activeCertificate - 1));
  certificateNext?.addEventListener('click', () => showCertificate(activeCertificate + 1));

  document.addEventListener('keydown', event => {
    if (!certificateModal || certificateModal.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeCertificate();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showCertificate(activeCertificate - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      showCertificate(activeCertificate + 1);
    } else if (event.key === 'Tab') {
      // Keep keyboard focus within the dialog while it is open.
      const buttons = Array.from(certificateDialog.querySelectorAll('button:not([disabled])'));
      if (!buttons.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

});
