/* ════════════════════════════════════════════════════════════════════
   PLM — site v3 : onglets d'applications, cadre média, lightbox, menu,
   formulaire. Sans bibliothèque. Les données viennent de apps.config.js,
   posées dans la page par la fabrique (#donnees-apps).
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict'
  var doc = document
  var MOUV = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var $ = function (s, r) { return (r || doc).querySelector(s) }
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)) }
  var donnees = $('#donnees-apps')
  var D = donnees ? JSON.parse(donnees.textContent) : null
  var T = D ? D.textes : {}

  function esc (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] }) }
  function deux (n) { return (n < 10 ? '0' : '') + n }

  // ══ DEVISES ══════════════════════════════════════════════════════
  // Les prix sont fabriqués en F CFA ; le visiteur peut les voir en euros
  // ou en dollars (montant indicatif, taux dans apps.config.js → DEVISES).
  // Le choix est retenu d'une visite à l'autre. Par défaut : F CFA sur le
  // site français, dollars sur le site anglais.
  var DEV = (D && D.devises) || {}
  var devise = (D && D.lang === 'en') ? 'USD' : 'XOF'
  try { var dg = localStorage.getItem('plm-devise'); if (dg === 'XOF' || DEV[dg]) devise = dg } catch (x) {}
  function montant (fcfa, dv) {
    var n = Math.round(fcfa / DEV[dv].fcfa)
    try { return '≈\u00A0' + new Intl.NumberFormat(D.lang === 'en' ? 'en-GB' : 'fr-FR', { style: 'currency', currency: dv, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(n) }
    catch (x) { return '≈\u00A0' + n + '\u00A0' + (dv === 'EUR' ? '€' : '$') }
  }
  function appliquerDevise (racine) {
    $$('.prix[data-fcfa]', racine).forEach(function (p) {
      var forts = $$('.montant', p)
      forts.forEach(function (m) { if (!m.hasAttribute('data-xof')) m.setAttribute('data-xof', m.innerHTML) })
      var barre = p.getAttribute('data-barre'), prix = p.getAttribute('data-fcfa')
      forts.forEach(function (m) {
        var base = m.tagName === 'STRONG' ? prix : barre
        m.innerHTML = devise === 'XOF' || !DEV[devise] ? m.getAttribute('data-xof') : esc(montant(Number(base), devise))
      })
    })
    $$('.devises', racine).forEach(function (g) {
      $$('[data-devise]', g).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-devise') === devise ? 'true' : 'false') })
      var note = $('.devise-note', g); if (note) note.hidden = devise === 'XOF'
    })
  }
  doc.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-devise]')
    if (!b) return
    devise = b.getAttribute('data-devise')
    try { localStorage.setItem('plm-devise', devise) } catch (x) {}
    appliquerDevise(doc)
  })
  appliquerDevise(doc)

  // ── Bloquer le défilement de la page (menu, lightbox) ─────────────
  function piegerFocus (racine, e) {
    var f = $$('a[href], button:not([disabled]), input, select, textarea, video[controls], [tabindex]:not([tabindex="-1"])', racine)
      .filter(function (x) { return x.offsetParent !== null || x === doc.activeElement })
    if (!f.length) return
    var premier = f[0], dernier = f[f.length - 1]
    if (e.shiftKey && doc.activeElement === premier) { e.preventDefault(); dernier.focus() }
    else if (!e.shiftKey && doc.activeElement === dernier) { e.preventDefault(); premier.focus() }
  }

  // ══ MENU MOBILE ══════════════════════════════════════════════════
  var burger = $('.burger'), menu = $('#menu-mobile')
  if (burger && menu) {
    var fermer = $('.menu-fermer', menu)
    var ouvrirMenu = function () {
      menu.hidden = false; burger.setAttribute('aria-expanded', 'true'); doc.body.classList.add('menu-ouvert')
      var l = $('a', menu); if (l) l.focus()
    }
    var fermerMenu = function (rendre) {
      menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); doc.body.classList.remove('menu-ouvert')
      if (rendre !== false) burger.focus()
    }
    burger.addEventListener('click', ouvrirMenu)
    if (fermer) fermer.addEventListener('click', function () { fermerMenu() })
    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') fermerMenu()
      else if (e.key === 'Tab') piegerFocus(menu, e)
    })
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { fermerMenu(false) }) })
    window.addEventListener('resize', function () { if (!menu.hidden && window.innerWidth >= 900) fermerMenu(false) })
  }

  // ══ APPARITION AU DÉFILEMENT (une seule fois) ═════════════════════
  var aVoir = $$('.apparait')
  if (MOUV && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target) } })
    }, { rootMargin: '0px 0px -8% 0px' })
    aVoir.forEach(function (x) { io.observe(x) })
  } else aVoir.forEach(function (x) { x.classList.add('vu') })

  // ══ L'EMBLÈME PLM : il réagit ═══════════════════════════════════
  //  · souris : l'emblème s'incline vers elle, le regard du masque s'allume ;
  //  · clic, toucher, Entrée ou Espace : un tour complet et une onde dorée ;
  //  · glisser (doigt ou souris) : on le fait tourner, il revient en souplesse.
  var cadre3d = $('.cadre-3d'), emb = cadre3d && $('.embleme', cadre3d)
  if (emb) {
    var incl = $('.inclinaison', cadre3d), glisser = $('.glisser', emb)
    var eveiller = function () { emb.classList.add('eveil'); clearTimeout(emb._eveil); emb._eveil = setTimeout(function () { emb.classList.remove('eveil') }, 1800) }
    var tourner = function () {
      eveiller()
      if (!MOUV) return
      emb.classList.remove('tourne'); void emb.offsetWidth; emb.classList.add('tourne')
      var o = doc.createElement('span'); o.className = 'onde'; incl.appendChild(o)
      setTimeout(function () { o.remove() }, 1300)
    }
    emb.addEventListener('animationend', function (e) { if (e.animationName === 'tour') emb.classList.remove('tourne') })
    if (MOUV && window.matchMedia('(pointer: fine)').matches) {
      cadre3d.addEventListener('pointermove', function (e) {
        var r = cadre3d.getBoundingClientRect()
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5
        incl.style.setProperty('--tx', (x * 24).toFixed(1) + 'deg')
        incl.style.setProperty('--ty', (-y * 20).toFixed(1) + 'deg')
      })
      cadre3d.addEventListener('pointerleave', function () { incl.style.setProperty('--tx', '0deg'); incl.style.setProperty('--ty', '0deg') })
    }
    // Glisser pour tourner. Un geste court sans déplacement = un clic.
    var g = null
    emb.addEventListener('pointerdown', function (e) {
      g = { x: e.clientX, y: e.clientY, bouge: false, id: e.pointerId }
      glisser.classList.remove('relache')
    })
    emb.addEventListener('pointermove', function (e) {
      if (!g || e.pointerId !== g.id) return
      var dx = e.clientX - g.x, dy = e.clientY - g.y
      if (!g.bouge && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) { g.bouge = true; try { emb.setPointerCapture(e.pointerId) } catch (er) {} eveiller() }
      if (g.bouge && MOUV) glisser.style.setProperty('--glisse', (dx * 0.9).toFixed(1) + 'deg')
    })
    var finGlisse = function () {
      if (!g) return
      if (g.bouge) { glisser.classList.add('relache'); glisser.style.setProperty('--glisse', '0deg'); emb._glisse = Date.now() }
      g = null
    }
    emb.addEventListener('pointerup', finGlisse)
    emb.addEventListener('pointercancel', finGlisse)
    // Le clic (souris, toucher, clavier) — sauf juste après un glisser.
    emb.addEventListener('click', function () { if (Date.now() - (emb._glisse || 0) > 250) tourner() })
  }

  // ══ L'ANCIENNE PAGE TARIFS : ses ancres mènent aux applications ══
  if (/^#(tarifs|prix)/.test(location.hash) && $('#applications')) {
    history.replaceState(null, '', '#applications')
  }

  // ══ LE SHOWCASE ══════════════════════════════════════════════════
  var vitrine = $('#applications')
  var vitrineAPI = null
  if (vitrine && D) vitrineAPI = monterVitrine()

  function monterVitrine () {
    var APPS = D.apps
    var onglets = $('.onglets', vitrine), ongletsCadre = $('.onglets-cadre', vitrine)
    var indicateur = $('.indicateur', vitrine)
    var tabs = $$('.onglet', vitrine)
    var fixe = $('.zone-fixe', vitrine)
    var legende = $('.zone-legende', vitrine)
    var zoneMedia = $('.zone-media', vitrine)
    var segments = $('.segments', vitrine)
    var piste = $('.piste', vitrine)
    var prec = $('.fleche.prec', vitrine), suiv = $('.fleche.suiv', vitrine)
    var panneau = $('#vitrine-panneau')
    var appI = 0, mediaI = 0, video = null, minuterieLegende = null

    // ─ l'indicateur glisse sous l'onglet actif ─
    function placerIndicateur () {
      var t = tabs[appI]; if (!t || !indicateur) return
      indicateur.style.width = t.offsetWidth + 'px'
      indicateur.style.transform = 'translateX(' + t.offsetLeft + 'px)'
      indicateur.style.top = t.offsetTop + 'px'
      ongletsCadre.classList.toggle('debordant', onglets.scrollWidth > onglets.clientWidth + 2)
    }
    function recentrerOnglet (lisse) {
      var t = tabs[appI]; if (!t) return
      if (onglets.scrollWidth <= onglets.clientWidth + 2) return
      var cible = t.offsetLeft - (onglets.clientWidth - t.offsetWidth) / 2
      // scrollTo sur la barre seule : jamais de défilement vertical de la page.
      onglets.scrollTo({ left: Math.max(0, cible), behavior: lisse && MOUV ? 'smooth' : 'auto' })
    }

    // ─ fabrication d'une diapositive ─
    function srcset (m, ext) { return m.largeurs.map(function (l) { return m.base + '-' + l + '.' + ext + ' ' + l + 'w' }).join(', ') }
    var TAILLES = '(min-width: 1248px) 708px, (min-width: 1024px) 57vw, calc(100vw - 56px)'
    function htmlImage (m, i, total) {
      if (!m.largeurs) return '<div class="emplacement" role="img" aria-label="' + esc(m.alt) + '">' + esc(T.captureAVenir) + '<br>' + esc(m.titre) + '</div>'
      // Pas de src tant que la diapo n'est pas la courante ou la suivante :
      // seul le média suivant est préchargé.
      return '<button class="zoom" type="button" data-i="' + i + '" aria-label="' + esc(T.ouvrirGrand + ' : ' + m.titre) + '"><picture>'
        + '<source type="image/avif" data-srcset="' + srcset(m, 'avif') + '" sizes="' + TAILLES + '">'
        + '<source type="image/webp" data-srcset="' + srcset(m, 'webp') + '" sizes="' + TAILLES + '">'
        + '<img data-src="' + m.base + '-' + (m.largeurs.indexOf(1280) >= 0 ? 1280 : m.largeurs[m.largeurs.length - 1]) + '.webp" alt="' + esc(m.alt) + '" width="' + m.largeur + '" height="' + m.hauteur + '" decoding="async" loading="lazy" data-i="' + i + '">'
        + '</picture></button>'
    }
    function htmlVideo (v) {
      if (!v || !v.mp4) return '<div class="emplacement" role="img" aria-label="' + esc(T.videoAVenir) + '">' + esc(T.videoAVenir) + '</div>'
      return '<video playsinline muted preload="none" poster="' + v.poster + '" width="' + v.largeur + '" height="' + v.hauteur + '" aria-label="' + esc(v.titre) + '"></video>'
        + '<button class="lire" type="button" aria-label="' + esc(T.lireVideo) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg></button>'
        + '<button class="agrandir" type="button" aria-label="' + esc(T.ouvrirGrand) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg></button>'
    }
    function medias (a) { return [{ video: true, titre: a.video ? a.video.titre : T.videoAVenir, description: a.video ? a.video.description : '' }].concat(a.medias) }

    function chargerDiapo (i) {
      var d = piste.children[i]; if (!d) return
      $$('source[data-srcset]', d).forEach(function (s) { s.srcset = s.getAttribute('data-srcset'); s.removeAttribute('data-srcset') })
      var img = $('img[data-src]', d)
      if (img) { img.src = img.getAttribute('data-src'); img.removeAttribute('data-src'); img.loading = 'eager' }
    }

    // ─ la vidéo : sources posées seulement quand l'application est active ─
    function preparerVideo (a) {
      video = $('video', piste)
      if (!video || !a.video) return
      var v = a.video
      video.insertAdjacentHTML('beforeend', '<source src="' + v.webm + '" type="video/webm"><source src="' + v.mp4 + '" type="video/mp4">')
      video.preload = 'metadata'
      var lire = $('.lire', piste), seg = segments.children[0]
      lire.addEventListener('click', function () { jouer() })
      $('.agrandir', piste).addEventListener('click', function () { video.pause(); ouvrirBoite(0) })
      video.addEventListener('play', function () { lire.hidden = true; video.controls = true })
      video.addEventListener('pause', function () { if (!video.seeking) lire.hidden = false })
      video.addEventListener('ended', function () { lire.hidden = false; video.controls = false })
      video.addEventListener('timeupdate', function () { if (seg && video.duration) seg.style.setProperty('--rempli', (video.currentTime / video.duration).toFixed(3)) })
      // Pause automatique dès que la vidéo sort de l'écran.
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting && video && !video.paused) video.pause() }) }, { threshold: .25 }).observe(video)
      }
    }
    // 2160p seulement sur grand écran haute densité ET bon débit annoncé.
    function veut2160 () {
      var c = navigator.connection
      var grand = window.innerWidth >= 1280 && Math.max(screen.width, screen.height) * (window.devicePixelRatio || 1) >= 3000
      return !!(D.apps[appI].video && D.apps[appI].video.mp4_2160 && grand && c && !c.saveData && c.effectiveType === '4g' && (c.downlink || 0) >= 10)
    }
    function jouer () {
      if (!video) return
      if (veut2160() && !video.getAttribute('data-2160')) {
        var t = video.currentTime
        $$('source', video).forEach(function (s) { s.remove() })
        video.src = D.apps[appI].video.mp4_2160; video.setAttribute('data-2160', '1'); video.load()
        if (t) video.currentTime = t
      }
      var p = video.play(); if (p && p.catch) p.catch(function () {})
    }
    function pauseVideo () { if (video && !video.paused) video.pause() }
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) pauseVideo() })

    // ─ la légende de gauche suit le média affiché ─
    function poserLegende (i, sens) {
      var liste = medias(D.apps[appI]), m = liste[i]
      var corps = $('.legende-corps', legende)
      var html = '<span class="legende-compteur">' + deux(i + 1) + ' / ' + deux(liste.length) + '</span>'
        + '<h3>' + esc(m.titre) + '</h3><p>' + esc(m.description) + '</p>'
      clearTimeout(minuterieLegende)
      if (!MOUV || !sens) { corps.className = 'legende-corps'; corps.innerHTML = html; return }
      corps.className = 'legende-corps sortie' + (sens < 0 ? ' recul' : '')
      minuterieLegende = setTimeout(function () {
        corps.innerHTML = html
        corps.className = 'legende-corps entree' + (sens < 0 ? ' recul' : '')
      }, 100)
    }
    // Hauteur fixe de la légende : celle de la PLUS LONGUE de toutes les
    // applications, mesurée hors écran à la largeur réelle. Aucun saut, ni
    // d'un média à l'autre, ni d'une application à l'autre.
    function fixerHauteurLegende () {
      var corps = $('.legende-corps', legende)
      var mesure = doc.createElement('div')
      mesure.className = 'legende-corps'
      mesure.setAttribute('aria-hidden', 'true')
      mesure.style.cssText = 'position:absolute;visibility:hidden;left:0;top:0;width:' + corps.clientWidth + 'px'
      legende.appendChild(mesure)
      var max = 0
      APPS.forEach(function (a) {
        medias(a).forEach(function (m) {
          mesure.innerHTML = '<span class="legende-compteur">00 / 00</span><h3>' + esc(m.titre) + '</h3><p>' + esc(m.description) + '</p>'
          max = Math.max(max, mesure.offsetHeight)
        })
      })
      legende.removeChild(mesure)
      var st = getComputedStyle(legende)
      legende.style.minHeight = legende.style.height = Math.ceil(max + parseFloat(st.paddingTop) + parseFloat(st.paddingBottom)) + 'px'
    }
    function poserSegments (i) {
      $$('.segment', segments).forEach(function (s, k) {
        s.classList.toggle('fait', k === i && !(k === 0 && video))
        s.setAttribute('aria-current', k === i ? 'true' : 'false')
        if (k !== 0) s.style.removeProperty('--rempli')
      })
      prec.disabled = i <= 0
      suiv.disabled = i >= piste.children.length - 1
    }
    function surMedia (i, sens) {
      if (i === mediaI && sens !== undefined) return
      if (mediaI === 0 && i !== 0) pauseVideo()
      mediaI = i
      chargerDiapo(i); chargerDiapo(i + 1)
      poserSegments(i)
      poserLegende(i, sens)
    }
    function allerA (i, lisse) {
      var n = piste.children.length
      i = Math.max(0, Math.min(n - 1, i))
      var sens = i > mediaI ? 1 : i < mediaI ? -1 : 0
      // Défilement commandé (flèche, segment, clavier) : tant qu'on n'est pas
      // arrivé, les positions intermédiaires ne comptent pas — sinon une
      // image qui tarde fait relire un média de passage et la légende recule.
      cible = i
      clearTimeout(minuterieCible)
      minuterieCible = setTimeout(function () { cible = null }, 1200)
      piste.scrollTo({ left: i * piste.clientWidth, behavior: lisse && MOUV ? 'smooth' : 'auto' })
      if (sens) surMedia(i, sens)
    }
    var finDefil = null, cible = null, minuterieCible = null
    piste.addEventListener('scroll', function () {
      clearTimeout(finDefil)
      finDefil = setTimeout(function () {
        var i = Math.round(piste.scrollLeft / Math.max(1, piste.clientWidth))
        if (cible !== null) { if (i === cible) { cible = null; clearTimeout(minuterieCible) } return }
        if (i !== mediaI) surMedia(i, i > mediaI ? 1 : -1)
      }, 60)
    }, { passive: true })
    prec.addEventListener('click', function () { allerA(mediaI - 1, true) })
    suiv.addEventListener('click', function () { allerA(mediaI + 1, true) })
    zoneMedia.addEventListener('keydown', function (e) {
      if (e.target.closest('video')) return
      if (e.key === 'ArrowLeft') { e.preventDefault(); allerA(mediaI - 1, true) }
      else if (e.key === 'ArrowRight') { e.preventDefault(); allerA(mediaI + 1, true) }
    })
    segments.addEventListener('click', function (e) {
      var s = e.target.closest('.segment'); if (s) allerA(+s.getAttribute('data-i'), true)
    })
    piste.addEventListener('click', function (e) {
      var b = e.target.closest('.zoom'); if (b) ouvrirBoite(+b.getAttribute('data-i'))
    })

    // ─ changer d'application ─
    function activer (i, opts) {
      opts = opts || {}
      if (i < 0 || i >= APPS.length) return
      var change = i !== appI || opts.premier
      pauseVideo()
      appI = i
      var a = APPS[i]
      // La fiche « Qualité et caractéristiques techniques » suit l'onglet.
      $$('[data-qualite]').forEach(function (f) { f.hidden = f.getAttribute('data-qualite') !== a.id })
      tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === i ? 'true' : 'false'); t.tabIndex = k === i ? 0 : -1 })
      panneau.setAttribute('aria-labelledby', tabs[i].id)
      placerIndicateur(); recentrerOnglet(!opts.premier)
      if (!change) { if (opts.pousser && location.hash !== '#applications/' + a.id) history.replaceState({ app: a.id }, '', '#applications/' + a.id); return }
      fixe.innerHTML = a.htmlFixe
      appliquerDevise(fixe)
      var liste = medias(a)
      segments.innerHTML = liste.map(function (m, k) {
        return '<button class="segment" type="button" data-i="' + k + '" aria-label="' + esc(T.media) + ' ' + (k + 1) + ' / ' + liste.length + ' : ' + esc(m.titre) + '"></button>'
      }).join('')
      piste.innerHTML = liste.map(function (m, k) {
        return '<div class="diapo' + (k === 0 ? ' diapo-video' : '') + '" role="group" aria-roledescription="' + esc(T.diapo) + '" aria-label="' + (k + 1) + ' / ' + liste.length + ' : ' + esc(m.titre) + '">'
          + (k === 0 ? htmlVideo(a.video) : htmlImage(m, k, liste.length)) + '</div>'
      }).join('')
      piste.scrollLeft = 0
      mediaI = -1
      video = null
      preparerVideo(a)
      surMedia(0)
      if (!opts.premier && MOUV) { zoneMedia.classList.remove('change'); void zoneMedia.offsetWidth; zoneMedia.classList.add('change') }
      if (opts.pousser) history.pushState({ app: a.id }, '', '#applications/' + a.id)
    }
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { activer(k, { pousser: true }) })
    })
    onglets.addEventListener('keydown', function (e) {
      var k = appI
      if (e.key === 'ArrowRight') k = (appI + 1) % APPS.length
      else if (e.key === 'ArrowLeft') k = (appI - 1 + APPS.length) % APPS.length
      else if (e.key === 'Home') k = 0
      else if (e.key === 'End') k = APPS.length - 1
      else return
      e.preventDefault(); activer(k, { pousser: true }); tabs[k].focus({ preventScroll: true })
    })
    function depuisAdresse (defiler) {
      if (/^#(tarifs|prix)/.test(location.hash)) { history.replaceState(null, '', '#applications'); vitrine.scrollIntoView({ block: 'start', behavior: 'instant' }); return -1 }
      var m = /^#applications\/([a-z0-9-]+)/.exec(location.hash)
      var k = m ? APPS.findIndex(function (a) { return a.id === m[1] }) : -1
      if (k >= 0) {
        activer(k, {})
        if (defiler) vitrine.scrollIntoView({ block: 'start', behavior: 'instant' })
      }
      return k
    }
    window.addEventListener('popstate', function () { depuisAdresse(false) })
    window.addEventListener('hashchange', function () { depuisAdresse(false) })
    // Montrer une application depuis ailleurs dans la page (« Voir le logiciel »
    // du guide) : l'onglet s'active ET la vitrine revient sous les yeux.
    window.PLM_montrerApp = function (id) {
      var k = APPS.findIndex(function (a) { return a.id === id }); if (k < 0) return false
      activer(k, { pousser: true })
      vitrine.scrollIntoView({ block: 'start', behavior: MOUV ? 'smooth' : 'instant' })
      tabs[k].focus({ preventScroll: true })
      return true
    }
    var raf = null
    window.addEventListener('resize', function () {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(function () { placerIndicateur(); fixerHauteurLegende(); piste.scrollLeft = mediaI * piste.clientWidth })
    })
    fixerHauteurLegende()
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { placerIndicateur(); fixerHauteurLegende() })

    // Départ : l'application de l'adresse, sinon la première.
    var depart = /^#applications\/([a-z0-9-]+)/.exec(location.hash)
    var kDepart = depart ? APPS.findIndex(function (a) { return a.id === depart[1] }) : -1
    activer(kDepart >= 0 ? kDepart : 0, { premier: true })
    if (kDepart >= 0) requestAnimationFrame(function () { vitrine.scrollIntoView({ block: 'start', behavior: 'instant' }) })
    if (indicateur) onglets.classList.remove('sans-indicateur')

    return {
      app: function () { return APPS[appI] },
      medias: function () { return medias(APPS[appI]) },
      video: function () { return APPS[appI].video },
      allerA: allerA,
      courant: function () { return mediaI }
    }
  }

  // ══ LIGHTBOX ═════════════════════════════════════════════════════
  var boite = $('#boite'), ouvreur = null, bI = 0
  var scene = boite && $('.boite-scene', boite)
  var zoom = { s: 1, x: 0, y: 0 }
  function ouvrirBoite (i) {
    if (!boite || !vitrineAPI) return
    ouvreur = doc.activeElement
    boite.hidden = false
    doc.body.classList.add('boite-ouverte')
    montrer(i)
    $('.bfermer', boite).focus()
  }
  function fermerBoite () {
    if (!boite || boite.hidden) return
    var v = $('video', scene); if (v) v.pause()
    scene.innerHTML = ''
    boite.hidden = true
    doc.body.classList.remove('boite-ouverte')
    if (ouvreur && ouvreur.focus) ouvreur.focus({ preventScroll: true })
  }
  function appliquerZoom () {
    var el = $('img', scene); if (!el) return
    el.style.transform = 'translate(' + zoom.x + 'px,' + zoom.y + 'px) scale(' + zoom.s + ')'
    el.classList.toggle('zoome', zoom.s > 1.01)
    // Au premier zoom, on passe à la pleine définition (3840 px).
    if (zoom.s > 1.01 && el.getAttribute('data-plein')) { el.srcset = ''; el.src = el.getAttribute('data-plein'); el.removeAttribute('data-plein') }
  }
  function remiseZoom () { zoom = { s: 1, x: 0, y: 0 }; appliquerZoom() }
  function zoomerA (s, cx, cy) {
    var el = $('img', scene); if (!el) return
    s = Math.max(1, Math.min(5, s))
    var r = el.getBoundingClientRect()
    // Le point sous le doigt (ou la souris) reste sous le doigt.
    var px = (cx - r.left) / zoom.s, py = (cy - r.top) / zoom.s
    var bx = r.left - zoom.x, by = r.top - zoom.y
    zoom.x = cx - bx - px * s; zoom.y = cy - by - py * s; zoom.s = s
    if (s === 1) { zoom.x = 0; zoom.y = 0 }
    appliquerZoom()
  }
  function montrer (i) {
    var liste = vitrineAPI.medias(), n = liste.length
    bI = (i + n) % n
    var m = liste[bI], v = vitrineAPI.video()
    var ancienne = $('video', scene); if (ancienne) ancienne.pause()
    zoom = { s: 1, x: 0, y: 0 }
    if (m.video) {
      scene.innerHTML = v && v.mp4
        ? '<video controls playsinline muted preload="metadata" poster="' + v.poster + '"><source src="' + v.webm + '" type="video/webm"><source src="' + v.mp4 + '" type="video/mp4"></video>'
        : '<p>' + esc(T.videoAVenir) + '</p>'
    } else if (m.largeurs) {
      var plein = m.base + '-' + m.largeurs[m.largeurs.length - 1] + '.webp'
      scene.innerHTML = '<img alt="' + esc(m.alt) + '" draggable="false" sizes="100vw"'
        + ' srcset="' + m.largeurs.map(function (l) { return m.base + '-' + l + '.webp ' + l + 'w' }).join(', ') + '"'
        + ' src="' + m.base + '-1280.webp" data-plein="' + plein + '">'
    } else scene.innerHTML = '<div class="emplacement">' + esc(T.captureAVenir) + '</div>'
    $('.boite-compteur', boite).textContent = deux(bI + 1) + ' / ' + deux(n)
    $('.boite-legende', boite).innerHTML = '<b>' + esc(m.titre) + '</b><span>' + esc(m.description) + '</span>'
  }
  if (boite) {
    $('.bfermer', boite).addEventListener('click', fermerBoite)
    $('.bprec', boite).addEventListener('click', function () { montrer(bI - 1) })
    $('.bsuiv', boite).addEventListener('click', function () { montrer(bI + 1) })
    // Écouté sur le document : un clic sur l'image peut sortir le focus de la
    // boîte, et Échap doit fermer quand même. Le focus y est aussitôt ramené.
    doc.addEventListener('keydown', function (e) {
      if (boite.hidden) return
      if (!boite.contains(doc.activeElement)) scene.focus({ preventScroll: true })
      if (e.key === 'Escape') { e.preventDefault(); fermerBoite() }
      else if (e.key === 'ArrowLeft' && zoom.s <= 1.01) montrer(bI - 1)
      else if (e.key === 'ArrowRight' && zoom.s <= 1.01) montrer(bI + 1)
      else if (e.key === 'Tab') piegerFocus(boite, e)
    })
    // ⚠️ La capture du pointeur (posée au pointerdown) redirige ensuite le
    // clic et le double-clic vers la SCÈNE : on ne se fie donc pas à
    // e.target, on regarde si le point est sur l'image.
    function surImage (e) {
      var el = $('img, video', scene); if (!el) return false
      var r = el.getBoundingClientRect()
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
    }
    // Clic hors de l'image : on ferme.
    scene.addEventListener('click', function (e) { if (!surImage(e)) fermerBoite() })
    scene.addEventListener('dblclick', function (e) {
      if (!$('img', scene) || !surImage(e)) return
      if (zoom.s > 1.01) remiseZoom(); else zoomerA(2.5, e.clientX, e.clientY)
    })
    scene.addEventListener('wheel', function (e) {
      if (!$('img', scene) || !surImage(e)) return
      e.preventDefault()
      zoomerA(zoom.s * (e.deltaY < 0 ? 1.2 : 1 / 1.2), e.clientX, e.clientY)
    }, { passive: false })
    // Doigts et souris : pincer pour zoomer, glisser pour déplacer (zoomé)
    // ou pour changer d'image (non zoomé), double-tap pour zoomer.
    var pts = {}, depart = null, pince = null, dernierTap = 0
    scene.addEventListener('pointerdown', function (e) {
      if (e.target.tagName !== 'IMG') return
      scene.setPointerCapture(e.pointerId)
      pts[e.pointerId] = { x: e.clientX, y: e.clientY }
      var ids = Object.keys(pts)
      if (ids.length === 2) {
        var a = pts[ids[0]], b = pts[ids[1]]
        pince = { d: Math.hypot(a.x - b.x, a.y - b.y), s: zoom.s }
      } else depart = { x: e.clientX, y: e.clientY, zx: zoom.x, zy: zoom.y, t: Date.now() }
    })
    scene.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return
      pts[e.pointerId] = { x: e.clientX, y: e.clientY }
      var ids = Object.keys(pts)
      if (ids.length === 2 && pince) {
        var a = pts[ids[0]], b = pts[ids[1]]
        zoomerA(pince.s * Math.hypot(a.x - b.x, a.y - b.y) / pince.d, (a.x + b.x) / 2, (a.y + b.y) / 2)
      } else if (depart && zoom.s > 1.01) {
        zoom.x = depart.zx + e.clientX - depart.x; zoom.y = depart.zy + e.clientY - depart.y; appliquerZoom()
      }
    })
    var lever = function (e) {
      if (!pts[e.pointerId]) return
      delete pts[e.pointerId]
      if (Object.keys(pts).length < 2) pince = null
      if (depart && !Object.keys(pts).length) {
        var dx = e.clientX - depart.x, dy = e.clientY - depart.y
        if (zoom.s <= 1.01 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) montrer(bI + (dx < 0 ? 1 : -1))
        else if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && e.pointerType === 'touch') {
          var t = Date.now()
          if (t - dernierTap < 300) { if (zoom.s > 1.01) remiseZoom(); else zoomerA(2.5, e.clientX, e.clientY); dernierTap = 0 } else dernierTap = t
        }
        depart = null
      }
    }
    scene.addEventListener('pointerup', lever)
    scene.addEventListener('pointercancel', lever)
  }

  // ══ FORMULAIRE DE CONTACT ════════════════════════════════════════
  $$('form.formulaire').forEach(function (f) {
    var etat = $('.etat', f)
    var sel = $('select[name="app"]', f)
    var q = /[?&]app=([a-z0-9-]+)/.exec(location.search)
    if (q && sel) sel.value = q[1]
    function erreur (champ, msg) {
      var el = f.elements[champ], err = $('#' + el.id + '-erreur')
      el.setAttribute('aria-invalid', msg ? 'true' : 'false')
      if (err) err.textContent = msg || ''
      return !msg
    }
    function verifier (nom) {
      var v = (f.elements[nom].value || '').trim()
      if (nom === 'nom') return erreur(nom, v.length < 2 ? T.errNom : '')
      if (nom === 'joindre') {
        var mail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
        var tel = (v.replace(/[^\d]/g, '').length >= 8) && /^[+\d][\d\s().-]*$/.test(v)
        return erreur(nom, !v ? T.errJoindreVide : (!mail && !tel ? T.errJoindre : ''))
      }
      if (nom === 'message') return erreur(nom, v.length < 10 ? T.errMessage : '')
      return true
    }
    ;['nom', 'joindre', 'message'].forEach(function (n) {
      f.elements[n].addEventListener('blur', function () { if (f.elements[n].value) verifier(n) })
      f.elements[n].addEventListener('input', function () { if (f.elements[n].getAttribute('aria-invalid') === 'true') verifier(n) })
    })
    f.addEventListener('submit', function (e) {
      e.preventDefault()
      var ok = ['nom', 'joindre', 'message'].map(verifier)
      if (ok.indexOf(false) >= 0) {
        etat.hidden = false; etat.className = 'etat ko'; etat.textContent = T.formKo
        var premier = $('[aria-invalid="true"]', f); if (premier) premier.focus()
        return
      }
      var app = sel && sel.value ? sel.options[sel.selectedIndex].text : T.appInconnue
      var texte = T.waIntro + '\n' + T.waNom + ' ' + f.elements.nom.value.trim() + '\n' + T.waJoindre + ' ' + f.elements.joindre.value.trim()
        + '\n' + T.waApp + ' ' + app + '\n\n' + f.elements.message.value.trim()
      var lien = 'https://wa.me/' + D.whatsapp + '?text=' + encodeURIComponent(texte)
      var w = window.open(lien, '_blank', 'noopener')
      etat.hidden = false; etat.className = 'etat ok'
      etat.innerHTML = esc(T.formOk) + ' <a href="' + esc(lien) + '" target="_blank" rel="noopener">' + esc(T.formOkLien) + '</a>'
      if (!w) etat.querySelector('a').focus()
    })
  })

  // Le bouton « Demander une démo » du showcase, sur l'accueil : il
  // descend au formulaire de la page et choisit l'application.
  doc.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-demo]')
    if (!a) return
    var f = $('#contact form.formulaire')
    if (!f) return
    e.preventDefault()
    var sel = $('select[name="app"]', f); if (sel) sel.value = a.getAttribute('data-demo')
    $('#contact').scrollIntoView({ block: 'start' })
    setTimeout(function () { f.elements.nom.focus({ preventScroll: true }) }, MOUV ? 450 : 0)
  })

  // ══ COMPTEURS ANIMÉS (03/10/2026) ══════════════════════════════════
  // Ils comptent de 0 à leur valeur à l'entrée dans l'écran, une seule fois,
  // avec un ralenti doux. Sans animation demandée : la valeur, tout de suite.
  var compteurs = $$('.compteur-n[data-compte]')
  if (compteurs.length && MOUV && 'IntersectionObserver' in window) {
    var fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') }
    compteurs.forEach(function (c) { c.textContent = '0' + (c.getAttribute('data-suffixe') || '') })
    var vuC = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (en) {
        if (!en.isIntersecting) return
        vuC.unobserve(en.target)
        var el = en.target, fin = Number(el.getAttribute('data-compte')) || 0, suf = el.getAttribute('data-suffixe') || '', t0 = null
        // Minuterie plutôt que requestAnimationFrame : celui-ci s'arrête dans un
        // onglet en arrière-plan, et le compteur resterait à 0.
        t0 = Date.now()
        var pas = function () {
          var k = Math.min(1, (Date.now() - t0) / 1600), doux = 1 - Math.pow(1 - k, 3)
          el.textContent = fmt(Math.round(fin * doux)) + suf
          if (k < 1) setTimeout(pas, 16)
        }
        pas()
      })
    }, { threshold: 0.4 })
    compteurs.forEach(function (c) { vuC.observe(c) })
  }

  // ══ COMPARATIF : DEUX LOGICIELS CÔTE À CÔTE SUR TÉLÉPHONE ══════════
  // Le tableau est le même que sur grand écran ; sur téléphone, seules les
  // deux colonnes choisies restent visibles (aucune information perdue : on
  // change de logiciel dans les menus). Un besoin touché propose le bon logiciel.
  var selects = $$('[data-comparer]')
  function montrerColonnes () {
    var ids = selects.map(function (s) { return s.value })
    $$('.comparatif [data-col]').forEach(function (c) { c.classList.toggle('montre', ids.indexOf(c.getAttribute('data-col')) >= 0) })
    $$('[data-besoin]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-besoin') === ids[0] ? 'true' : 'false') })
  }
  if (selects.length === 2) {
    selects.forEach(function (s, k) {
      s.addEventListener('change', function () {
        var autre = selects[1 - k]
        if (autre.value === s.value) autre.value = (autre.options[0].value === s.value ? autre.options[1] : autre.options[0]).value
        montrerColonnes()
      })
    })
    $$('[data-besoin]').forEach(function (b) {
      b.addEventListener('click', function () {
        selects[0].value = b.getAttribute('data-besoin')
        if (selects[1].value === selects[0].value) selects[1].value = (selects[1].options[0].value === selects[0].value ? selects[1].options[1] : selects[1].options[0]).value
        montrerColonnes()
      })
    })
    montrerColonnes()
  }

  // ══ « TROUVEZ VOTRE LOGICIEL » EN 3 QUESTIONS ═══════════════════════
  var tv = $('#trouver')
  if (tv && D && D.apps) {
    var choix = { app: null, postes: null }
    var etape = function (n) { $$('.trouver-etape', tv).forEach(function (e) { var k = +e.getAttribute('data-etape'); e.hidden = k > n }) }
    var resultat = function () {
      var a = D.apps.filter(function (x) { return x.id === choix.app })[0]; if (!a) return
      var r = $('.trouver-resultat', tv)
      var note = choix.postes === 6 ? T.trouverPostesPlus : choix.postes === 1 ? T.trouverPostesUn : T.trouverPostesOk
      r.innerHTML = '<span class="sourcil">' + esc(T.trouverPour) + '</span><h4>' + esc(a.nom) + '</h4><p>' + esc(a.accroche || '') + '</p><p class="qualite-note">' + esc(note) + '</p>'
        + '<div class="actions"><a class="btn btn-encre" href="contact.html?app=' + esc(a.id) + '" data-demo="' + esc(a.id) + '">' + esc(T.trouverEquiper) + '</a>'
        + '<a class="btn" href="#applications/' + esc(a.id) + '" data-voir="' + esc(a.id) + '">' + esc(T.trouverVoir) + '</a>'
        + '<button type="button" class="btn" data-recommencer>' + esc(T.trouverRecommencer) + '</button></div>'
      r.hidden = false
      var h = $('h4', r); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }) }
    }
    tv.addEventListener('click', function (e) {
      var voir = e.target.closest('a[data-voir]')
      if (voir && typeof window.PLM_montrerApp === 'function' && window.PLM_montrerApp(voir.getAttribute('data-voir'))) { e.preventDefault(); return }
      var b = e.target.closest('button'); if (!b) return
      if (b.hasAttribute('data-recommencer')) { choix = { app: null, postes: null }; $$('.trouver-choix button', tv).forEach(function (x) { x.setAttribute('aria-pressed', 'false') }); $('.trouver-resultat', tv).hidden = true; return etape(1) }
      var groupe = b.parentElement; $$('button', groupe).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false') })
      if (b.hasAttribute('data-activite')) {
        $('.trouver-resultat', tv).hidden = true
        if (b.getAttribute('data-question') === 'caisse') { choix.app = null; return etape(2) }
        choix.app = b.getAttribute('data-app'); var e2 = $('[data-etape="2"]', tv); e2.hidden = true
        $$('.trouver-etape', tv).forEach(function (x) { if (x.getAttribute('data-etape') === '3') x.hidden = false })
        return
      }
      if (b.closest('[data-etape="2"]')) { choix.app = b.getAttribute('data-app'); $$('.trouver-etape', tv).forEach(function (x) { if (x.getAttribute('data-etape') === '3') x.hidden = false }); return }
      if (b.hasAttribute('data-postes')) { choix.postes = +b.getAttribute('data-postes'); if (choix.app) resultat() }
    })
  }
})()
