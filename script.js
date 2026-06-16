/* Lemon Prod — interactions */
(function () {
  'use strict';

  /* ---- Mobile nav ---- */
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---- Copy protocol ---- */
  var copyBtn = document.getElementById('copyBtn');
  var protoText = document.getElementById('protoText');
  if (copyBtn && protoText) {
    var original = copyBtn.innerHTML;
    copyBtn.addEventListener('click', function () {
      var text = protoText.innerText.trim();
      var done = function () {
        copyBtn.classList.add('done');
        copyBtn.textContent = 'Copied ✓';
        setTimeout(function () {
          copyBtn.classList.remove('done');
          copyBtn.innerHTML = original;
        }, 1900);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(done);
      } else {
        var ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta); done();
      }
    });
  }

  /* ---- Scroll reveal ---- */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var reveals = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---- Lead form (stub — wire it to your email tool, see README) ---- */
  var form = document.getElementById('leadForm');
  var msg = document.getElementById('leadMsg');
  if (form && msg) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.querySelector('input[name="email"]');
      if (!email.value || email.value.indexOf('@') === -1) {
        msg.textContent = 'Enter a valid email to get your protocols.';
        msg.style.color = '#F4D45E';
        email.focus();
        return;
      }
      msg.textContent = 'Received ✓ — connect your email tool to automate delivery.';
      msg.style.color = '#EFC52B';
      form.querySelector('button').textContent = 'Sent ✓';
    });
  }
})();
