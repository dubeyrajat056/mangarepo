// Chapter reader functionality
document.addEventListener('DOMContentLoaded', function() {
    const chapterViewer = document.querySelector('.chapter-viewer');
    if (chapterViewer) {
        const pages = document.querySelectorAll('.page');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const pageIndicator = document.getElementById('page-indicator');
        
        let currentPage = 1;
        const totalPages = pages.length;
        
        // Show first page initially
        showPage(currentPage);
        
        // Navigation buttons
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                showPage(currentPage);
            }
        });
        
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                showPage(currentPage);
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && currentPage > 1) {
                currentPage--;
                showPage(currentPage);
            } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
                currentPage++;
                showPage(currentPage);
            }
        });
        
        function showPage(pageNumber) {
            // Hide all pages
            pages.forEach(page => {
                page.style.display = 'none';
            });
            
            // Show current page
            const currentPageElement = document.querySelector(`.page[data-page="${pageNumber}"]`);
            if (currentPageElement) {
                currentPageElement.style.display = 'block';
            }
            
            // Update indicator
            pageIndicator.textContent = `Page ${pageNumber} of ${totalPages}`;
            
            // Disable/enable buttons
            prevBtn.disabled = pageNumber === 1;
            nextBtn.disabled = pageNumber === totalPages;
            
            // Scroll to top of page
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
});



// chapter js str
document.addEventListener('DOMContentLoaded', () => {
    const pages = document.querySelectorAll('.page');
    let currentPage = 0;

    function showPage(index) {
        pages.forEach((page, i) => {
            page.style.display = i === index ? 'block' : 'none';
        });
        document.getElementById('page-indicator').textContent = `Page ${index + 1} of ${pages.length}`;
    }

    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            showPage(currentPage);
        }
    });

    document.getElementById('next-page').addEventListener('click', () => {
        if (currentPage < pages.length - 1) {
            currentPage++;
            showPage(currentPage);
        }
    });

    showPage(currentPage); // Initialize view
});

// chapter js end