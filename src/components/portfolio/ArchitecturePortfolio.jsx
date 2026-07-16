import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ArchitecturePortfolio.css';

const ArchitecturePortfolio = ({ features = [] }) => {
  const sectionRef = useRef(null);
  const containerRef = useRef(null);
  const trackRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);

  const isDraggingRef = useRef(false);
  const isHoveredRef = useRef(false);
  const scrollDirectionRef = useRef(1);

  // Determine if it's a mobile device
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const handleMouseDown = (e) => {
    if (isMobile || !containerRef.current) return;
    setIsDragging(true);
    isDraggingRef.current = true;
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeftPos(containerRef.current.scrollLeft);
    containerRef.current.style.cursor = 'grabbing';
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    isDraggingRef.current = false;
    isHoveredRef.current = false;
    if (containerRef.current) containerRef.current.style.cursor = 'grab';
  };

  const handleMouseEnter = () => {
    isHoveredRef.current = true;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    isDraggingRef.current = false;
    if (containerRef.current) containerRef.current.style.cursor = 'grab';
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll speed multiplier
    containerRef.current.scrollLeft = scrollLeftPos - walk;
  };

  useLayoutEffect(() => {
    if (!features.length) return;

    // Intersection Observer for text reveal animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('panel-revealed');
        }
      });
    }, {
      root: containerRef.current,
      threshold: 0.15
    });

    const panels = document.querySelectorAll('.portfolio-panel');
    panels.forEach(panel => observer.observe(panel));

    return () => observer.disconnect();
  }, [features]);

  // Auto scroll effect
  useEffect(() => {
    if (isMobile) return;
    let animationFrameId;
    let lastTime = performance.now();

    const autoScroll = (time) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      const container = containerRef.current;
      if (container && !isDraggingRef.current && !isHoveredRef.current) {
        container.scrollLeft += (deltaTime * 0.08) * scrollDirectionRef.current;
        
        // Reverse direction at edges
        if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 1) {
          scrollDirectionRef.current = -1;
        } else if (container.scrollLeft <= 0) {
          scrollDirectionRef.current = 1;
        }
      }
      animationFrameId = requestAnimationFrame(autoScroll);
    };

    animationFrameId = requestAnimationFrame(autoScroll);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isMobile]);

  if (!features || features.length === 0) return null;

  return (
    <section 
      ref={sectionRef} 
      className="portfolio-wrapper" 
      id="features-portfolio"
    >
      <div 
        className="portfolio-sticky-container"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >

      <div className="portfolio-track" ref={trackRef}>
        


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
                // Prevent drag acting as a link click
                onClick={(e) => { if (isDragging) e.preventDefault(); }}
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
                {feature.img && typeof feature.img === 'string' && feature.img.match(/\.(mp4|webm|ogg)/i) ? (
                  <video 
                    src={feature.img} 
                    className="project-image"
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    draggable="false"
                  />
                ) : (
                  <img 
                    src={feature.img} 
                    alt={feature.title} 
                    className="project-image"
                    draggable="false" // Prevent native image dragging
                  />
                )}
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

