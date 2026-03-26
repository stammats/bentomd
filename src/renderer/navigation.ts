export function generateNavigationScript(): string {
  return `(function() {
  function updateScale() {
    var deck = document.querySelector('.slide-deck');
    if (!deck) return;
    var style = getComputedStyle(document.documentElement);
    var sw = parseFloat(style.getPropertyValue('--canvas-width'));
    var sh = parseFloat(style.getPropertyValue('--canvas-height'));
    if (!sw || !sh) return;
    var scale = Math.min(window.innerWidth / sw, window.innerHeight / sh);
    document.documentElement.style.setProperty('--scale', scale);
  }
  updateScale();
  window.addEventListener('resize', updateScale);

  var current = 0;
  var slides = document.querySelectorAll('.slide');
  var counter = document.querySelector('.slide-counter');

  function goto(n) {
    if (slides.length === 0) return;
    current = Math.max(0, Math.min(n, slides.length - 1));
    for (var i = 0; i < slides.length; i++) {
      slides[i].classList.toggle('active', i === current);
    }
    if (counter) {
      counter.textContent = (current + 1) + ' / ' + slides.length;
    }
    history.replaceState(null, '', '#' + (current + 1));
  }

  // Read initial slide from hash
  var hash = parseInt(location.hash.replace('#', ''), 10);
  goto(hash > 0 ? hash - 1 : 0);

  document.addEventListener('keydown', function(e) {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
        e.preventDefault();
        goto(current + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        goto(current - 1);
        break;
    }
  });

  document.addEventListener('click', function(e) {
    if (e.target.closest('a')) return;
    goto(current + 1);
  });

  window.addEventListener('hashchange', function() {
    var h = parseInt(location.hash.replace('#', ''), 10);
    if (h > 0) goto(h - 1);
  });

  // Auto-fit: detect overflow in slide-body and apply content-scale classes
  function autoFitSlides() {
    var allSlides = document.querySelectorAll('.slide');
    for (var i = 0; i < allSlides.length; i++) {
      var body = allSlides[i].querySelector('.slide-body');
      if (!body) continue;

      // Remove existing scale classes
      var content = allSlides[i].querySelector('.slide-content');
      if (!content) continue;
      content.classList.remove('content-scale-1', 'content-scale-2', 'content-scale-3', 'content-scale-4');

      // Temporarily show the slide to measure
      var wasHidden = !allSlides[i].classList.contains('active');
      if (wasHidden) {
        allSlides[i].style.display = 'block';
        allSlides[i].style.visibility = 'hidden';
      }

      // Check if content overflows
      for (var level = 0; level <= 4; level++) {
        if (level > 0) {
          content.classList.add('content-scale-' + level);
        }
        if (body.scrollHeight <= body.clientHeight + 2) {
          break;
        }
        if (level > 0 && level < 4) {
          content.classList.remove('content-scale-' + level);
        }
      }

      if (wasHidden) {
        allSlides[i].style.display = '';
        allSlides[i].style.visibility = '';
      }
    }
  }

  // Run auto-fit after fonts load and on resize
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(autoFitSlides);
  } else {
    setTimeout(autoFitSlides, 500);
  }
  window.addEventListener('resize', autoFitSlides);
})();`;
}
