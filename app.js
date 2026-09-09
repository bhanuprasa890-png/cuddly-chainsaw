/* ═══════════ RapidGo · app logic (auth, fares, booking, maps) ═══════════ */
(function () {
'use strict';
var $ = function (id) { return document.getElementById(id); };
var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

/* ─────────── data ─────────── */
var VEHICLES = {
  bike:       { name: 'Bike Taxi',        icon: '🏍️', type: 'ride',   base: 20,  perKm: 9,  min: 30,  eta: '~2 min',  cap: '1 rider',       desc: 'Fastest for solo trips & traffic cuts.' },
  auto:       { name: 'Auto',             icon: '🛺', type: 'ride',   base: 30,  perKm: 14, min: 50,  eta: '~4 min',  cap: 'Up to 3 riders', desc: 'Classic 3-wheeler for short hops.' },
  car:        { name: 'Cab · Economy',    icon: '🚕', type: 'ride',   base: 50,  perKm: 19, min: 80,  eta: '~6 min',  cap: 'Up to 4 riders', desc: 'Comfortable AC cabs for family.' },
  parcelBike: { name: 'Parcel · Bike',    icon: '🛵', type: 'parcel', base: 35,  perKm: 11, min: 49,  eta: '~5 min',  cap: 'Up to 5 kg',     desc: 'Documents, food & small packets.' },
  parcelCar:  { name: 'Parcel · Car',     icon: '🚗', type: 'parcel', base: 80,  perKm: 24, min: 120, eta: '~10 min', cap: 'Up to 200 kg',   desc: 'Cartons, appliances & bulk goods.' },
  truck:      { name: 'Truck · Mini',     icon: '🚚', type: 'parcel', base: 199, perKm: 38, min: 299, eta: '~20 min', cap: 'Up to 1000 kg',  desc: 'Furniture, shifting & full loads.' }
};
var DEMO_ACCOUNTS = [
  { name: 'Aarav Sharma', email: 'aarav.sharma.demo@gmail.com', pass: 'demo1234', color: '#EA4335' },
  { name: 'Priya Patel',  email: 'priya.patel.demo@gmail.com',  pass: 'demo1234', color: '#4285F4' },
  { name: 'Rahul Verma',  email: 'rahul.rider.demo@gmail.com',  pass: 'demo1234', color: '#FBBC05' },
  { name: 'Sneha Iyer',   email: 'sneha.iyer.demo@gmail.com',   pass: 'demo1234', color: '#34A853' }
];
var DRIVERS = [
  { name: 'Ramesh Kumar', num: 'DL 8C AB 1234', rating: '4.9★' },
  { name: 'Suresh Yadav', num: 'KA 05 MN 5678', rating: '4.8★' },
  { name: 'Imran Khan',   num: 'MH 12 XY 9012', rating: '4.9★' },
  { name: 'Vikram Singh', num: 'UP 16 CT 3456', rating: '4.7★' },
  { name: 'Deepa Nair',   num: 'KL 07 BK 7890', rating: '5.0★' }
];

/* ─────────── helpers ─────────── */
function inr(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
function toast(msg, cls) {
  var t = document.createElement('div');
  t.className = 'toast ' + (cls || ''); t.textContent = msg;
  $('toast-root').appendChild(t);
  setTimeout(function () { t.style.opacity = '0'; t.style.transition = '.4s'; }, 2600);
  setTimeout(function () { t.remove(); }, 3100);
}
function calcFare(key, km, peak, weightFactor) {
  var v = VEHICLES[key];
  var distFare = v.perKm * km;
  var sub = Math.max(v.min, v.base + distFare);
  var wf = weightFactor || 1;
  var peakAmt = peak ? sub * wf * 0.2 : 0;
  return { v: v, base: v.base, distFare: distFare, sub: sub, wf: wf, peakAmt: peakAmt, total: Math.round(sub * wf + peakAmt) };
}
function mapsUrl(q) { return 'https://www.google.com/maps?q=' + encodeURIComponent(q) + '&output=embed'; }

/* ─────────── storage: users / session / bookings ─────────── */
function getUsers() { try { return JSON.parse(localStorage.getItem('rg_users') || '[]'); } catch (e) { return []; } }
function saveUsers(u) { localStorage.setItem('rg_users', JSON.stringify(u)); }
function seedDemos() {
  var users = getUsers(), changed = false;
  DEMO_ACCOUNTS.forEach(function (d) {
    if (!users.some(function (u) { return u.email === d.email; })) { users.push(d); changed = true; }
  });
  if (changed) saveUsers(users);
}
function session() { try { return JSON.parse(localStorage.getItem('rg_session') || 'null'); } catch (e) { return null; } }
function setSession(u) { u ? localStorage.setItem('rg_session', JSON.stringify(u)) : localStorage.removeItem('rg_session'); updateAuthUI(); }
function getBookings() { try { return JSON.parse(localStorage.getItem('rg_bookings') || '[]'); } catch (e) { return []; } }
function saveBookings(b) { localStorage.setItem('rg_bookings', JSON.stringify(b)); }

/* ─────────── auth UI ─────────── */
function initials(name) { return name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase(); }
function updateAuthUI() {
  var u = session();
  $('authBtn').hidden = !!u;
  $('myRidesBtn').hidden = !u;
  $('userChip').hidden = !u;
  if (u) {
    $('userAvatar').textContent = initials(u.name);
    $('userAvatar').style.background = u.color || '#16181d';
    $('userName').textContent = u.name.split(' ')[0];
  }
}
var pendingAction = null;
function requireLogin(action) {
  if (session()) { action(); return; }
  pendingAction = action;
  openOverlay('authOverlay');
  toast('Please login first 🔑');
}
function openOverlay(id) { $(id).classList.add('show'); document.body.style.overflow = 'hidden'; }
function closeOverlay(id) { $(id).classList.remove('show'); document.body.style.overflow = ''; }

var authMode = 'login';
function setAuthMode(m) {
  authMode = m;
  $$('.auth-tabs button').forEach(function (b) { b.classList.toggle('active', b.dataset.authtab === m); });
  $('nameRow').hidden = (m === 'login');
  $('authTitle').textContent = m === 'login' ? 'Welcome back 👋' : 'Create account 🚀';
  $('authSubmit').textContent = m === 'login' ? 'Login →' : 'Signup →';
}
function doEmailAuth() {
  var name = $('authName').value.trim(), email = $('authEmail').value.trim().toLowerCase(), pass = $('authPass').value;
  if (!email || !pass) return toast('Enter email & password', 'err');
  var users = getUsers();
  if (authMode === 'signup') {
    if (!name) return toast('Enter your name', 'err');
    if (users.some(function (u) { return u.email === email; })) return toast('Account exists — please login', 'err');
    var nu = { name: name, email: email, pass: pass, color: '#16181d' };
    users.push(nu); saveUsers(users); setSession(nu);
    closeOverlay('authOverlay'); toast('Account created. Welcome, ' + name.split(' ')[0] + '! 🎉', 'ok');
  } else {
    var found = users.find(function (u) { return u.email === email && u.pass === pass; });
    if (!found) return toast('Invalid email or password', 'err');
    setSession(found); closeOverlay('authOverlay');
    toast('Welcome back, ' + found.name.split(' ')[0] + '! 👋', 'ok');
  }
  if (pendingAction) { var a = pendingAction; pendingAction = null; setTimeout(a, 300); }
}
/* simulated Google login */
function googleLogin(email, btn) {
  var go = btn ? btn.querySelector('.go') : null;
  if (go) go.innerHTML = '<span class="spin" style="margin:0"></span>';
  setTimeout(function () {
    var users = getUsers();
    var u = users.find(function (x) { return x.email === email; }) ||
            DEMO_ACCOUNTS.find(function (x) { return x.email === email; });
    if (u && !users.some(function (x) { return x.email === u.email; })) { users.push(u); saveUsers(users); }
    setSession(u);
    closeOverlay('googleOverlay'); closeOverlay('authOverlay');
    toast('Signed in with Google as ' + u.name + ' ✅', 'ok');
    if (pendingAction) { var a = pendingAction; pendingAction = null; setTimeout(a, 300); }
  }, 900);
}
function renderChooser() {
  $('chooserList').innerHTML = '';
  DEMO_ACCOUNTS.forEach(function (d) {
    var b = document.createElement('button');
    b.className = 'gacc';
    b.innerHTML = '<span class="avatar" style="background:' + d.color + '">' + initials(d.name) + '</span>' +
      '<span><b>' + d.name + '</b><small>' + d.email + '</small></span><span class="go">›</span>';
    b.onclick = function () { googleLogin(d.email, b); };
    $('chooserList').appendChild(b);
  });
}
function renderDemoGrid() {
  var grid = $('demoGrid'); grid.innerHTML = '';
  DEMO_ACCOUNTS.forEach(function (d) {
    var c = document.createElement('div');
    c.className = 'demo-card rv in';
    c.innerHTML = '<div class="avatar" style="background:' + d.color + '">' + initials(d.name) + '</div>' +
      '<h3>' + d.name + '</h3><p class="email">' + d.email + '</p>' +
      '<p class="pass">🔑 password: <b>demo1234</b></p>' +
      '<button class="btn btn-google btn-block"><span class="g">G</span> Continue as ' + d.name.split(' ')[0] + '</button>';
    c.querySelector('button').onclick = function () { googleLogin(d.email, null); };
    grid.appendChild(c);
  });
}

/* ─────────── hero booking widget ─────────── */
var bookTab = 'ride', bookVehicle = 'bike';
function renderChips() {
  var wrap = $('vehicleChips'); wrap.innerHTML = '';
  Object.keys(VEHICLES).filter(function (k) { return VEHICLES[k].type === bookTab; }).forEach(function (k) {
    var v = VEHICLES[k];
    var c = document.createElement('button');
    c.className = 'chip' + (k === bookVehicle ? ' active' : '');
    c.innerHTML = v.icon + ' ' + v.name + '<small>₹' + v.perKm + '/km · ' + v.eta + '</small>';
    c.onclick = function () { bookVehicle = k; renderChips(); updateFare(); };
    wrap.appendChild(c);
  });
}
function updateFare() {
  var km = Math.max(1, +$('distance').value || 1);
  $('distVal').textContent = km;
  var f = calcFare(bookVehicle, km, $('peakToggle').checked, 1);
  $('fareVehicle').textContent = f.v.icon + ' ' + f.v.name;
  $('fareEta').textContent = '· ' + f.v.eta + ' away · ' + f.v.cap;
  $('farePerKm').textContent = inr(f.v.perKm);
  $('fareBreak').textContent = inr(f.base) + ' + ' + inr(f.distFare) + (f.peakAmt ? ' + peak ' + inr(f.peakAmt) : '');
  $('fareTotal').textContent = inr(f.total);
  return f;
}
/* ride cards section */
function renderRideCards() {
  var wrap = $('rideCards'); wrap.innerHTML = '';
  var tags = { bike: '⚡ FASTEST', auto: '💰 VALUE', car: '❄️ COMFORT' };
  ['bike', 'auto', 'car'].forEach(function (k) {
    var v = VEHICLES[k];
    var d = document.createElement('div');
    d.className = 'ride-card tilt rv in';
    d.innerHTML = '<span class="tag">' + tags[k] + '</span><div class="ico">' + v.icon + '</div>' +
      '<h3>' + v.name + '</h3><p class="rate">Base ' + inr(v.base) + ' + ' + inr(v.perKm) + '/km</p>' +
      '<ul><li>⏱️ Pickup ' + v.eta + '</li><li>👥 ' + v.cap + '</li><li>ℹ️ ' + v.desc + '</li></ul>';
    d.onclick = function () {
      bookTab = 'ride'; bookVehicle = k;
      $$('.book-tab').forEach(function (t) { t.classList.toggle('active', t.dataset.tab === 'ride'); });
      renderChips(); updateFare();
      document.getElementById('book').scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast(v.name + ' selected ' + v.icon);
    };
    wrap.appendChild(d);
  });
}
/* parcel section */
var parcelVehicle = 'parcelBike';
function renderParcelVehicles() {
  var wrap = $('parcelVehicles'); wrap.innerHTML = '';
  ['parcelBike', 'parcelCar', 'truck'].forEach(function (k) {
    var v = VEHICLES[k];
    var d = document.createElement('div');
    d.className = 'pv-card' + (k === parcelVehicle ? ' sel' : '');
    d.innerHTML = '<div class="ico">' + v.icon + '</div><div><h3>' + v.name + '</h3>' +
      '<span class="rate">Base ' + inr(v.base) + ' + ' + inr(v.perKm) + '/km</span><p>' + v.cap + ' · ' + v.desc + '</p></div>';
    d.onclick = function () { parcelVehicle = k; renderParcelVehicles(); updateParcelFare(); };
    wrap.appendChild(d);
  });
}
function updateParcelFare() {
  var km = Math.max(1, +$('pDist').value || 1);
  var wf = parseFloat($('pWeight').value);
  var f = calcFare(parcelVehicle, km, false, wf);
  $('pFareVehicle').textContent = f.v.icon + ' ' + f.v.name;
  $('pFareCap').textContent = '· ' + f.v.cap;
  $('pFareBreak').textContent = inr(f.base) + ' + ' + inr(f.distFare) + ' × ' + wf;
  $('pFareTotal').textContent = inr(f.total);
  return f;
}
/* calculator */
var calcVehicle = 'bike';
function renderCalc() {
  var wrap = $('calcVehicles'); wrap.innerHTML = '';
  Object.keys(VEHICLES).forEach(function (k) {
    var v = VEHICLES[k];
    var d = document.createElement('div');
    d.className = 'cv' + (k === calcVehicle ? ' sel' : '');
    d.innerHTML = '<div class="ico">' + v.icon + '</div><b>' + v.name + '</b><span>' + inr(v.perKm) + '/km</span>';
    d.onclick = function () { calcVehicle = k; renderCalc(); updateCalc(); };
    wrap.appendChild(d);
  });
  var bars = $('rateBars'); bars.innerHTML = '';
  var max = Math.max.apply(null, Object.keys(VEHICLES).map(function (k) { return VEHICLES[k].perKm; }));
  Object.keys(VEHICLES).forEach(function (k, i) {
    var v = VEHICLES[k];
    var r = document.createElement('div');
    r.className = 'rbar';
    r.innerHTML = '<span>' + v.icon + ' ' + v.name + '</span><div class="track"><div class="fill"></div></div><b>' + inr(v.perKm) + '</b>';
    bars.appendChild(r);
    setTimeout(function () { r.querySelector('.fill').style.width = (v.perKm / max * 100) + '%'; }, 60 * i);
  });
}
function updateCalc() {
  var km = Math.max(1, +$('cDist').value || 1);
  $('cDistVal').textContent = km;
  var f = calcFare(calcVehicle, km, $('cPeak').checked, 1);
  $('cBase').textContent = inr(f.base);
  $('cDistFare').textContent = inr(f.distFare) + '  (' + inr(f.v.perKm) + ' × ' + km + ' km)';
  $('cPeakFare').textContent = f.peakAmt ? inr(f.peakAmt) : '—';
  $('cTotal').textContent = inr(f.total);
  return f;
}

/* ─────────── booking ─────────── */
function newBookingId() { return 'RG-' + Date.now().toString(36).toUpperCase().slice(-6); }
var tripTimer = [];
function clearTrip() { tripTimer.forEach(clearTimeout); tripTimer = []; }
function confirmBooking(opts) {
  var u = session();
  var driver = DRIVERS[Math.floor(Math.random() * DRIVERS.length)];
  var bk = {
    id: newBookingId(), email: u.email, kind: opts.kind,
    vehicle: opts.vehicle, pickup: opts.pickup, drop: opts.drop,
    km: opts.km, fare: opts.fare, driver: driver.name + ' · ' + driver.num + ' · ' + driver.rating,
    otp: String(Math.floor(1000 + Math.random() * 9000)),
    status: 'Ongoing', time: new Date().toLocaleString('en-IN')
  };
  var all = getBookings(); all.unshift(bk); saveBookings(all);
  /* fill modal */
  $('bkTitle').textContent = opts.kind === 'parcel' ? 'Parcel pickup booked! 📦' : 'Booking confirmed! 🎉';
  $('bkId').textContent = bk.id;
  $('bkVehicle').textContent = VEHICLES[opts.vehicle].icon + ' ' + VEHICLES[opts.vehicle].name;
  $('bkRoute').textContent = (opts.pickup.length > 26 ? opts.pickup.slice(0, 26) + '…' : opts.pickup) + ' → ' +
                             (opts.drop.length > 26 ? opts.drop.slice(0, 26) + '…' : opts.drop);
  $('bkFare').textContent = inr(opts.fare);
  $('bkDriver').textContent = bk.driver;
  $('bkOtp').textContent = bk.otp;
  $('bkTrack').onclick = function () {
    window.open('https://www.google.com/maps/dir/' + encodeURIComponent(opts.pickup) + '/' + encodeURIComponent(opts.drop), '_blank');
  };
  $('bkCancel').onclick = function () {
    var list = getBookings();
    var it = list.find(function (x) { return x.id === bk.id; });
    if (it) { it.status = 'Cancelled'; saveBookings(list); }
    clearTrip(); closeOverlay('bookOverlay'); toast('Booking ' + bk.id + ' cancelled', 'err');
  };
  /* trip animation */
  clearTrip();
  var steps = $$('#tripSteps .tstep');
  steps.forEach(function (s) { s.className = 'tstep'; });
  steps[0].classList.add('active');
  [1, 2, 3].forEach(function (i) {
    tripTimer.push(setTimeout(function () {
      steps[i - 1].classList.remove('active'); steps[i - 1].classList.add('done');
      steps[i].classList.add('active');
      if (i === 3) {
        var list = getBookings();
        var it = list.find(function (x) { return x.id === bk.id; });
        if (it && it.status === 'Ongoing') { it.status = 'Completed'; saveBookings(list); }
      }
    }, i * 3500));
  });
  openOverlay('bookOverlay');
  confetti();
  toast('Booking ' + bk.id + ' confirmed ✅', 'ok');
}
function bookRide() {
  var pickup = $('pickup').value.trim(), drop = $('drop').value.trim();
  if (!pickup || !drop) return toast('Enter pickup & drop locations', 'err');
  var km = Math.max(1, +$('distance').value || 1);
  var f = calcFare(bookVehicle, km, $('peakToggle').checked, 1);
  requireLogin(function () {
    confirmBooking({ kind: bookTab, vehicle: bookVehicle, pickup: pickup, drop: drop, km: km, fare: f.total });
  });
}
function bookParcel() {
  if (!$('pSender').value.trim() || !$('pReceiver').value.trim()) return toast('Enter sender & receiver names', 'err');
  if (!$('pPickup').value.trim() || !$('pDrop').value.trim()) return toast('Enter pickup & drop addresses', 'err');
  var km = Math.max(1, +$('pDist').value || 1);
  var wf = parseFloat($('pWeight').value);
  if (wf >= 1.4 && parcelVehicle !== 'truck') return toast('200kg+ loads need the Truck 🚚', 'err');
  var f = calcFare(parcelVehicle, km, false, wf);
  requireLogin(function () {
    confirmBooking({ kind: 'parcel', vehicle: parcelVehicle, pickup: $('pPickup').value.trim(), drop: $('pDrop').value.trim(), km: km, fare: f.total });
  });
}
/* drawer */
function openRides() {
  var u = session();
  if (!u) { requireLogin(openRides); return; }
  var list = getBookings().filter(function (b) { return b.email === u.email; });
  var box = $('ridesList'); box.innerHTML = '';
  if (!list.length) { box.innerHTML = '<p class="empty">No bookings yet.<br/>Book your first ride! 🛵</p>'; }
  list.forEach(function (b) {
    var d = document.createElement('div');
    d.className = 'ride-item';
    d.innerHTML = '<span class="st' + (b.status === 'Cancelled' ? ' cancelled' : '') + '">' + b.status + '</span>' +
      '<b>' + VEHICLES[b.vehicle].icon + ' ' + VEHICLES[b.vehicle].name + '</b> · ' + inr(b.fare) +
      '<br/><small>' + b.id + ' · ' + b.km + ' km · ' + b.time + '</small>' +
      '<br/><small>📍 ' + b.pickup + ' → ' + b.drop + '</small>' +
      '<br/><small>🧑‍✈️ ' + b.driver + ' · OTP ' + b.otp + '</small>';
    box.appendChild(d);
  });
  $('ridesDrawer').classList.add('show');
  $('drawerOverlay').classList.add('show');
}
function closeRides() { $('ridesDrawer').classList.remove('show'); $('drawerOverlay').classList.remove('show'); }

/* ─────────── confetti ─────────── */
function confetti() {
  var c = $('confetti-canvas'), g = c.getContext('2d');
  c.width = innerWidth; c.height = innerHeight;
  var colors = ['#FFC300', '#16181d', '#EA4335', '#4285F4', '#34A853', '#fff'];
  var parts = [];
  for (var i = 0; i < 160; i++) parts.push({
    x: innerWidth / 2, y: innerHeight / 2 - 100,
    vx: (Math.random() - 0.5) * 14, vy: Math.random() * -11 - 2,
    s: 4 + Math.random() * 6, c: colors[i % colors.length], r: Math.random() * 6
  });
  var frames = 0;
  (function tick() {
    g.clearRect(0, 0, c.width, c.height); frames++;
    parts.forEach(function (p) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.35; p.r += 0.1;
      g.save(); g.translate(p.x, p.y); g.rotate(p.r);
      g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); g.restore();
    });
    if (frames < 140) requestAnimationFrame(tick); else g.clearRect(0, 0, c.width, c.height);
  })();
}

/* ─────────── UI effects ─────────── */
function initTilt() {
  if (!('ontouchstart' in window)) {
    $$('.tilt').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateY(' + x * 7 + 'deg) rotateX(' + (-y * 7) + 'deg)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }
}
function initReveal() {
  $$('.ride-card,.step,.review,.demo-card,.pv-card,.calc-bill').forEach(function (el) { el.classList.add('rv'); });
  var io = new IntersectionObserver(function (ents) {
    ents.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  $$('.rv').forEach(function (el) { io.observe(el); });
}
function initCounters() {
  var io = new IntersectionObserver(function (ents) {
    ents.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target, target = +el.dataset.target, cur = 0;
      var step = Math.max(1, Math.round(target / 40));
      var iv = setInterval(function () { cur += step; if (cur >= target) { cur = target; clearInterval(iv); } el.textContent = cur; }, 40);
      io.unobserve(el);
    });
  }, { threshold: 0.4 });
  $$('.counter').forEach(function (el) { io.observe(el); });
}

/* ─────────── wire up ─────────── */
document.addEventListener('DOMContentLoaded', function () {
  seedDemos(); updateAuthUI();
  renderChips(); updateFare(); renderRideCards();
  renderParcelVehicles(); updateParcelFare();
  renderCalc(); updateCalc();
  renderChooser(); renderDemoGrid();
  initTilt(); initReveal(); initCounters();

  $$('.book-tab').forEach(function (t) {
    t.onclick = function () {
      $$('.book-tab').forEach(function (x) { x.classList.remove('active'); });
      t.classList.add('active'); bookTab = t.dataset.tab;
      bookVehicle = bookTab === 'ride' ? 'bike' : 'parcelBike';
      renderChips(); updateFare();
    };
  });
  $('distance').oninput = updateFare;
  $('peakToggle').onchange = updateFare;
  $('swapBtn').onclick = function () { var a = $('pickup').value; $('pickup').value = $('drop').value; $('drop').value = a; };
  $('sampleRoute').onclick = function () {
    $('pickup').value = 'Connaught Place, New Delhi'; $('drop').value = 'IGI Airport, New Delhi';
    $('distance').value = 12; updateFare(); toast('Sample route loaded 📍');
  };
  $('bookNowBtn').onclick = bookRide;
  $('viewOnMaps').onclick = function () {
    window.open('https://www.google.com/maps/dir/' + encodeURIComponent($('pickup').value) + '/' + encodeURIComponent($('drop').value), '_blank');
  };
  $('pDist').oninput = updateParcelFare; $('pWeight').onchange = updateParcelFare;
  $('parcelBookBtn').onclick = bookParcel;
  $('cDist').oninput = updateCalc; $('cPeak').onchange = updateCalc;
  $('calcBookBtn').onclick = function () {
    var v = VEHICLES[calcVehicle];
    bookTab = v.type; bookVehicle = calcVehicle;
    $$('.book-tab').forEach(function (t) { t.classList.toggle('active', t.dataset.tab === bookTab); });
    renderChips(); $('distance').value = $('cDist').value; $('peakToggle').checked = $('cPeak').checked; updateFare();
    document.getElementById('book').scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  /* maps */
  $('mapGo').onclick = function () { $('gmap').src = mapsUrl($('mapSearch').value || 'New Delhi'); toast('Map updated 🗺️'); };
  $('mapSearch').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('mapGo').click(); });
  $('mapDirections').onclick = function () {
    window.open('https://www.google.com/maps/dir/' + encodeURIComponent($('pickup').value) + '/' + encodeURIComponent($('drop').value), '_blank');
  };

  /* auth */
  $('authBtn').onclick = function () { setAuthMode('login'); openOverlay('authOverlay'); };
  $$('.auth-tabs button').forEach(function (b) { b.onclick = function () { setAuthMode(b.dataset.authtab); }; });
  $('authSubmit').onclick = doEmailAuth;
  $('googleBtn').onclick = function () { closeOverlay('authOverlay'); openOverlay('googleOverlay'); };
  $('chooserAnother').onclick = function () { closeOverlay('googleOverlay'); setAuthMode('signup'); openOverlay('authOverlay'); };
  $('userChip').onclick = function (e) { if (e.target.closest('.user-menu')) return; $('userChip').classList.toggle('open'); };
  $('menuLogout').onclick = function () { setSession(null); $('userChip').classList.remove('open'); toast('Logged out. See you soon! 👋'); };
  $('menuRides').onclick = function () { $('userChip').classList.remove('open'); openRides(); };
  $('myRidesBtn').onclick = openRides;
  $('drawerClose').onclick = closeRides;
  $('drawerOverlay').onclick = closeRides;
  $$('[data-close]').forEach(function (b) { b.onclick = function () { closeOverlay(b.dataset.close); }; });
  ['authOverlay', 'googleOverlay', 'bookOverlay'].forEach(function (id) {
    $(id).addEventListener('click', function (e) { if (e.target === $(id)) closeOverlay(id); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { ['authOverlay', 'googleOverlay', 'bookOverlay'].forEach(closeOverlay); closeRides(); }
    if (e.key === 'Enter' && $('authOverlay').classList.contains('show')) doEmailAuth();
  });

  /* mobile nav */
  $('hamburger').onclick = function () { $('navLinks').classList.toggle('open'); };
  $$('#navLinks a').forEach(function (a) { a.onclick = function () { $('navLinks').classList.remove('open'); }; });
});
})();
