document.addEventListener('DOMContentLoaded', function() {
    // Gestione del form di contatto
    const contactForm = document.getElementById('contactForm');
    
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Raccolta dati del form
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

        // Mostra feedback visivo
        const submitBtn = contactForm.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Invio in corso...';
        submitBtn.disabled = true;

        try {
            // Opzione 1: Invio via email usando un servizio come EmailJS
            // emailjs.send('service_id', 'template_id', data);

            // Opzione 2: Salvataggio su Google Sheets tramite Google Apps Script
            // const response = await fetch('URL_DEL_TUO_GOOGLE_SCRIPT', {
            //     method: 'POST',
            //     body: JSON.stringify(data)
            // });

            // Mostra messaggio di successo
            showNotification('Richiesta inviata con successo! Ti contatteremo presto.', 'success');
            contactForm.reset();
        } catch (error) {
            showNotification('Si è verificato un errore. Per favore riprova più tardi.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    // Funzione per mostrare notifiche
    function showNotification(message, type) {
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
    // Gestione Portfolio con Google Drive
    const portfolioGrid = document.getElementById('portfolioGrid');

    // Gestione espansione/compressione dei progetti
    portfolioGrid.addEventListener('click', (e) => {
        const header = e.target.closest('.portfolio-header');
        if (!header) return;

        const item = header.closest('.portfolio-item');
        const content = item.querySelector('.portfolio-content');
        const allItems = portfolioGrid.querySelectorAll('.portfolio-item');

        // Chiudi tutti gli altri progetti
        allItems.forEach(otherItem => {
            if (otherItem !== item && otherItem.classList.contains('expanded')) {
                otherItem.classList.remove('expanded');
            }
        });

        // Espandi/comprimi il progetto cliccato
        item.classList.toggle('expanded');

        // Scroll verso il contenuto se viene espanso
        if (item.classList.contains('expanded')) {
            content.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
    
    portfolioGrid.addEventListener('scroll', checkScrollButtons);
    window.addEventListener('resize', checkScrollButtons);
    
    async function loadProjectsFromDrive() {
        try {
            // Prima carica tutte le cartelle (progetti)
            const foldersResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q='${DRIVE_CONFIG.folderId}'+in+parents+and+mimeType='application/vnd.google-apps.folder'&key=${DRIVE_CONFIG.apiKey}&fields=files(id,name)`);
            const foldersData = await foldersResponse.json();
            
            if (foldersData.files && foldersData.files.length > 0) {
                portfolioGrid.innerHTML = ''; // Pulisce il contenuto esistente
                
                // Per ogni cartella (progetto)
                for (const folder of foldersData.files) {
                    // Carica le immagini della cartella
                    const imagesResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folder.id}'+in+parents&key=${DRIVE_CONFIG.apiKey}&fields=files(id,name,webContentLink,thumbnailLink)`);
                    const imagesData = await imagesResponse.json();
                    
                    if (imagesData.files && imagesData.files.length > 0) {
                        // Crea il container del progetto
                        const portfolioItem = document.createElement('div');
                        portfolioItem.className = 'portfolio-item';
                        
                        // Crea la galleria delle immagini
                        const imageGallery = imagesData.files
                            .filter(file => file.thumbnailLink)
                            .map(file => `
                                <div class="gallery-item">
                                    <img src="${file.thumbnailLink.replace('=s220', '=s1000')}" 
                                         alt="${file.name.replace(/\.[^/.]+$/, '')}" 
                                         loading="lazy">
                                </div>
                            `).join('');
                        
                        portfolioItem.innerHTML = `
                            <div class="portfolio-header">
                                <h3>${folder.name}</h3>
                                <button class="expand-btn" aria-label="Espandi">
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
            }
        } catch (error) {
            console.error('Errore nel caricamento dei progetti:', error);
            showNotification('Errore nel caricamento dei progetti. Riprova più tardi.', 'error');
        }
    }

    // Carica le immagini quando la pagina è pronta
    loadImagesFromDrive();
        
        // Dopo il caricamento, ripristina il pulsante
        setTimeout(() => {
            loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Carica altri progetti';
        }, 1000);
    });
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const header = document.querySelector('.header');
    
    // Toggle menu on hamburger click
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!header.contains(e.target) && navMenu.classList.contains('active')) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    });

    // Handle mobile dropdown menus
    const dropdownItems = document.querySelectorAll('.nav-item');
    dropdownItems.forEach(item => {
        if (item.querySelector('.dropdown')) {
            item.addEventListener('click', function(e) {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    const dropdown = this.querySelector('.dropdown');
                    const isOpen = dropdown.style.display === 'block';
                    
                    // Close all other dropdowns
                    dropdownItems.forEach(otherItem => {
                        if (otherItem !== item) {
                            const otherDropdown = otherItem.querySelector('.dropdown');
                            if (otherDropdown) {
                                otherDropdown.style.display = 'none';
                            }
                        }
                    });

                    // Toggle current dropdown
                    dropdown.style.display = isOpen ? 'none' : 'block';
                }
            });
        }
    });

    // Close menu on window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    });
});