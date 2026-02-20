const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

// 1. Initial State
gsap.set('.hero-section', { scale: 0.8, opacity: 0 });

// 2. The Animation Sequence
tl.to('.header-tag', { opacity: 1, y: 10, duration: 1 })
  .to(
    '.hero-section',
    { scale: 1, opacity: 1, duration: 1.2, ease: 'elastic.out(1, 0.75)' },
    '-=0.5'
  )
  .to(
    '.derivations li',
    {
      opacity: 1,
      x: 0,
      stagger: 0.2,
      duration: 0.8,
    },
    '-=0.5'
  )
  .to(
    '.footer-sentence',
    {
      opacity: 1,
      y: -10,
      duration: 1,
    },
    '-=0.3'
  );

// Bonus: Add a subtle pulse to the root word
gsap.to('#root-word', {
  scale: 1.05,
  duration: 2,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut',
});
