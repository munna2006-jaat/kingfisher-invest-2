/* ===================================================
   RED BULL ENERGY INVESTMENT - FRONTEND JAVASCRIPT
   Single Page Application with Modern Mobile Flow
   =================================================== */

// Global State
let currentUser = null;
let currentPlans = [];
let currentCategory = 'normal';
let paymentSettings = {};
let bannerIndex = 0;
let bannerImages = ['/images/kingfisher_banner.jpg'];
let rechargeTimerInterval = null;
let currentRechargeAmount = 720;
let isSpinning = false;
let userSpins = 1; // Default 1 spin available for demo
let incomeCountdownInterval = null;

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  await fetchPaymentConfig();

  // Check stored user session
  const storedUser = localStorage.getItem('kingfisher_user_2');
  if (storedUser) {
    try {
      currentUser = JSON.parse(storedUser);
      await refreshUserProfile();
      showScreen('screen-home');
      setNavActive('navHome');
    } catch (e) {
      currentUser = null;
      showScreen('screen-auth');
    }
  } else {
    showScreen('screen-auth');
  }

  // Load plans & start live timers
  await loadPlans();
  startLiveIncomeTimer();
}

// ----------------- TOAST NOTIFICATIONS -----------------
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation';
  toast.innerHTML = `<i class="${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ----------------- NAVIGATION & SCREENS -----------------
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
  }

  // Bottom navbar visibility (hide on auth screen)
  const bottomNav = document.getElementById('bottomNavBar');
  if (bottomNav) {
    if (screenId === 'screen-auth') {
      bottomNav.style.display = 'none';
    } else {
      bottomNav.style.display = 'flex';
    }
  }

  window.scrollTo(0, 0);
}

function setNavActive(navId) {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const activeNav = document.getElementById(navId);
  if (activeNav) activeNav.classList.add('active');
}

function switchNav(tabName) {
  if (!currentUser && tabName !== 'auth') {
    showToast("Please login first!", "error");
    showScreen('screen-auth');
    return;
  }

  if (tabName === 'home') {
    showScreen('screen-home');
    setNavActive('navHome');
    loadPlans();
  } else if (tabName === 'income') {
    showScreen('screen-income');
    setNavActive('navIncome');
    loadUserOrders();
  } else if (tabName === 'task') {
    showScreen('screen-task');
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    loadTaskScreen();
  } else if (tabName === 'team') {
    showScreen('screen-team');
    setNavActive('navTeam');
    loadTeamData();
  } else if (tabName === 'profile') {
    showScreen('screen-profile');
    setNavActive('navProfile');
    loadUserProfileUI();
  } else if (tabName === 'recharge') {
    showScreen('screen-recharge');
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    loadRechargeScreen();
  } else if (tabName === 'withdraw') {
    showScreen('screen-withdraw');
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    loadWithdrawScreen();
  }
}

// ----------------- AUTHENTICATION -----------------
function switchAuthTab(tab) {
  const tabLogin = document.getElementById('authTabLogin');
  const tabRegister = document.getElementById('authTabRegister');
  const formLogin = document.getElementById('loginForm');
  const formRegister = document.getElementById('registerForm');

  if (tab === 'login') {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    formLogin.style.display = 'block';
    formRegister.style.display = 'none';
  } else {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    formRegister.style.display = 'block';
    formLogin.style.display = 'none';
  }
}

function togglePasswordVisibility(inputId, icon) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}

function showTerms() {
  alert("Kingfisher Capital Investment Portal:\n\n1. All user balances are backed by official energy hardware operations.\n2. Daily returns are settled automatically.\n3. Withdrawals available daily from 09:00 to 18:00.\n4. Keep your password confidential.");
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value;
  const phone = document.getElementById('regPhone').value;
  const password = document.getElementById('regPassword').value;
  const confirm_password = document.getElementById('regConfirmPassword').value;
  const ref_code = document.getElementById('regRefCode').value;

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, password, confirm_password, ref_code })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message);
      currentUser = data.user;
      localStorage.setItem('kingfisher_user_2', JSON.stringify(currentUser));
      await refreshUserProfile();
      showScreen('screen-home');
      setNavActive('navHome');
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast("Network error during registration", "error");
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const phone = document.getElementById('loginPhone').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message);
      currentUser = data.user;
      localStorage.setItem('kingfisher_user_2', JSON.stringify(currentUser));
      await refreshUserProfile();
      showScreen('screen-home');
      setNavActive('navHome');
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast("Network error during login", "error");
  }
}

function handleLogout() {
  if (confirm("Are you sure you want to log out?")) {
    localStorage.removeItem('kingfisher_user_2');
    currentUser = null;
    showToast("Logged out successfully");
    showScreen('screen-auth');
  }
}

async function refreshUserProfile() {
  if (!currentUser || !currentUser.phone) return;
  try {
    const res = await fetch(`/api/user/profile?phone=${currentUser.phone}`);
    const data = await res.json();
    if (data.success && data.user) {
      currentUser = data.user;
      localStorage.setItem('kingfisher_user_2', JSON.stringify(currentUser));
    }
  } catch (e) {
    console.error("Error refreshing profile:", e);
  }
}

// ----------------- HOME SCREEN & INVESTMENT PLANS -----------------
function slideBanner(dir) {
  const img = document.getElementById('homeBannerImg');
  if (!img) return;
  bannerIndex = (bannerIndex + dir + bannerImages.length) % bannerImages.length;
  img.src = bannerImages[bannerIndex];
}

async function loadPlans() {
  try {
    const res = await fetch('/api/plans');
    const data = await res.json();
    if (data.success) {
      currentPlans = data.plans || [];
      renderPlansUI();
    }
  } catch (e) {
    console.error("Error loading plans:", e);
  }
}

function filterPlans(category) {
  currentCategory = category;
  document.getElementById('tabNormalPlan').classList.toggle('active', category === 'normal');
  document.getElementById('tabVipPlan').classList.toggle('active', category === 'vip');
  renderPlansUI();
}

function renderPlansUI() {
  const container = document.getElementById('plansListContainer');
  if (!container) return;
  container.innerHTML = '';

  const filtered = currentPlans.filter(p => p.category === currentCategory);
  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align: center; padding: 40px 10px; color: #8c77a8; font-weight: 600;">No plans available in this category.</div>`;
    return;
  }

  filtered.forEach(plan => {
    const card = document.createElement('div');
    card.className = 'plan-card';
    card.innerHTML = `
      <div class="plan-card-header">${plan.title}</div>
      <div class="plan-card-body">
        <div class="plan-img-container">
          <span class="plan-limit-badge">Limit 0/${plan.limit || 10}</span>
          <img src="${plan.image}" alt="${plan.title}" onerror="this.src='/images/kingfisher_plan_flight.jpg'">
        </div>
        <div class="plan-details-table">
          <div class="plan-row">
            <span class="plan-label"><span class="plan-dot"></span> Price</span>
            <span class="plan-value large">₹${Number(plan.price).toLocaleString('en-IN')}</span>
          </div>
          <div class="plan-row">
            <span class="plan-label"><span class="plan-dot"></span> Daily</span>
            <span class="plan-value">₹${Number(plan.daily_income).toLocaleString('en-IN')}</span>
          </div>
          <div class="plan-row">
            <span class="plan-label"><span class="plan-dot"></span> Total</span>
            <span class="plan-value">₹${Number(plan.total_income).toLocaleString('en-IN')}</span>
          </div>
          <div class="plan-row">
            <span class="plan-label"><span class="plan-dot"></span> End day</span>
            <span class="plan-value">${plan.cycle_days} day</span>
          </div>
        </div>
      </div>
      <button class="btn-buy-plan" onclick="buyPlan('${plan.id}')">
        <span>Buy Now</span>
        <i class="fa-solid fa-cart-shopping"></i>
        <span class="buy-circle"><i class="fa-solid fa-chevron-right"></i></span>
      </button>
    `;
    container.appendChild(card);
  });
}

async function buyPlan(planId) {
  if (!currentUser) {
    showToast("Please login first!", "error");
    showScreen('screen-auth');
    return;
  }

  const plan = currentPlans.find(p => p.id === planId);
  if (!plan) return;

  const currentBal = Number(currentUser.balance || 0);
  if (currentBal < Number(plan.price)) {
    const needed = (Number(plan.price) - currentBal).toFixed(2);
    if (confirm(`Insufficient balance! You need ₹${Number(plan.price).toLocaleString('en-IN')}, your balance is ₹${currentBal.toFixed(2)}. Recharge ₹${needed} now?`)) {
      switchNav('recharge');
      selectRechargeChip(Number(plan.price));
    }
    return;
  }

  if (!confirm(`Confirm purchase of "${plan.title}" for ₹${Number(plan.price).toLocaleString('en-IN')}?\nDaily Return: ₹${Number(plan.daily_income).toLocaleString('en-IN')}\nCycle: ${plan.cycle_days} Days`)) {
    return;
  }

  try {
    const res = await fetch('/api/plans/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: currentUser.phone, plan_id: planId })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message);
      userSpins++; // Reward 1 spin on every purchase!
      await refreshUserProfile();
      loadPlans();
      switchNav('income');
    } else {
      showToast(data.message, 'error');
    }
  } catch (e) {
    showToast("Error processing purchase", "error");
  }
}

let currentActiveQr = null;
let allActiveQrs = [];

// ----------------- DEDICATED RECHARGE SCREEN -----------------
async function fetchPaymentConfig(overrideQrId = null) {
  try {
    const userPhone = currentUser ? encodeURIComponent(currentUser.phone) : '';
    const url = overrideQrId
      ? `/api/payment-config?qr_id=${encodeURIComponent(overrideQrId)}&phone=${userPhone}&t=${Date.now()}`
      : `/api/payment-config?phone=${userPhone}&t=${Date.now()}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) {
      paymentSettings = data.config || data.settings || {};
      if (data.active_qr) {
        currentActiveQr = data.active_qr;
      }
      if (Array.isArray(data.all_active_qrs)) {
        allActiveQrs = data.all_active_qrs;
      }
      applyPaymentSettings();
    }
  } catch (e) {
    console.error("Error fetching payment config:", e);
  }
}

async function refreshClientQr() {
  const icon1 = document.getElementById('clientRefreshQrIcon');
  const icon2 = document.getElementById('refreshQrHintIcon');
  if (icon1) icon1.classList.add('fa-spin');
  if (icon2) icon2.classList.add('fa-spin');

  try {
    const curId = currentActiveQr ? currentActiveQr.id : '';
    const res = await fetch(`/api/payment-config/refresh?current_id=${encodeURIComponent(curId)}&t=${Date.now()}`);
    const data = await res.json();
    if (data.success && data.active_qr) {
      currentActiveQr = data.active_qr;
      if (paymentSettings) {
        paymentSettings.qr_image = data.active_qr.image;
        paymentSettings.upi_id = data.active_qr.upi_id;
      }
      applyPaymentSettings();
      showToast(`✅ Naya QR Channel load ho gaya! (${data.active_qr.index}/${data.active_qr.total})`);
    } else {
      await fetchPaymentConfig();
      showToast("QR code reloaded!");
    }
  } catch (e) {
    console.error("Failed to refresh QR:", e);
    showToast("QR reload ho raha hai...", "info");
    await fetchPaymentConfig();
  } finally {
    setTimeout(() => {
      if (icon1) icon1.classList.remove('fa-spin');
      if (icon2) icon2.classList.remove('fa-spin');
    }, 400);
  }
}

function applyPaymentSettings() {
  if (!paymentSettings) return;
  const qrImg = document.getElementById('clientRechargeQrImg');
  const qrSrc = (currentActiveQr && currentActiveQr.image) ? currentActiveQr.image : (paymentSettings.qr_image || '/images/kingfisher_upi_qr.jpg');
  if (qrImg) {
    qrImg.src = qrSrc.includes('?') ? qrSrc : `${qrSrc}?v=${Date.now()}`;
    qrImg.onerror = function() {
      this.src = '/images/kingfisher_upi_qr.jpg';
    };
  }
  const upiTxt = document.getElementById('clientRechargeUpiIdTxt');
  const activeUpi = (currentActiveQr && currentActiveQr.upi_id) ? currentActiveQr.upi_id : (paymentSettings.upi_id || 'kingfisherpay2@okaxis');
  if (upiTxt) {
    upiTxt.innerText = activeUpi;
  }
  const titleTxt = document.getElementById('clientQrTitleTxt');
  if (titleTxt && currentActiveQr) {
    titleTxt.innerText = `${currentActiveQr.title || 'QR Channel'} (${currentActiveQr.index}/${currentActiveQr.total || 1} Active)`;
  }
  const minRechHint = document.getElementById('minRechargeHint');
  if (minRechHint && paymentSettings.min_recharge) {
    minRechHint.innerText = `₹${paymentSettings.min_recharge}`;
  }
  const minWdHint = document.getElementById('minWithdrawHint');
  if (minWdHint && paymentSettings.min_withdraw) {
    minWdHint.innerText = `₹${paymentSettings.min_withdraw}`;
  }
  const ticker = document.getElementById('homeTickerText');
  if (ticker && paymentSettings.app_announcement) {
    ticker.innerText = paymentSettings.app_announcement;
  }
}

async function loadRechargeScreen() {
  if (!currentUser) {
    const stored = localStorage.getItem('kingfisher_user_2');
    if (stored) {
      try { currentUser = JSON.parse(stored); } catch(e){}
    }
  }
  const balDisplay = document.getElementById('rechargeUserBalDisplay');
  if (balDisplay && currentUser) {
    balDisplay.innerText = `₹${Number(currentUser.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  }
  // ALWAYS fetch fresh config so updated rotated QR code is shown immediately!
  await fetchPaymentConfig();
  startRechargeTimer(10 * 60);
  loadRechargeRecords();
}

function payWithUpiApp() {
  const upiId = (currentActiveQr && currentActiveQr.upi_id) 
    ? currentActiveQr.upi_id 
    : ((paymentSettings && paymentSettings.upi_id) ? paymentSettings.upi_id : 'kingfisherpay2@okaxis');
  const name = encodeURIComponent((paymentSettings && paymentSettings.merchant_name) ? paymentSettings.merchant_name : 'Kingfisher Capital');
  const amount = currentRechargeAmount || 720;
  const upiUrl = `upi://pay?pa=${upiId}&pn=${name}&am=${amount}&cu=INR&tn=KingfisherRecharge2`;
  window.location.href = upiUrl;
}

function selectRechargeChip(amount, btnElement) {
  currentRechargeAmount = amount;
  const input = document.getElementById('depositAmountInput');
  if (input) input.value = amount;

  document.querySelectorAll('.chip-btn').forEach(btn => btn.classList.remove('selected'));
  if (btnElement) {
    btnElement.classList.add('selected');
  }
}

function updateRechargeDisplay(val) {
  currentRechargeAmount = parseFloat(val) || 0;
}

function startRechargeTimer(durationSeconds) {
  if (rechargeTimerInterval) clearInterval(rechargeTimerInterval);
  let timer = durationSeconds;
  const display = document.getElementById('rechargeTimerTxt');
  if (!display) return;

  rechargeTimerInterval = setInterval(() => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    display.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (--timer < 0) {
      clearInterval(rechargeTimerInterval);
      display.innerText = "EXPIRED";
    }
  }, 1000);
}

function copyClientUpiId() {
  const upiId = (currentActiveQr && currentActiveQr.upi_id) 
    ? currentActiveQr.upi_id 
    : ((paymentSettings && paymentSettings.upi_id) ? paymentSettings.upi_id : 'kingfisherpay2@okaxis');
  navigator.clipboard.writeText(upiId).then(() => {
    showToast("Merchant UPI ID copied! Open PhonePe/GPay to pay.");
  }).catch(() => {
    showToast(`UPI ID: ${upiId}`);
  });
}

async function submitRechargeUTR() {
  const utrInput = document.getElementById('depositUtrInput');
  const utr = utrInput ? utrInput.value.trim() : '';

  if (!utr || utr.length < 8) {
    showToast("Please enter a valid 12-digit UTR / Reference ID from your UPI app!", "error");
    return;
  }

  const amt = parseFloat(document.getElementById('depositAmountInput').value) || currentRechargeAmount;
  const min = paymentSettings.min_recharge || 285;
  if (amt < min) {
    showToast(`Minimum recharge amount is ₹${min}`, "error");
    return;
  }

  try {
    const res = await fetch('/api/recharge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: currentUser.phone,
        amount: amt,
        utr: utr,
        qr_id: currentActiveQr ? currentActiveQr.id : null,
        qr_image: currentActiveQr ? currentActiveQr.image : (paymentSettings ? paymentSettings.qr_image : null)
      })
    });
    const data = await res.json();
    if (data.success) {
      utrInput.value = '';
      showToast("Payment receipt submitted! Admin will verify your UTR and credit your balance within 5-15 mins.");
      await refreshUserProfile();
      loadRechargeRecords();
      switchNav('profile');
    } else {
      showToast(data.message, 'error');
    }
  } catch (e) {
    showToast("Error submitting payment UTR", "error");
  }
}

async function toggleRechargeRecords() {
  const container = document.getElementById('inlineRechargeRecords');
  const chevron = document.getElementById('rechargeRecordsChevron');
  if (!container) return;

  if (container.style.display === 'none') {
    container.style.display = 'block';
    if (chevron) chevron.className = 'fa-solid fa-chevron-up';
    await loadRechargeRecords();
  } else {
    container.style.display = 'none';
    if (chevron) chevron.className = 'fa-solid fa-chevron-down';
  }
}

async function loadRechargeRecords() {
  const container = document.getElementById('inlineRechargeRecords');
  if (!container || !currentUser) return;

  try {
    const res = await fetch(`/api/user/history?phone=${currentUser.phone}`);
    const data = await res.json();
    if (data.success) {
      const recs = data.recharges || [];
      if (recs.length === 0) {
        container.innerHTML = `<div style="font-size: 12.5px; color: #7d6b99; text-align: center; padding: 12px 0;">No recharge records found.</div>`;
        return;
      }
      container.innerHTML = recs.reverse().map(r => `
        <div style="background: #fbf7ff; border: 1px solid #ebdffa; border-radius: 12px; padding: 10px 14px; margin-bottom: 8px; font-size: 12.5px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <strong style="color: #27064d; font-size: 14px;">₹${r.amount}</strong>
            <span class="badge ${r.status === 'approved' ? 'approved' : (r.status === 'rejected' ? 'rejected' : 'pending')}">${r.status.toUpperCase()}</span>
          </div>
          <div style="color: #7d6b99; font-size: 11.5px;">UTR: ${r.utr || 'N/A'} | ${new Date(r.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
        </div>
      `).join('');
    }
  } catch (e) {
    console.error(e);
  }
}

// ----------------- DEDICATED WITHDRAWAL SCREEN -----------------
function loadWithdrawScreen() {
  if (!currentUser) return;
  const balDisplay = document.getElementById('withdrawUserBalDisplay');
  if (balDisplay) {
    balDisplay.innerText = `₹${Number(currentUser.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  }

  // Pre-fill registered bank account if available
  if (currentUser.bank_account) {
    const b = currentUser.bank_account;
    if (document.getElementById('wdAccountHolder')) document.getElementById('wdAccountHolder').value = b.account_holder || '';
    if (document.getElementById('wdBankName')) document.getElementById('wdBankName').value = b.bank_name || '';
    if (document.getElementById('wdAccountNumber')) document.getElementById('wdAccountNumber').value = b.account_number || '';
    if (document.getElementById('wdIfsc')) document.getElementById('wdIfsc').value = b.ifsc || '';
    if (document.getElementById('wdUpiId')) document.getElementById('wdUpiId').value = b.upi_id || '';
  }

  calculateWithdrawFee();
}

function calculateWithdrawFee() {
  const amtInput = document.getElementById('wdAmountInput');
  const amt = parseFloat(amtInput ? amtInput.value : 0) || 0;
  const feePercent = paymentSettings.withdrawal_fee_percent || 10;
  const fee = amt * (feePercent / 100);
  const net = Math.max(0, amt - fee);

  const feeTxt = document.getElementById('wdFeeTxt');
  const netTxt = document.getElementById('wdNetTxt');
  if (feeTxt) feeTxt.innerText = `₹${fee.toFixed(2)}`;
  if (netTxt) netTxt.innerText = `₹${net.toFixed(2)}`;
}

async function submitWithdrawal() {
  const amount = parseFloat(document.getElementById('wdAmountInput').value);
  const account_holder = document.getElementById('wdAccountHolder').value.trim();
  const bank_name = document.getElementById('wdBankName').value.trim();
  const account_number = document.getElementById('wdAccountNumber').value.trim();
  const ifsc = document.getElementById('wdIfsc').value.trim();
  const upi_id = document.getElementById('wdUpiId').value.trim();

  const minWd = paymentSettings.min_withdraw || 200;
  if (isNaN(amount) || amount < minWd) {
    showToast(`Minimum withdrawal is ₹${minWd}`, 'error');
    return;
  }

  if (Number(currentUser.balance) < amount) {
    showToast(`Insufficient balance! Available balance is ₹${Number(currentUser.balance).toFixed(2)}`, 'error');
    return;
  }

  if (!account_number && !upi_id) {
    showToast("Please provide Bank Account Number or UPI ID", 'error');
    return;
  }

  try {
    const res = await fetch('/api/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: currentUser.phone,
        amount,
        account_holder,
        bank_name,
        account_number,
        ifsc,
        upi_id
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message);
      document.getElementById('wdAmountInput').value = '';
      await refreshUserProfile();
      loadWithdrawScreen();
      loadWithdrawRecords();
      switchNav('profile');
    } else {
      showToast(data.message, 'error');
    }
  } catch (e) {
    showToast("Error processing withdrawal", "error");
  }
}

async function toggleWithdrawRecords() {
  const container = document.getElementById('inlineWithdrawRecords');
  const chevron = document.getElementById('withdrawRecordsChevron');
  if (!container) return;

  if (container.style.display === 'none') {
    container.style.display = 'block';
    if (chevron) chevron.className = 'fa-solid fa-chevron-up';
    await loadWithdrawRecords();
  } else {
    container.style.display = 'none';
    if (chevron) chevron.className = 'fa-solid fa-chevron-down';
  }
}

async function loadWithdrawRecords() {
  const container = document.getElementById('inlineWithdrawRecords');
  if (!container || !currentUser) return;

  try {
    const res = await fetch(`/api/user/history?phone=${currentUser.phone}`);
    const data = await res.json();
    if (data.success) {
      const wds = data.withdrawals || [];
      if (wds.length === 0) {
        container.innerHTML = `<div style="font-size: 12.5px; color: #7d6b99; text-align: center; padding: 12px 0;">No withdrawal records found.</div>`;
        return;
      }
      container.innerHTML = wds.reverse().map(w => `
        <div style="background: #fbf7ff; border: 1px solid #ebdffa; border-radius: 12px; padding: 10px 14px; margin-bottom: 8px; font-size: 12.5px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <strong style="color: #27064d; font-size: 14px;">₹${w.amount}</strong>
            <span class="badge ${w.status === 'approved' ? 'approved' : (w.status === 'rejected' ? 'rejected' : 'pending')}">${w.status === 'approved' ? 'PAID' : w.status.toUpperCase()}</span>
          </div>
          <div style="color: #7d6b99; font-size: 11.5px;">Net Payout: ₹${w.final_amount} (Fee ₹${w.fee}) | ${new Date(w.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
        </div>
      `).join('');
    }
  } catch (e) {
    console.error(e);
  }
}

// ----------------- INCOME / ORDERS SCREEN (IMAGE 3) -----------------
function startLiveIncomeTimer() {
  if (incomeCountdownInterval) clearInterval(incomeCountdownInterval);
  const display = document.getElementById('liveIncomeCountdown');
  
  // Settles daily at 18:00
  incomeCountdownInterval = setInterval(() => {
    const now = new Date();
    const target = new Date();
    target.setHours(18, 0, 0, 0);
    if (now > target) {
      target.setDate(target.getDate() + 1);
    }
    const diff = Math.floor((target - now) / 1000);
    const hrs = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;

    if (display) {
      display.innerText = `${hrs.toString().padStart(2, '0')} : ${mins.toString().padStart(2, '0')} : ${secs.toString().padStart(2, '0')}`;
    }
  }, 1000);
}

async function loadUserOrders() {
  if (!currentUser) return;
  try {
    const res = await fetch(`/api/user/plans?phone=${currentUser.phone}`);
    const data = await res.json();
    if (data.success) {
      const plans = data.plans || [];
      const totalInvested = plans.reduce((sum, p) => sum + Number(p.price || 0), 0);
      const dailyIncome = plans.reduce((sum, p) => sum + Number(p.daily_income || 0), 0);

      document.getElementById('statTotalInvested').innerText = `₹${totalInvested.toLocaleString('en-IN')}`;
      document.getElementById('statDailyIncome').innerText = `₹${dailyIncome.toLocaleString('en-IN')}`;
      document.getElementById('statActivePlans').innerText = plans.length;

      const container = document.getElementById('ordersContentContainer');
      if (!container) return;

      if (plans.length === 0) {
        // Pixel-perfect Image 3 "No plans yet"
        container.innerHTML = `
          <div class="empty-orders-card">
            <div class="empty-squircle-icon"><i class="fa-solid fa-layer-group"></i></div>
            <div class="empty-orders-title">No plans yet</div>
            <div class="empty-orders-sub">You haven't purchased any plan yet. Explore the plans and start earning daily.</div>
            <button class="btn-explore-plans" onclick="switchNav('home')">
              <span>Explore plans</span> <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="card-white-rounded" style="margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 12px; color: #7d6b99; font-weight: 600;">Ready To Claim Today</div>
              <div style="font-size: 22px; font-weight: 800; color: #10b981;">₹${(data.totalReadyToClaim || 0).toLocaleString('en-IN')}</div>
            </div>
            <button class="btn-primary-purple" style="width: auto; padding: 0 20px; height: 40px; font-size: 13px;" onclick="claimDailyIncome()" ${data.totalReadyToClaim > 0 ? '' : 'disabled style="opacity: 0.6;"'}>
              <i class="fa-solid fa-coins"></i> Claim Income
            </button>
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${plans.map(p => `
              <div class="card-white-rounded" style="padding: 14px 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <strong style="color: #27064d; font-size: 14.5px;">${p.plan_title}</strong>
                  <span class="badge approved">${p.status.toUpperCase()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12.5px; color: #7d6b99; margin-bottom: 6px;">
                  <span>Daily: <strong style="color: #4b1484;">₹${p.daily_income}</strong></span>
                  <span>Claimed: <strong style="color: #10b981;">₹${p.total_claimed || 0}</strong> / ₹${p.total_income}</span>
                </div>
                <div class="progress-bar-track">
                  <div class="progress-bar-fill" style="width: ${Math.min(100, Math.round((p.days_passed / p.cycle_days) * 100))}%;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: #8c77a8; margin-top: 4px;">
                  <span>Cycle: ${p.days_passed} of ${p.cycle_days} days</span>
                  <span>Invested: ₹${p.price}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    }
  } catch (e) {
    console.error(e);
  }
}

async function claimDailyIncome() {
  if (!currentUser) return;
  try {
    const res = await fetch('/api/user/claim-income', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: currentUser.phone })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message);
      await refreshUserProfile();
      loadUserOrders();
    } else {
      showToast(data.message, 'error');
    }
  } catch (e) {
    showToast("Error claiming income", "error");
  }
}

// ----------------- TASK / LUCKY SPIN SCREEN (IMAGE 4) -----------------
function loadTaskScreen() {
  const spinsDisplay = document.getElementById('userSpinsCount');
  const btnAction = document.getElementById('btnSpinAction');

  if (spinsDisplay) spinsDisplay.innerText = userSpins;
  if (btnAction) {
    if (userSpins > 0) {
      btnAction.innerText = "SPIN NOW!";
      btnAction.classList.add('active');
    } else {
      btnAction.innerText = "No spins left";
      btnAction.classList.remove('active');
    }
  }
}

function playSpinWheel() {
  if (isSpinning) return;
  if (userSpins <= 0) {
    showToast("You're out of spins! Purchase an active plan to get more.", "error");
    return;
  }

  isSpinning = true;
  userSpins--;
  loadTaskScreen();

  const disk = document.getElementById('wheelRotatingDisk');
  // 8 prizes: 0: Sorry, 1: ₹5, 2: ₹10, 3: ₹15, 4: ₹50, 5: ₹500, 6: ₹1000, 7: ₹5000
  // Choose winning sector (weighted towards ₹10 or ₹50)
  const prizes = [
    { label: "Sorry, try next time!", amount: 0, angle: 0 },
    { label: "₹5 Cash Prize!", amount: 5, angle: 45 },
    { label: "₹10 Cash Prize!", amount: 10, angle: 90 },
    { label: "₹15 Cash Prize!", amount: 15, angle: 135 },
    { label: "₹50 Cash Prize!", amount: 50, angle: 180 },
    { label: "₹500 Grand Cash!", amount: 500, angle: 225 },
    { label: "₹1,000 Mega Cash!", amount: 1000, angle: 270 },
    { label: "₹5,000 Jackpot!", amount: 5000, angle: 315 }
  ];

  // Pick lucky prize
  const luckyIndex = Math.random() < 0.65 ? 2 : (Math.random() < 0.85 ? 4 : 1);
  const prize = prizes[luckyIndex];

  // Rotate wheel 5 full turns + target angle
  const totalRotation = (360 * 5) + (360 - prize.angle);
  disk.style.transform = `rotate(${totalRotation}deg)`;

  setTimeout(async () => {
    isSpinning = false;
    showToast(`🎉 Congratulations! You won ${prize.label}`);
    
    if (prize.amount > 0 && currentUser) {
      currentUser.balance = Number(currentUser.balance || 0) + prize.amount;
      currentUser.total_income = Number(currentUser.total_income || 0) + prize.amount;
      localStorage.setItem('kingfisher_user_2', JSON.stringify(currentUser));
      await refreshUserProfile();
    }
    loadTaskScreen();
  }, 3600);
}

function dailyCheckIn() {
  const btn = document.getElementById('btnDailyAttendance');
  if (btn && btn.disabled) return;

  if (currentUser) {
    currentUser.balance = Number(currentUser.balance || 0) + 15;
    currentUser.total_income = Number(currentUser.total_income || 0) + 15;
    localStorage.setItem('kingfisher_user_2', JSON.stringify(currentUser));
  }

  showToast("Attendance bonus: ₹15 credited to your wallet!");
  if (btn) {
    btn.disabled = true;
    btn.innerText = "Claimed ✓";
    btn.style.opacity = '0.6';
  }
}

// ----------------- TEAM & INVITE SCREEN (IMAGE 2) -----------------
async function loadTeamData() {
  if (!currentUser) return;
  try {
    const res = await fetch(`/api/user/team?phone=${currentUser.phone}`);
    const data = await res.json();
    if (data.success) {
      const stats = data.teamStats || {};
      document.getElementById('teamTotalMembers').innerText = stats.totalMembers || 0;
      document.getElementById('statTeamMembersCount').innerText = stats.totalMembers || 0;
      document.getElementById('statTeamRecharge').innerText = `₹${stats.totalRecharge || 0}`;
      document.getElementById('statTeamWithdraw').innerText = `₹${stats.totalWithdraw || 0}`;
      document.getElementById('myInviteCodeText').innerText = currentUser.ref_code || '598823';

      // Level 1
      document.getElementById('lvl1Members').innerText = `${stats.lvl1Count || 0} members`;
      document.getElementById('lvl1Active').innerText = `${stats.lvl1Count || 0} active`;
      document.getElementById('lvl1Recharge').innerText = `Recharge ₹${stats.lvl1Recharge || 0}`;

      // Level 2
      document.getElementById('lvl2Members').innerText = `${stats.lvl2Count || 0} members`;
      document.getElementById('lvl2Active').innerText = `${stats.lvl2Count || 0} active`;
      document.getElementById('lvl2Recharge').innerText = `Recharge ₹${stats.lvl2Recharge || 0}`;

      // Level 3
      document.getElementById('lvl3Members').innerText = `${stats.lvl3Count || 0} members`;
      document.getElementById('lvl3Active').innerText = `${stats.lvl3Count || 0} active`;
      document.getElementById('lvl3Recharge').innerText = `Recharge ₹${stats.lvl3Recharge || 0}`;
    }
  } catch (e) {
    console.error(e);
  }
}

function copyReferralCode() {
  const code = currentUser ? (currentUser.ref_code || '598823') : '598823';
  navigator.clipboard.writeText(code).then(() => {
    showToast(`Referral Code ${code} copied to clipboard!`);
  });
}

function copyReferralLink() {
  const code = currentUser ? (currentUser.ref_code || '598823') : '598823';
  const url = `${window.location.origin}/?ref=${code}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast(`Invite link copied! Share with friends to earn up to 40% commission.`);
  });
}

function showLevelMembers(level) {
  showToast(`Viewing Level ${level} members. Earn up to ${level === 1 ? '40%' : (level === 2 ? '3%' : '1%')} commission!`);
}

// ----------------- PROFILE / WALLET SCREEN (IMAGE 1) -----------------
function loadUserProfileUI() {
  if (!currentUser) return;
  const p = currentUser.phone || '9876543210';
  const masked = p.length >= 7 ? `${p.substring(0, 3)}***${p.substring(p.length - 4)}` : p;

  const phoneMaskEl = document.getElementById('profileUserPhoneMasked');
  if (phoneMaskEl) phoneMaskEl.innerText = masked;

  const vipEl = document.getElementById('profileVipLevel');
  if (vipEl) vipEl.innerText = 'VIP0';

  const availEl = document.getElementById('profileAvailBal');
  if (availEl) availEl.innerText = `₹${Number(currentUser.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const rechEl = document.getElementById('profileRechargeBal');
  if (rechEl) rechEl.innerText = `₹${Number(currentUser.total_recharge || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const incEl = document.getElementById('profileTotalIncome');
  if (incEl) incEl.innerText = `₹${Number(currentUser.total_income || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function copyPhone() {
  if (!currentUser) return;
  navigator.clipboard.writeText(currentUser.phone).then(() => {
    showToast(`Phone number +91 ${currentUser.phone} copied!`);
  });
}

function handleDownloadAPK() {
  showToast("Downloading Kingfisher Official Android APK (v2.0.0)...");
  setTimeout(() => {
    alert("Kingfisher Investment APK v2.0.0 is downloading. If prompted, allow installations from unknown sources to install.");
  }, 800);
}

// ----------------- MODALS -----------------
function openPersonalInfoModal() {
  if (!currentUser) return;
  document.getElementById('modalUserName').innerText = currentUser.name || 'User';
  document.getElementById('modalUserPhone').innerText = `+91 ${currentUser.phone}`;
  document.getElementById('modalUserId').innerText = currentUser.id || 'u_demo';
  document.getElementById('modalRefCode').innerText = currentUser.ref_code || '598823';
  document.getElementById('personalInfoModal').classList.add('active');
}
function closePersonalInfoModal() {
  document.getElementById('personalInfoModal').classList.remove('active');
}

function openNotificationsModal() {
  document.getElementById('notificationsModal').classList.add('active');
}
function closeNotificationsModal() {
  document.getElementById('notificationsModal').classList.remove('active');
}

function openSettingsModal() {
  document.getElementById('settingsModal').classList.add('active');
}
function closeSettingsModal() {
  document.getElementById('settingsModal').classList.remove('active');
}

function openSupportModal() {
  if (paymentSettings.telegram_channel) {
    document.getElementById('supportTelegramLink').href = paymentSettings.telegram_channel;
  }
  if (paymentSettings.whatsapp_support) {
    document.getElementById('supportWhatsappLink').href = `https://wa.me/${paymentSettings.whatsapp_support.replace('+', '')}`;
  }
  document.getElementById('supportModal').classList.add('active');
}
function closeSupportModal() {
  document.getElementById('supportModal').classList.remove('active');
}

function promptChangePassword() {
  const newPass = prompt("Enter new account password:");
  if (newPass && newPass.length >= 6) {
    showToast("Password updated successfully!");
  } else if (newPass) {
    showToast("Password must be at least 6 characters", "error");
  }
}

// Bank Modal
function openBankCardModal() {
  if (currentUser && currentUser.bank_account) {
    const b = currentUser.bank_account;
    document.getElementById('setupAccountHolder').value = b.account_holder || '';
    document.getElementById('setupBankName').value = b.bank_name || '';
    document.getElementById('setupAccountNumber').value = b.account_number || '';
    document.getElementById('setupIfsc').value = b.ifsc || '';
    document.getElementById('setupUpiId').value = b.upi_id || '';
  }
  document.getElementById('bankModal').classList.add('active');
}
function closeBankModal() {
  document.getElementById('bankModal').classList.remove('active');
}
async function saveBankDetails() {
  const account_holder = document.getElementById('setupAccountHolder').value.trim();
  const bank_name = document.getElementById('setupBankName').value.trim();
  const account_number = document.getElementById('setupAccountNumber').value.trim();
  const ifsc = document.getElementById('setupIfsc').value.trim();
  const upi_id = document.getElementById('setupUpiId').value.trim();

  try {
    const res = await fetch('/api/user/bank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: currentUser.phone,
        account_holder,
        bank_name,
        account_number,
        ifsc,
        upi_id
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast("Bank details saved!");
      closeBankModal();
      await refreshUserProfile();
    } else {
      showToast(data.message, 'error');
    }
  } catch (e) {
    showToast("Error saving bank details", "error");
  }
}

// History Modal
async function openHistoryModal(type) {
  const modal = document.getElementById('historyModal');
  const title = document.getElementById('historyModalTitle');
  const list = document.getElementById('historyModalList');
  if (!modal) return;

  if (!currentUser) {
    const stored = localStorage.getItem('kingfisher_user_2');
    if (stored) {
      try { currentUser = JSON.parse(stored); } catch(e){}
    }
  }

  if (!currentUser || !currentUser.phone) {
    showToast("Please login first to view your records", "error");
    showScreen('screen-auth');
    return;
  }

  title.innerText = type === 'recharge' ? 'Recharge Records' : 'Withdrawal Records';
  list.innerHTML = `<div style="text-align: center; color: #7d6b99; padding: 25px;"><i class="fa-solid fa-spinner fa-spin"></i> Loading records...</div>`;
  modal.classList.add('active');

  try {
    const res = await fetch(`/api/user/history?phone=${encodeURIComponent(currentUser.phone)}&t=${Date.now()}`);
    const data = await res.json();
    if (data.success) {
      const items = type === 'recharge' ? (data.recharges || []) : (data.withdrawals || []);
      if (!items || items.length === 0) {
        list.innerHTML = `<div style="text-align: center; color: #7d6b99; padding: 30px;"><i class="fa-regular fa-folder-open" style="font-size: 28px; display: block; margin-bottom: 8px;"></i>No ${type} records found.</div>`;
        return;
      }
      list.innerHTML = [...items].reverse().map(item => `
        <div class="info-row-box" style="flex-direction: column; align-items: stretch; margin-bottom: 10px; background: #faf8fd; padding: 12px; border-radius: 12px; border: 1px solid #ebdcfc;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="font-size: 16px; color: #27064d;">₹${item.amount}</strong>
            <span class="badge ${item.status === 'approved' ? 'approved' : (item.status === 'rejected' ? 'rejected' : 'pending')}">${item.status === 'approved' ? (type === 'withdraw' ? 'PAID' : 'APPROVED') : item.status.toUpperCase()}</span>
          </div>
          <div style="font-size: 11.5px; color: #7d6b99;">
            ${type === 'recharge' ? `UTR: ${item.utr || 'N/A'}` : `Net: ₹${item.final_amount || item.amount} (Fee ₹${item.fee || 0})`} | ${item.date ? new Date(item.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : ''}
          </div>
          ${item.note ? `<div style="font-size: 11px; color: #9333ea; margin-top: 4px; font-style: italic;">${item.note}</div>` : ''}
          ${item.rejected_reason ? `<div style="font-size: 11px; color: #ef4444; margin-top: 4px;">Reason: ${item.rejected_reason}</div>` : ''}
        </div>
      `).join('');
    } else {
      list.innerHTML = `<div style="text-align: center; color: #7d6b99; padding: 30px;">No records found.</div>`;
    }
  } catch (e) {
    console.error("Error loading records:", e);
    list.innerHTML = `<div style="color: #ef4444; text-align: center; padding: 20px;">Could not load history. Please try again.</div>`;
  }
}
function closeHistoryModal() {
  document.getElementById('historyModal').classList.remove('active');
}
