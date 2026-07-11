import React, { useRef, useState, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ArchitecturePortfolio.css';

gsap.registerPlugin(ScrollTrigger);

const ArchitecturePortfolio = ({ features = [] }) => {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const progressFillRef = useRef(null);

  // Determine if it's a mobile device to disable GSAP scrolljacking
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  useLayoutEffect(() => {
    if (isMobile || !features.length) return;

    let ctx = gsap.context(() => {
      const section = sectionRef.current;
      const track = trackRef.current;
      const panels = gsap.utils.toArray('.portfolio-panel');

      // Calculate snap points and total scroll distance based on panel widths
      const snapValues = [0]; // Intro panel is at 0
      let currentPos = 50; // Intro panel width is 50vw
      const totalScrollVw = 50 + (features.length - 1) * 90; // Scroll distance to bring left edge of last panel to 0
      
      features.forEach(() => {
        snapValues.push(currentPos / totalScrollVw);
        currentPos += 90;
      });

      // Intro Title Animation (Slide in from left)
      const introTitle = section.querySelector('.intro-title');
      if (introTitle) {
        gsap.fromTo(introTitle,
          { xPercent: -50, opacity: 0 },
          {
            xPercent: 0,
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top 85%',
              end: 'top 20%',
              scrub: 1,
            }
          }
        );
      }

      // Track which panels have already been revealed
      const revealedPanels = new Set();

      // 1. Horizontal Scroll Animation
      const scrollTween = gsap.to(track, {
        x: `-${totalScrollVw}vw`,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // Update progress bar
            if (progressFillRef.current) {
              progressFillRef.current.style.width = `${self.progress * 100}%`;
            }

            // Check each panel for text reveal (runs every frame during scroll)
            panels.forEach((panel, idx) => {
              if (revealedPanels.has(idx)) return;
              const rect = panel.getBoundingClientRect();
              // Trigger when panel's left edge enters 75% of viewport width
              if (rect.left < window.innerWidth * 0.75) {
                revealedPanels.add(idx);
                panel.classList.add('panel-revealed');
              }
            });
          }
        }
      });

      // 2. Parallax for each panel image
      panels.forEach((panel) => {
        const img = panel.querySelector('.project-image');

        // Parallax Image
        if (img) {
          gsap.fromTo(img, 
            { scale: 1.15, xPercent: 5 },
            {
              scale: 1,
              xPercent: 0,
              ease: 'none',
              scrollTrigger: {
                trigger: panel,
                containerAnimation: scrollTween,
                start: 'left right',
                end: 'right left',
                scrub: true
              }
            }
          );
        }
      });
      
      // Refresh ScrollTrigger after route animations complete (animation is 0.5s)
      const timer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 600);

      return () => {
        clearTimeout(timer);
        if (scrollTween) scrollTween.kill();
      };
    }, sectionRef);

    return () => ctx.revert();
  }, [isMobile, features]);

  if (!features || features.length === 0) return null;

  // Total horizontal distance in vw (intro 50vw + each feature panel 90vw)
  const totalTrackVw = 50 + features.length * 90;
  // Convert to pixels for wrapper height: we need this much vertical scroll to drive the horizontal animation
  const scrollDistancePx = typeof window !== 'undefined' ? (totalTrackVw / 100) * window.innerWidth : 3000;

  return (
    <section 
      ref={sectionRef} 
      className="portfolio-wrapper" 
      id="features-portfolio"
      style={{ height: isMobile ? 'auto' : `${scrollDistancePx}px` }}
    >
      <div className="portfolio-sticky-container">

      {/* Progress Indicator */}
      <div className="portfolio-progress">
        <span className="progress-numbers">1</span>
        <div className="progress-line">
          <div className="progress-line-fill" ref={progressFillRef} style={{ width: '0%' }}></div>
        </div>
        <span className="progress-numbers">{features.length}</span>
      </div>

      <div className="portfolio-track" ref={trackRef}>
        
        {/* Intro Panel (First item in horizontal track) */}
        <div className="portfolio-panel intro-panel">
           <div className="intro-content">
              <h2 className="intro-title">
                KHÁM PHÁ<br />
                CÁC TÍNH NĂNG<br />
                ĐỘT PHÁ.
              </h2>
           </div>
        </div>

        {features.map((feature, index) => (
          <div className="portfolio-panel" key={index}>
            
            {/* Left Column: Typography */}
            <div className="portfolio-left">
              <div className="project-number">{index + 1}</div>
              <h2 className="project-title">{feature.title}</h2>
              <p className="project-description">{feature.desc}</p>
              
              <Link 
                to={feature.link}
                className="read-more-btn"
              >
                Khám phá &rarr;
              </Link>
            </div>

            {/* Center Column: Image and Metadata */}
            <div className="portfolio-center">
              
              <div className="project-metadata">
                <span>{feature.label}</span>
                <span>TÍNH NĂNG MỚI</span>
                <span>ITA PLATFORM</span>
              </div>
              
              <div className="project-image-wrapper">
                <div className="project-image-overlay"></div>
                <img 
                  src={feature.img} 
                  alt={feature.title} 
                  className="project-image"
                />
              </div>
            </div>

          </div>
        ))}
      </div>
      </div>
    </section>
  );
};

export default ArchitecturePortfolio;
