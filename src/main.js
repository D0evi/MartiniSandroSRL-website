import DRIVE_CONFIG, { FORM_WEBAPP_URL } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(contactForm);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                interesse: formData.get('interesse'),
                message: formData.get('message'),
                date: new Date().toISOString(),
                status: 'nuovo'
            };

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

                const res = await fetch(FORM_WEBAPP_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                    mode: 'no-cors'
                });

                // Con no-cors non possiamo leggere la risposta; assumiamo successo
                showNotification('Richiesta inviata con successo! Ti contatteremo presto.', 'success');
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

        if (isDriveConfigured(DRIVE_CONFIG)) {
            loadProjectsFromDrive(portfolioGrid).catch((error) => {
                console.error('Errore nel caricamento dei progetti:', error);
                showNotification('Errore nel caricamento dei progetti. Riprova più tardi.', 'error');
            });
        }
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

function isDriveConfigured(config) {
    if (!config) {
        return false;
    }

    const { folderId, apiKey } = config;
    const placeholders = ['INSERISCI_QUI_ID_CARTELLA_DRIVE', 'INSERISCI_QUI_API_KEY_GOOGLE'];

    if (!folderId || !apiKey) {
        return false;
    }

    return !placeholders.includes(folderId) && !placeholders.includes(apiKey);
}

async function loadProjectsFromDrive(portfolioGrid) {
    const { folderId, apiKey } = DRIVE_CONFIG;

    const foldersResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType='application/vnd.google-apps.folder'&key=${apiKey}&fields=files(id,name)`);
    const foldersData = await foldersResponse.json();

    if (!foldersData.files || foldersData.files.length === 0) {
        return;
    }

    portfolioGrid.innerHTML = '';

    for (const folder of foldersData.files) {
        const imagesResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folder.id}'+in+parents&key=${apiKey}&fields=files(id,name,webContentLink,thumbnailLink)`);
        const imagesData = await imagesResponse.json();

        if (!imagesData.files || imagesData.files.length === 0) {
            continue;
        }

        const portfolioItem = document.createElement('div');
        portfolioItem.className = 'portfolio-item';

        const imageGallery = imagesData.files
            .filter((file) => Boolean(file.thumbnailLink))
            .map((file) => `
                <div class="gallery-item">
                    <img src="${file.thumbnailLink.replace('=s220', '=s1000')}" 
                         alt="${file.name.replace(/\.[^/.]+$/, '')}" 
                         loading="lazy">
                </div>
            `)
            .join('');

        portfolioItem.innerHTML = `
            <div class="portfolio-header">
                <h3>${folder.name}</h3>
                <button class="expand-btn" aria-label="Espandi progetto" aria-expanded="false">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
            <div class="portfolio-content">
                <div class="project-gallery">
                    ${imageGallery}
                </div>
            </div>
        `;

        portfolioGrid.appendChild(portfolioItem);
    }
}