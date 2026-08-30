// mobile menu
      (function () {
        var btn = document.getElementById("menuBtn");
        var menu = document.getElementById("mobile-menu");
        if (!btn || !menu) return;
        btn.addEventListener("click", function () {
          var open = menu.classList.toggle("open");
          btn.classList.toggle("open", open);
          btn.setAttribute("aria-expanded", open ? "true" : "false");
        });
        menu.querySelectorAll("a").forEach(function (a) {
          a.addEventListener("click", function () {
            menu.classList.remove("open");
            btn.classList.remove("open");
            btn.setAttribute("aria-expanded", "false");
          });
        });
      })();

      // reveal on scroll
      (function () {
        var nodes = Array.from(document.querySelectorAll("[data-r]"));
        var reduce = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        function show(el, delay) {
          el.style.transitionDelay = (delay || 0) + "ms";
          el.classList.add("shown");
        }
        if (reduce || !("IntersectionObserver" in window)) {
          nodes.forEach(function (el) {
            show(el, 0);
          });
          return;
        }
        var io = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry, k) {
              if (entry.isIntersecting) {
                show(entry.target, k * 60);
                io.unobserve(entry.target);
              }
            });
          },
          { threshold: 0, rootMargin: "0px 0px -6% 0px" },
        );
        nodes.forEach(function (el) {
          io.observe(el);
        });
      })();

      // contact form -> email (FormSubmit.co)
      (function () {
        var form = document.getElementById("contactForm");
        var note = document.getElementById("formNote");
        if (!form) return;
        var noteDefault = note ? note.textContent : "";

        form.addEventListener("submit", function (e) {
          e.preventDefault();

          var data = new FormData(form);
          if ((data.get("_honey") || "").trim()) return; // bot caught by honeypot

          var submitBtn = form.querySelector(".form-submit");
          var payload = {};
          data.forEach(function (value, key) {
            payload[key] = value;
          });

          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Enviando...";
          }

          fetch("https://formsubmit.co/ajax/brenda@brendaflores.co", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(payload),
          })
            .then(function (res) {
              if (!res.ok) throw new Error("request failed");
              form.reset();
              if (note) {
                note.textContent =
                  "¡Listo! Tu mensaje ya está en camino. Te respondemos en menos de 48h.";
              }
            })
            .catch(function () {
              if (note) {
                note.textContent =
                  "No pudimos enviar el formulario. Escríbenos directo por WhatsApp o a brenda@brendaflores.co.";
              }
            })
            .finally(function () {
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Quiero mi diagnóstico gratis";
              }
              if (note) {
                setTimeout(function () {
                  note.textContent = noteDefault;
                }, 8000);
              }
            });
        });
      })();
