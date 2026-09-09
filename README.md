# 🛵 RapidGo — Rapido-style Clone with 3D Animation

A Rapido-lookalike ride + parcel booking website with a live **3D animated city** (Three.js),
**login/signup + Sign in with Google (demo)**, **bike / auto / cab rides**, **parcel delivery
via bike, car & truck**, **distance-based fares**, and **Google Maps access** — all in one static site.

## ✨ Features

| Feature | Details |
|---|---|
| 🎨 Rapido-style UI | Yellow/black theme, booking widget, services, fares, reviews |
| 🏙️ 3D animation | Three.js night city: moving scooter/bike, cars, truck, lit buildings, floating parcels, mouse parallax |
| 🔑 Auth | Email/password login + signup (browser localStorage) |
| 🔵 Sign in with Google (demo) | Google-style account chooser with 4 demo accounts, 1-tap login |
| 🛵 Rides | Bike Taxi, Auto, Cab with per-km fares + ETA |
| 📦 Parcel | **Bike** (≤5 kg), **Car** (≤200 kg), **Truck** (≤1000 kg) + weight factor |
| 💰 Fare engine | `max(minFare, base + perKm × km) × weight × peak(1.2)` — shown upfront |
| 🗺️ Google access | Embedded Google Map, Directions link, “Open Google / Google Maps” buttons, per-booking tracking link |
| 🧾 My Rides | Booking history with ID, driver, OTP, live trip progress, cancel |
| 📱 Responsive | Mobile hamburger menu, adaptive grids |

## 💰 Fare chart (base + per km, minimum)

| Vehicle | Base | Per km | Min |
|---|---|---|---|
| Bike Taxi | ₹20 | ₹9 | ₹30 |
| Auto | ₹30 | ₹14 | ₹50 |
| Cab Economy | ₹50 | ₹19 | ₹80 |
| Parcel · Bike | ₹35 | ₹11 | ₹49 |
| Parcel · Car | ₹80 | ₹24 | ₹120 |
| Truck · Mini | ₹199 | ₹38 | ₹299 |

Peak hours ×1.2 · Parcel weight factor ×1 → ×1.4.

## 🔑 Demo Google accounts (password: `demo1234`)

| Name | Email |
|---|---|
| Aarav Sharma | aarav.sharma.demo@gmail.com |
| Priya Patel | priya.patel.demo@gmail.com |
| Rahul Verma | rahul.rider.demo@gmail.com |
| Sneha Iyer | sneha.iyer.demo@gmail.com |

Click **“Continue with Google”** → pick an account → logged in. (Simulated OAuth for demo;
no real Google credentials are used. Login state lives in browser `localStorage`.)

### Going real later?
Create an OAuth Client ID in [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
add Google Identity Services to `index.html`, and verify the ID token on your backend.

## 🚀 Run locally (local hosting)

Any static server works. From this folder:

```bash
# Python (easiest)
python3 -m http.server 8080 --bind 0.0.0.0

# or Node
npx serve -l 8080 .
```

Then open **http://localhost:8080** in your browser 🎉

## 📁 Files

```
index.html   → all pages/sections + modals
styles.css   → Rapido-style theme + responsive
scene3d.js   → Three.js 3D city animation
app.js       → auth, fares, booking, maps, UI
```

> Demo project for learning. Not affiliated with Rapido. Fares & tracking are simulated.
