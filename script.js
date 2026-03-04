document.addEventListener('DOMContentLoaded', () => {
    // Core Elements
    const container = document.querySelector('.perspective-container');
    const sections = document.querySelectorAll('.section-3d');
    const scrollContent = document.querySelector('.scroll-content');
    

    // Create random vision frames in the background
    function createVisionFrames() {
        if (!scrollContent) return;
        for (let i = 0; i < 15; i++) {
            const frame = document.createElement('div');
            frame.className = 'vision-frame';
            frame.innerHTML = `<span class="frame-id">DET_0${i}</span>`;
            
            const x = Math.random() * 100;
            const y = Math.random() * 500; 
            const z = Math.random() * -1000 - 200;
            
            frame.style.left = `${x}%`;
            frame.style.top = `${y}vh`;
            frame.style.transform = `translateZ(${z}px)`;
            
            scrollContent.appendChild(frame);
        }
    }
    createVisionFrames();

    // 3D Scroll Logic - Optimized for stability and hit detection
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal');
                entry.target.style.borderColor = 'var(--primary)';
            }
        });
    }, observerOptions);
    sections.forEach(section => observer.observe(section));

    if (container) {
        container.addEventListener('scroll', () => {
            const scrolled = container.scrollTop;
            const viewportHeight = window.innerHeight;
            
            sections.forEach((section, index) => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                const sectionBottom = sectionTop + sectionHeight;
                
                if (scrolled + viewportHeight * 1.5 > sectionTop && scrolled < sectionBottom + viewportHeight * 0.5) {
                    const distanceTop = scrolled - sectionTop;
                    const relativeProgress = (scrolled - (sectionTop - viewportHeight)) / (viewportHeight * 2);
                    
                    let opacity = 1;
                    if (scrolled < sectionTop - viewportHeight * 0.1) {
                        opacity = 1 - (sectionTop - scrolled) / viewportHeight;
                    } else if (scrolled + viewportHeight > sectionBottom + viewportHeight * 0.1) {
                        opacity = 1 - (scrolled + viewportHeight - sectionBottom) / viewportHeight;
                    }
                    
                    // Improved depth logic: Sections come forward as you approach, then fade/push away
                    const depthFactor = (index % 2 === 0) ? 1.1 : 0.9;
                    const zTransform = Math.max(-500, Math.min(200, (viewportHeight - Math.abs(distanceTop)) * 0.2 * depthFactor));
                    
                    const rotateX = Math.max(-10, Math.min(10, distanceTop * 0.01));
                    const rotateY = (index % 2 === 0) ? Math.min(3, distanceTop * 0.001) : Math.max(-3, distanceTop * -0.001);
                    
                    section.style.transform = `translateZ(${zTransform}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                    section.style.opacity = Math.max(opacity, 0);
                    section.style.zIndex = Math.floor(zTransform + 500); 
                    
                    // Crucial fix: Only enable interaction if the section is mostly in view
                    if (opacity > 0.5) {
                        section.style.pointerEvents = 'auto';
                        section.style.visibility = 'visible';
                    } else {
                        section.style.pointerEvents = 'none';
                    }
                } else {
                    section.style.opacity = 0;
                    section.style.pointerEvents = 'none';
                    section.style.visibility = 'hidden';
                }
            });

            const scanner = document.querySelector('.scanner-line');
            if (scanner) {
                scanner.style.boxShadow = `0 0 ${20 + (scrolled % 10)}px var(--primary)`;
            }
        });
    }

    // Smooth Navigation
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (container && targetElement) {
                container.scrollTo({
                    top: targetElement.offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Project Modal Logic
    const modal = document.getElementById('projectModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalTech = document.getElementById('modalTech');
    const modalDesc = document.getElementById('modalDesc');
    const closeBtn = document.querySelector('.close-modal');
    const modalBackdrop = document.querySelector('.modal-backdrop');

    function typeWriter(element, text, speed = 20) {
        if (!element || !text) return;
        
        // CLEAR PREVIOUS ANIMATION to prevent double/triple text
        if (element.typewriterTimeout) {
            clearTimeout(element.typewriterTimeout);
        }
        
        element.textContent = '';
        let i = 0;
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                element.typewriterTimeout = setTimeout(type, speed);
            }
        }
        type();
    }

    function openModalForCard(card) {
        if (!modal) return;
        
        // Prevent duplicate opens causing flash
        if (modal.classList.contains('active') && modal.currentCard === card) return;
        modal.currentCard = card;

        // INSTANT REVEAL - Show modal first for immediate feedback
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        const data = card.dataset;
        const modalTitle = modal.querySelector('#modalTitle');
        const modalTech = modal.querySelector('#modalTech');
        const modalDesc = modal.querySelector('#modalDesc');
        const modalWorkflow = modal.querySelector('#modalWorkflow');

        if (!modalTitle || !modalTech || !modalDesc || !modalWorkflow) return;

        // Reset previous content
        modalTech.innerHTML = '';
        modalDesc.textContent = '';
        modalWorkflow.textContent = '';
        
        // Populate technical markers
        modalTitle.textContent = data.name || 'PROJECT_SCAN';
        const techStack = data.tech || 'STACK_UNDEFINED';
        techStack.split(',').forEach(tech => {
            const span = document.createElement('span');
            span.className = 'tech-tag';
            span.textContent = tech.trim();
            modalTech.appendChild(span);
        });

        // High-speed typewriter reveal
        typeWriter(modalDesc, data.desc || 'NO_DATA_AVAILABLE', 15);
        typeWriter(modalWorkflow, data.workflow || 'NO_WORKFLOW_LOGGED', 8);
    }

    // Project Navigation logic - REFINED for Snap Tensions
    const projectGrid = document.querySelector('.project-grid');
    const prevBtn = document.getElementById('prevProject');
    const nextBtn = document.getElementById('nextProject');

    if (projectGrid && prevBtn && nextBtn) {
        // Use a slightly larger scroll to ensure we cross the snap threshold
        const scrollAmount = 355; 
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            projectGrid.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            projectGrid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });
    }

    // SINGLE SOURCE OF TRUTH - Single Interaction Engine
    function handleProjectInteraction(e) {
        // More robust detection: check if click is on prompt or card
        const prompt = e.target.closest('.click-prompt');
        const cardTarget = e.target.closest('.project-card');
        
        if (prompt || cardTarget) {
            const card = (prompt || cardTarget).closest('.project-card');
            if (card) {
                console.log("[CV_ENGINE] TARGET_ACQUIRED:", card.dataset.name);
                openModalForCard(card);
            }
        }
    }

    // Attach only ONCE at the document level for maximum reliability and simplicity
    document.addEventListener('click', handleProjectInteraction);
    

    function closeModal() {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // Neural Network Canvas Animation - VIBRANT MODE
    const canvas = document.getElementById('neuralCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        const particleCount = 150; // Increased from 100 for more density
        const maxDistance = 180; // Increased for more connections

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.8; // Slightly faster
                this.vy = (Math.random() - 0.5) * 0.8;
                this.radius = Math.random() * 2 + 1.5; // Slightly larger
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(59, 130, 246, 0.8)'; // More opaque
                ctx.fill();
            }
        }

        function initParticles() {
            particles = [];
            for (let i = 0; i < particleCount; i++) particles.push(new Particle());
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < maxDistance) {
                        ctx.beginPath();
                        // Increased opacity for more vibrant connections
                        ctx.strokeStyle = `rgba(59, 130, 246, ${0.4 * (1 - distance / maxDistance)})`;
                        ctx.lineWidth = 1; // Thicker lines
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animate);
        }

        window.addEventListener('resize', () => {
            resizeCanvas();
            initParticles();
        });

        resizeCanvas();
        initParticles();
        animate();
    }

    console.log("Vision Engine Initialized (CV_MODE: ON, CURSOR: ROBUST, INTERACTION: FIX_APPLIED)");
});