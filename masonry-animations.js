/**
 * MASONRY COMPONENT + SCROLL ANIMATIONS
 * Інтегрує Masonry компонент та додає плавні анімації при скролі
 * 
 * Залежності: GSAP 3.12+, ScrollTrigger
 */

// ============================================================
// MASONRY COMPONENT
// ============================================================

class MasonryComponent {
  constructor(containerId, items, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container with id "${containerId}" not found`);
      return;
    }

    this.items = items;
    this.options = {
      ease: 'power3.out',
      duration: 0.6,
      stagger: 0.05,
      animateFrom: 'bottom',
      scaleOnHover: true,
      hoverScale: 0.95,
      blurToFocus: true,
      colorShiftOnHover: false,
      ...options
    };

    this.columns = this.calculateColumns();
    this.containerWidth = this.container.offsetWidth;
    this.grid = [];
    this.hasMounted = false;

    this.init();
  }

  calculateColumns() {
    if (window.innerWidth >= 1500) return 5;
    if (window.innerWidth >= 1000) return 4;
    if (window.innerWidth >= 600) return 3;
    if (window.innerWidth >= 400) return 2;
    return 1;
  }

  async preloadImages() {
    const urls = this.items.map(i => i.img);
    return Promise.all(
      urls.map(src => {
        return new Promise(resolve => {
          const img = new Image();
          img.src = src;
          img.onload = img.onerror = () => resolve();
        });
      })
    );
  }

  buildGrid() {
    const colHeights = new Array(this.columns).fill(0);
    const columnWidth = this.containerWidth / this.columns;

    this.grid = this.items.map(child => {
      const col = colHeights.indexOf(Math.min(...colHeights));
      const x = columnWidth * col;
      const height = child.height / 2;
      const y = colHeights[col];

      colHeights[col] += height;

      return {
        ...child,
        x,
        y,
        w: columnWidth,
        h: height
      };
    });

    // Встановлюємо висоту контейнера
    const maxHeight = Math.max(...colHeights);
    this.container.parentElement.style.minHeight = maxHeight + 'px';
  }

  getInitialPosition(item) {
    let direction = this.options.animateFrom;

    if (direction === 'random') {
      const directions = ['top', 'bottom', 'left', 'right'];
      direction = directions[Math.floor(Math.random() * directions.length)];
    }

    const containerRect = this.container.getBoundingClientRect();

    switch (direction) {
      case 'top':
        return { x: item.x, y: -200 };
      case 'bottom':
        return { x: item.x, y: window.innerHeight + 200 };
      case 'left':
        return { x: -200, y: item.y };
      case 'right':
        return { x: window.innerWidth + 200, y: item.y };
      case 'center':
        return {
          x: this.containerWidth / 2 - item.w / 2,
          y: containerRect.height / 2 - item.h / 2
        };
      default:
        return { x: item.x, y: item.y + 100 };
    }
  }

  render() {
    this.container.innerHTML = '';

    this.grid.forEach(item => {
      const wrapper = document.createElement('div');
      wrapper.className = 'masonry-item-wrapper';
      wrapper.setAttribute('data-key', item.id);
      wrapper.style.position = 'absolute';
      wrapper.style.width = item.w + 'px';
      wrapper.style.height = item.h + 'px';
      wrapper.style.left = item.x + 'px';
      wrapper.style.top = item.y + 'px';
      wrapper.style.padding = '6px';
      wrapper.style.cursor = 'pointer';
      wrapper.style.willChange = 'transform, width, height, opacity';

      const imgDiv = document.createElement('div');
      imgDiv.className = 'masonry-item-img';
      imgDiv.style.backgroundImage = `url(${item.img})`;

      if (this.options.colorShiftOnHover) {
        const overlay = document.createElement('div');
        overlay.className = 'color-overlay';
        overlay.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(45deg, rgba(255,0,150,0.5), rgba(0,150,255,0.5));
          opacity: 0;
          pointer-events: none;
          border-radius: 8px;
        `;
        imgDiv.appendChild(overlay);
      }

      wrapper.appendChild(imgDiv);

      wrapper.addEventListener('click', () => {
        if (item.url) window.open(item.url, '_blank', 'noopener');
      });

      wrapper.addEventListener('mouseenter', (e) => this.handleMouseEnter(e, item));
      wrapper.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, item));

      this.container.appendChild(wrapper);
    });
  }

  animate() {
    this.grid.forEach((item, index) => {
      const selector = `[data-key="${item.id}"]`;

      const animationProps = {
        x: item.x,
        y: item.y,
        width: item.w,
        height: item.h,
        opacity: 1
      };

      if (!this.hasMounted) {
        const initialPos = this.getInitialPosition(item);
        const initialState = {
          opacity: 0,
          x: initialPos.x,
          y: initialPos.y,
          width: item.w,
          height: item.h
        };

        if (this.options.blurToFocus) {
          initialState.filter = 'blur(10px)';
          animationProps.filter = 'blur(0px)';
        }

        gsap.fromTo(
          selector,
          initialState,
          {
            ...animationProps,
            duration: 0.8,
            ease: 'power3.out',
            delay: index * this.options.stagger
          }
        );
      } else {
        gsap.to(selector, {
          ...animationProps,
          duration: this.options.duration,
          ease: this.options.ease,
          overwrite: 'auto'
        });
      }
    });

    this.hasMounted = true;
  }

  handleMouseEnter(e, item) {
    const element = e.currentTarget;
    const selector = `[data-key="${item.id}"]`;

    if (this.options.scaleOnHover) {
      gsap.to(selector, {
        scale: this.options.hoverScale,
        duration: 0.3,
        ease: 'power2.out'
      });
    }

    if (this.options.colorShiftOnHover) {
      const overlay = element.querySelector('.color-overlay');
      if (overlay) {
        gsap.to(overlay, {
          opacity: 0.3,
          duration: 0.3
        });
      }
    }
  }

  handleMouseLeave(e, item) {
    const element = e.currentTarget;
    const selector = `[data-key="${item.id}"]`;

    if (this.options.scaleOnHover) {
      gsap.to(selector, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      });
    }

    if (this.options.colorShiftOnHover) {
      const overlay = element.querySelector('.color-overlay');
      if (overlay) {
        gsap.to(overlay, {
          opacity: 0,
          duration: 0.3
        });
      }
    }
  }

  async init() {
    await this.preloadImages();
    this.buildGrid();
    this.render();
    this.animate();

    window.addEventListener('resize', () => {
      const newColumns = this.calculateColumns();
      const newWidth = this.container.offsetWidth;

      if (newColumns !== this.columns || newWidth !== this.containerWidth) {
        this.columns = newColumns;
        this.containerWidth = newWidth;
        this.buildGrid();
        this.render();
        this.animate();
      }
    });
  }
}

// ============================================================
// SCROLL REVEAL ANIMATIONS
// ============================================================

class ScrollRevealAnimations {
  constructor() {
    this.options = {
      threshold: 0.08,
      staggerDelay: 80
    };

    this.init();
  }

  init() {
    // Ініціалізуємо ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Базова анімація для елементів з класом .reveal
    this.setupBasicReveal();

    // Покращені анімації для різних типів контенту
    this.setupAdvancedAnimations();
  }

  setupBasicReveal() {
    const revealElements = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Стандартна анімація з затримкою
          setTimeout(() => {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }, index * this.options.staggerDelay);
        }
      });
    }, { threshold: this.options.threshold });

    revealElements.forEach(el => {
      observer.observe(el);
    });
  }

  setupAdvancedAnimations() {
    // Анімація для карток послуг
    const serviceCards = document.querySelectorAll('.svc-photo-card');
    serviceCards.forEach((card, index) => {
      gsap.fromTo(
        card,
        {
          opacity: 0,
          y: 50
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 80%',
            end: 'top 30%',
            scrub: 0.5,
            markers: false
          }
        }
      );
    });

    // Анімація для карток лікарів
    const docCards = document.querySelectorAll('.doc-card');
    docCards.forEach((card, index) => {
      gsap.fromTo(
        card,
        {
          opacity: 0,
          scale: 0.95
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          delay: index * 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            end: 'top 35%',
            scrub: 0.3,
            markers: false
          }
        }
      );
    });

    // Анімація для карток відгуків
    const reviewCards = document.querySelectorAll('.rev-card');
    reviewCards.forEach((card, index) => {
      gsap.fromTo(
        card,
        {
          opacity: 0,
          x: index % 2 === 0 ? -50 : 50
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 80%',
            end: 'top 30%',
            scrub: 0.4,
            markers: false
          }
        }
      );
    });

    // Анімація для заголовків
    const sectionTitles = document.querySelectorAll('.sec-title, .services-header h2');
    sectionTitles.forEach((title) => {
      gsap.fromTo(
        title,
        {
          opacity: 0,
          y: 30
        },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: title,
            start: 'top 85%',
            end: 'top 50%',
            scrub: 0.2,
            markers: false
          }
        }
      );
    });
  }

  // Функція для додавання користувацької анімації
  addCustomAnimation(selector, fromProps, toProps, triggerOptions = {}) {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach((el, index) => {
      const defaultTrigger = {
        trigger: el,
        start: 'top 80%',
        end: 'top 30%',
        scrub: 0.3,
        markers: false
      };

      gsap.fromTo(el, fromProps, {
        ...toProps,
        scrollTrigger: { ...defaultTrigger, ...triggerOptions },
        delay: index * 0.05
      });
    });
  }
}

// ============================================================
// ІНІЦІАЛІЗАЦІЯ
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // Ініціалізуємо scroll animations
  const scrollAnimations = new ScrollRevealAnimations();

  // Приклад: Якщо хочеш додати Masonry до специфічного контейнера
  // Розкоментуй та налаштуй:
  /*
  const masonryItems = [
    {
      id: "1",
      img: "https://picsum.photos/id/1015/600/900?grayscale",
      url: "https://example.com/one",
      height: 400,
    },
    // ... більше елементів
  ];

  const masonry = new MasonryComponent('masonry-container', masonryItems, {
    ease: 'power3.out',
    duration: 1.3,
    stagger: 0.1,
    animateFrom: 'random',
    scaleOnHover: true,
    hoverScale: 0.95,
    blurToFocus: true,
    colorShiftOnHover: false
  });
  */
});

// Експортуємо для зовнішнього використання
window.MasonryComponent = MasonryComponent;
window.ScrollRevealAnimations = ScrollRevealAnimations;
