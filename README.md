# ✈️ Kingfisher Capital Investment & Master Admin Portal (Instance 2)

A full-stack, enterprise-grade investment and earnings portal themed around **Kingfisher** (Aviation, Luxury Lifestyle & Beverages) featuring a mobile-optimized client application and a comprehensive dark glassmorphic Master Admin Portal with live **Investment Plan Editing**.

---

## 🚀 Key Features

### 📱 Client Mobile App (`/`)
1. **Home Screen**:
   - Modern announcement ticker synced live from Admin Settings.
   - 7 Authentic Kingfisher Investment Plans (Kingfisher Flight Experience, Premium Draught, Ultra Crisp, Airbus A320 Fleet, Royal Aviation Fleet, Private Jet VIP Club, Sovereign Billionaire Club).
   - Dynamic cycle duration, daily return calculations, and purchase limits.
2. **Dedicated Recharge Screen (`#screen-recharge`)**:
   - Real-time synced Kingfisher UPI QR Code uploaded directly from Admin.
   - Multi-QR round-robin rotation pool with **"Change / Refresh QR"** (`Dusra QR Dekhein`).
   - Live 10-minute payment countdown window.
   - One-click **"Pay via UPI App"** deep link (`upi://pay?pa=...`) for PhonePe, Google Pay, and Paytm.
   - 12-digit UTR submission and automated verification queue.
   - Inline recharge history.
3. **Dedicated Withdrawal Screen (`#screen-withdraw`)**:
   - Automated 10% processing fee deduction and net payout calculation.
   - Bank Account & UPI ID binding with instant saving.
   - Minimum withdrawal check synced live from Admin Settings.
   - Inline withdrawal history.
4. **Orders & Daily Earnings (`#screen-income`)**:
   - Live 24-hour countdown timer capsule.
   - Daily income claim button with instant wallet credit.
5. **Lucky Wheel & Daily Attendance (`#screen-task`)**:
   - Fortune wheel with Kingfisher royal styling & physics-based deceleration.
   - Daily ₹15 Attendance Check-in.
6. **3-Level Team Referral System (`#screen-team`)**:
   - Level 1: **40% Commission**
   - Level 2: **3% Commission**
   - Level 3: **1% Commission**
   - One-click copy for invite code and referral links.
7. **Profile & Security (`#screen-profile`)**:
   - Curved header with circular avatar, masked phone (+91 987***4321), and VIP badge.
   - 3 wallet metrics: Available Balance, Recharge Balance, and Total Income.
   - Transaction Records Modal with full details.

---

### 🛡️ Master Admin Portal (`/admin`)
- **Admin URL**: `/admin`
- **Username**: `Kingfisher_SuperAdmin2`
- **Password**: `Kingfisher@2026#BetaAdmin!`
- **✏️ Investment Plans Manager & Editor**:
  - **Edit Any Plan**: Click the golden **"Edit"** button beside any plan to modify its Price, Daily Return, Total Return, Cycle Days, Title, Purchase Limit, and Image (presets or upload)!
  - **Add New Plans**: Instant addition of new investment tiers.
  - **Toggle / Delete**: 1-click active/inactive toggle or deletion.
- **Multi-QR Rotation Pool**: Batch upload 5+ QR codes at once; real-time automatic round-robin rotation across different users to prevent bank UPI limits.
- **Client Dynamic QR Refresh**: When payment fails or UPI limit is reached, users can click **"Change / Refresh QR"** (`Dusra QR Dekhein`) on their recharge screen to instantly switch to another active QR code.
- **Live Platform Financials**: Total Deposits, Total Payouts, Net Platform Float, and Pending Verifications.
- **Recharge Verification**: Review submitted UTRs, preview payment receipts, and credit user wallet with 1-click.
- **Withdrawal Processing**: Review bank account / IFSC / UPI details and mark payouts as Paid or Rejected (with automatic balance refund).
- **Manual Credit / Debit**: Directly adjust any user's balance with an audit note.
- **User Management**: View all users, ban/unban accounts, and reset passwords.
- **Data Export & Backups**: One-click export of Recharges, Withdrawals, Users, and complete database backup.

---

## ☁️ Deployment on Render (Step-by-Step)

This application is 100% configured and optimized for zero-downtime deployment on Render:

1. **GitHub Repository**:
   - Repository: `https://github.com/munna2006-jaat/kingfisher-invest-2.git`
2. **Create Web Service on Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com) and click **New +** -> **Web Service**.
   - Connect the repository `kingfisher-invest-2`.
3. **Configure Settings**:
   - **Name**: `kingfisher-invest-2`
   - **Environment**: `Node`
   - **Region**: `Singapore` (or nearest)
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. **Environment Variables**:
   - `PORT`: `3000` (Render assigns automatically if omitted)
   - `RENDER_EXTERNAL_URL`: `https://kingfisher-invest-2.onrender.com` (enables automatic keep-alive pinging so the free instance never goes to sleep!)
5. **Click Create Web Service** - Your site is live!

---

## 📡 API Health & Keep-Alive
- **Health Check**: `GET /health` or `GET /api/health`
- Returns uptime, Indian Standard Time, and server health status:
  ```json
  {
    "status": "ok",
    "service": "Kingfisher Capital Investment Portal 2",
    "uptime": "1d 2h 10m",
    "serverTime": "26/10/2026, 06:30:00 pm",
    "database": "connected",
    "version": "2.0.0"
  }
  ```
