/**
 * Main Application Controller for Diwali Surprise Celebration
 * Coordinates animations, user gestures, audio cues, and responsive state.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const canvas = document.getElementById('fireworksCanvas');
  const surpriseStage = document.getElementById('surpriseStage');
  const surpriseBtn = document.getElementById('surpriseBtn');
  const celebrationStage = document.getElementById('celebrationStage');
  const skyFlash = document.getElementById('skyFlash');
  const bottomControls = document.getElementById('bottomControls');
  const launchSkyshotBtn = document.getElementById('launchSkyshotBtn');
  const launchAnarBtn = document.getElementById('launchAnarBtn');
  const launchChakriBtn = document.getElementById('launchChakriBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const fullscreenIcon = document.getElementById('fullscreenIcon');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  const replayBtn = document.getElementById('replayBtn');
  const recipientGreeting = document.getElementById('recipientGreeting');
  const toastNotification = document.getElementById('toastNotification');

  // Modal Elements
  const shareBtn = document.getElementById('shareBtn');
  const personalizeModal = document.getElementById('personalizeModal');
  const personalizeForm = document.getElementById('personalizeForm');
  const recipientNameInput = document.getElementById('recipientNameInput');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const whatsappShareBtn = document.getElementById('whatsappShareBtn');

  // Side Diyas
  const sideDiyas = document.querySelectorAll('.side-diya');

  // Initialize Fireworks Engine
  const fireworks = new FireworksEngine(canvas);
  fireworks.start();

  // State
  let isCelebrationRevealed = false;
  let isLaunchingGrandSurprise = false;
  let toastTimeout = null;

  // Check URL parameters for personalized name (e.g. ?name=Priya) and test reveal
  function checkUrlGreeting() {
    const params = new URLSearchParams(window.location.search);
    const name = params.get('name');
    if (name && name.trim()) {
      const sanitized = name.trim().slice(0, 40);
      recipientGreeting.textContent = `Warmest Wishes to ${sanitized} & Family ✨`;
      recipientGreeting.classList.add('visible');
      recipientNameInput.value = sanitized;
    } else {
      recipientGreeting.textContent = '';
      recipientGreeting.classList.remove('visible');
    }

    if (params.get('revealed') === 'true') {
      surpriseStage.classList.add('hidden');
      celebrationStage.classList.remove('hidden');
      celebrationStage.classList.add('active');
      bottomControls.classList.add('visible');
      isCelebrationRevealed = true;
      fireworks.startAmbient(3500);
    }
  }
  checkUrlGreeting();

  // Sync sound icon with initial mute state
  function updateSoundIcon() {
    if (window.soundFX && soundIcon) {
      soundIcon.textContent = window.soundFX.isMuted ? '🔇' : '🔊';
    }
  }
  updateSoundIcon();

  // Toast Notification Helper
  function showToast(message, duration = 3200) {
    if (!toastNotification) return;
    toastNotification.textContent = message;
    toastNotification.classList.add('active');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastNotification.classList.remove('active');
    }, duration);
  }

  /**
   * The Grand Surprise Transition
   * Triggered when clicking "Click on me for Diwali surprise"
   */
  function handleSurpriseClick() {
    if (isLaunchingGrandSurprise) return;
    isLaunchingGrandSurprise = true;

    // 1. Initialize Web Audio context from user gesture
    if (window.soundFX) {
      window.soundFX.ensureContext();
      window.soundFX.playClick();
    }

    // 2. Hide surprise button with smooth exit
    surpriseStage.classList.add('fading');
    setTimeout(() => {
      surpriseStage.classList.add('hidden');
    }, 350);

    // 3. Launch grand skyward rocket from center
    setTimeout(() => {
      fireworks.launchGrandSurprise(() => {
        // Callback when main skyshot reaches apex & detonates!

        // Flash sky with warm radiance
        skyFlash.classList.add('active');
        setTimeout(() => skyFlash.classList.remove('active'), 250);

        // Reveal Happy Diwali celebration card
        celebrationStage.classList.remove('hidden');
        // Force reflow for CSS transition
        void celebrationStage.offsetWidth;
        celebrationStage.classList.add('active');

        // Reveal bottom interactive controls
        bottomControls.classList.add('visible');

        // Play celebratory chime chord
        if (window.soundFX) {
          window.soundFX.playFestiveChime();
        }

        isCelebrationRevealed = true;
        isLaunchingGrandSurprise = false;

        // Start festive ambient background fireworks
        fireworks.startAmbient(3500);
      });
    }, 150);
  }

  // Surprise button listener
  surpriseBtn.addEventListener('click', handleSurpriseClick);

  /**
   * Interactive Sky Tap / Click to Launch Custom Fireworks
   */
  function handleSkyTap(e) {
    // Only launch if celebration has already begun, and target is canvas or body background
    if (!isCelebrationRevealed) return;
    if (e.target !== canvas && e.target !== document.body) return;

    let clickX, clickY;
    if (e.touches && e.touches.length > 0) {
      clickX = e.touches[0].clientX;
      clickY = e.touches[0].clientY;
    } else {
      clickX = e.clientX;
      clickY = e.clientY;
    }

    const startX = clickX + (Math.random() * 80 - 40);
    const startY = window.innerHeight + 10;

    fireworks.launchRocket(startX, startY, clickX, clickY, {
      power: 1.1 + Math.random() * 0.4
    });
  }

  canvas.addEventListener('click', handleSkyTap);
  // Support responsive mobile touch on canvas
  canvas.addEventListener('touchstart', handleSkyTap, { passive: true });

  /**
   * Launch Skyshot Button
   */
  launchSkyshotBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const startX = window.innerWidth * (0.25 + Math.random() * 0.5);
    const targetX = startX + (Math.random() * 160 - 80);
    const targetY = window.innerHeight * (0.15 + Math.random() * 0.3);

    fireworks.launchRocket(startX, window.innerHeight + 10, targetX, targetY, {
      power: 1.25
    });
  });

  /**
   * Launch Anar Fountain Button
   */
  if (launchAnarBtn) {
    launchAnarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const originX = window.innerWidth * (0.3 + Math.random() * 0.4);
      fireworks.launchFountain(originX, window.innerHeight - 15);
      showToast('🌸 Anar fountain sparkling!');
    });
  }

  /**
   * Launch Chakri Ground Spinner Button
   */
  if (launchChakriBtn) {
    launchChakriBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const originX = window.innerWidth * (0.35 + Math.random() * 0.3);
      fireworks.launchChakri(originX, window.innerHeight - 20);
      showToast('🌀 Chakri spinning!');
    });
  }

  /**
   * Fullscreen Toggle
   */
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        if (fullscreenIcon) fullscreenIcon.textContent = '✖';
        showToast('⛶ Fullscreen mode');
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        if (fullscreenIcon) fullscreenIcon.textContent = '⛶';
      }
    });

    document.addEventListener('fullscreenchange', () => {
      if (fullscreenIcon) {
        fullscreenIcon.textContent = document.fullscreenElement ? '✖' : '⛶';
      }
    });
  }

  /**
   * Sparkler cursor/touch trail on the sky
   */
  function handleSkyPointerMove(e) {
    if (!isCelebrationRevealed) return;
    let px, py;
    if (e.touches && e.touches.length > 0) {
      px = e.touches[0].clientX;
      py = e.touches[0].clientY;
    } else {
      px = e.clientX;
      py = e.clientY;
    }
    // Only spawn sparkler if over canvas or body (not over buttons)
    if (e.target === canvas || e.target === document.body) {
      fireworks.spawnSparkler(px, py);
    }
  }

  window.addEventListener('pointermove', handleSkyPointerMove, { passive: true });
  window.addEventListener('touchmove', handleSkyPointerMove, { passive: true });

  /**
   * Side Diyas Interactive Click
   */
  sideDiyas.forEach((diya) => {
    diya.addEventListener('click', (e) => {
      e.stopPropagation();
      const rect = diya.getBoundingClientRect();
      const startX = rect.left + rect.width / 2;
      const targetX = startX + (Math.random() * 120 - 60);
      const targetY = window.innerHeight * 0.25;

      fireworks.launchRocket(startX, window.innerHeight, targetX, targetY, {
        type: 'peony',
        power: 1.2
      });
    });
  });

  /**
   * Sound Mute / Unmute Toggle
   */
  soundToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.soundFX) {
      const isMuted = window.soundFX.toggleMute();
      updateSoundIcon();
      showToast(isMuted ? '🔇 Sound muted' : '🔊 Sound enabled');
    }
  });

  /**
   * Replay Surprise Sequence
   */
  replayBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fireworks.stopAmbient();

    // Reset stages
    celebrationStage.classList.remove('active');
    bottomControls.classList.remove('visible');

    setTimeout(() => {
      celebrationStage.classList.add('hidden');
      surpriseStage.classList.remove('hidden');
      surpriseStage.classList.remove('fading');
      isCelebrationRevealed = false;
      isLaunchingGrandSurprise = false;
      showToast('✨ Ready for surprise again! Tap the button.');
    }, 400);
  });

  /**
   * Personalize & Share Modal
   */
  shareBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    personalizeModal.classList.add('open');
    recipientNameInput.focus();
  });

  closeModalBtn.addEventListener('click', () => {
    personalizeModal.classList.remove('open');
  });

  if (whatsappShareBtn) {
    whatsappShareBtn.addEventListener('click', () => {
      const name = recipientNameInput.value.trim() || 'You';
      const url = new URL(window.location.href);
      url.searchParams.set('name', name);
      const text = `✨ ${name}, you have received a special Diwali surprise! 🪔\nTap the link to open your surprise and celebrate Happy Diwali:\n${url.toString()}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
      personalizeModal.classList.remove('open');
    });
  }

  personalizeModal.addEventListener('click', (e) => {
    if (e.target === personalizeModal) {
      personalizeModal.classList.remove('open');
    }
  });

  personalizeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = recipientNameInput.value.trim();
    if (!name) return;

    // Update greeting banner
    recipientGreeting.textContent = `Warmest Wishes to ${name} & Family ✨`;
    recipientGreeting.classList.add('visible');

    // Update URL query without full reload
    const url = new URL(window.location.href);
    url.searchParams.set('name', name);
    window.history.pushState({}, '', url.toString());

    personalizeModal.classList.remove('open');

    // Copy personalized link to clipboard
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url.toString());
        showToast('🎉 Personalized Diwali link copied! Share it with loved ones.');
      } else {
        showToast('✨ Wish updated! Copy the URL from your browser.');
      }
    } catch (err) {
      showToast('✨ Wish updated! Copy the URL from your browser.');
    }

    // Launch celebratory skyshot for the custom greeting!
    fireworks.launchRocket(window.innerWidth * 0.5, window.innerHeight + 10, window.innerWidth * 0.5, window.innerHeight * 0.22, {
      type: 'heart',
      power: 1.4
    });
  });

  /**
   * Keyboard Accessibility Shortcuts
   */
  window.addEventListener('keydown', (e) => {
    if (personalizeModal.classList.contains('open')) {
      if (e.key === 'Escape') {
        personalizeModal.classList.remove('open');
      }
      return;
    }

    if (e.code === 'Space') {
      e.preventDefault();
      if (!isCelebrationRevealed) {
        handleSurpriseClick();
      } else {
        launchSkyshotBtn.click();
      }
    } else if (e.key === 'm' || e.key === 'M') {
      soundToggleBtn.click();
    } else if (e.key === 'r' || e.key === 'R') {
      if (isCelebrationRevealed) {
        replayBtn.click();
      }
    }
  });
});
