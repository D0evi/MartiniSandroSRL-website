import { FORM_WEBAPP_URL } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(contactForm);
            // campi aggiuntivi utili lato Apps Script
            formData.append('date', new Date().toISOString());
            formData.append('status', 'nuovo');
            formData.append('origin', window.location.href);
            formData.append('ua', navigator.userAgent);

            const submitBtn = contactForm.querySelector('.submit-btn');
            const originalText = submitBtn ? submitBtn.innerHTML : '';

            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Invio in corso...';
                submitBtn.disabled = true;
            }

            try {
                // honeypot: se valorizzato, è un bot => esci silenziosamente
                if (formData.get('company')) {
                    return;
                }

                if (!FORM_WEBAPP_URL || FORM_WEBAPP_URL === 'INSERISCI_QUI_URL_WEBAPP') {
                    throw new Error('Endpoint non configurato');
                }

                // Invia come FormData per effettuare una "simple request" (no preflight)
                await fetch(FORM_WEBAPP_URL, {
                    method: 'POST',
                    body: formData,
                    mode: 'no-cors'
                });
                
                // Con no-cors non possiamo leggere la risposta; assumiamo successo
                showNotification('Richiesta inviata con successo! Ti contatteremo presto.', 'success');
                openSuccessModal();
                contactForm.reset();
            } catch (error) {
                console.error('Errore durante l\'invio del form di contatto:', error);
                showNotification('Si è verificato un errore. Per favore riprova più tardi.', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            }
        });
    }

    const portfolioGrid = document.getElementById('portfolioGrid');

    if (portfolioGrid) {
        portfolioGrid.addEventListener('click', (event) => {
            const header = event.target.closest('.portfolio-header');
            if (!header) {
                // Check if clicked on an image
                const img = event.target.closest('.project-gallery img');
                if (img) {
                    openLightbox(img.src, img.alt);
                    return;
                }
                return;
            }

            const item = header.closest('.portfolio-item');
            const content = item ? item.querySelector('.portfolio-content') : null;
            if (!item || !content) {
                return;
            }

            const allItems = portfolioGrid.querySelectorAll('.portfolio-item');
            allItems.forEach((otherItem) => {
                if (otherItem !== item) {
                    otherItem.classList.remove('expanded');
                    const otherButton = otherItem.querySelector('.expand-btn');
                    if (otherButton) {
                        otherButton.setAttribute('aria-expanded', 'false');
                        otherButton.setAttribute('aria-label', 'Espandi progetto');
                    }
                }
            });

            item.classList.toggle('expanded');

            const expandButton = header.querySelector('.expand-btn');
            const isExpanded = item.classList.contains('expanded');

            if (expandButton) {
                expandButton.setAttribute('aria-expanded', String(isExpanded));
                expandButton.setAttribute('aria-label', isExpanded ? 'Comprimi progetto' : 'Espandi progetto');
            }

            if (isExpanded) {
                content.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });

        // Make images visually indicate they're clickable
        const portfolioImages = portfolioGrid.querySelectorAll('.project-gallery img');
        portfolioImages.forEach(img => {
            img.style.cursor = 'pointer';
            img.title = 'Clicca per ingrandire';
        });

        // Caricamento dinamico da Google Drive disabilitato fino a configurazione completa
    }

    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const header = document.querySelector('.header');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });

        document.addEventListener('click', (event) => {
            if (!navMenu.classList.contains('active')) {
                return;
            }

            if (header && header.contains(event.target)) {
                return;
            }

            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
        });

        const dropdownItems = document.querySelectorAll('.nav-item');
        dropdownItems.forEach((item) => {
            const dropdown = item.querySelector('.dropdown');
            if (!dropdown) {
                return;
            }

            item.addEventListener('click', (event) => {
                if (window.innerWidth > 768) {
                    return;
                }

                event.preventDefault();

                const isOpen = dropdown.style.display === 'block';
                dropdownItems.forEach((otherItem) => {
                    if (otherItem === item) {
                        return;
                    }

                    const otherDropdown = otherItem.querySelector('.dropdown');
                    if (otherDropdown) {
                        otherDropdown.style.display = 'none';
                    }
                });

                dropdown.style.display = isOpen ? 'none' : 'block';
            });
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('menu-open');

                const dropdowns = document.querySelectorAll('.nav-item .dropdown');
                dropdowns.forEach((dropdown) => {
                    dropdown.style.display = '';
                });
            }
        });

        // Segnale globale: wiring hamburger completato
        try {
            window.__hamburgerWired = true;
        } catch (_) { /* no-op */ }
    }

    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach((anchor) => {
        anchor.addEventListener('click', (event) => {
            const targetSelector = anchor.getAttribute('href');
            if (!targetSelector) {
                return;
            }

            const targetElement = document.querySelector(targetSelector);
            if (!targetElement) {
                return;
            }

            event.preventDefault();
            targetElement.scrollIntoView({ behavior: 'smooth' });

            if (navMenu && navMenu.classList.contains('active') && hamburger) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
    });
});

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function openSuccessModal() {
    const modal = document.getElementById('successModal');
    const btnClose = document.getElementById('closeSuccessModal');
    if (!modal || !btnClose) return;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');

    const close = () => {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        document.removeEventListener('keydown', onEsc);
    };
    const onEsc = (e) => { if (e.key === 'Escape') close(); };

    btnClose.onclick = close;
    modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });
    document.addEventListener('keydown', onEsc);
}

// Funzioni Drive rimosse per evitare errori di build finché non vengono configurate

function openLightbox(imageSrc, imageAlt) {
    const lightbox = document.getElementById('imageLightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const closeBtn = document.getElementById('closeLightbox');
    
    if (!lightbox || !lightboxImage || !closeBtn) return;
    
    lightboxImage.src = imageSrc;
    lightboxImage.alt = imageAlt || 'Immagine ingrandita';
    
    lightbox.classList.add('show');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    const close = () => {
        lightbox.classList.remove('show');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        document.removeEventListener('keydown', onEsc);
    };
    
    const onEsc = (e) => { if (e.key === 'Escape') close(); };
    
    closeBtn.onclick = close;
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target === closeBtn) close();
    });
    document.addEventListener('keydown', onEsc);
}
