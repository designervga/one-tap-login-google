// Simple mock of Google One Tap experience for this prototype.
// - On guest page: shows a faux One Tap and wires the CONTINUAR button to simulate login
// - On payment page: reads session from localStorage and fills UI; logout clears state

(function () {
  const STORAGE_KEY = 'demo_session_v1';
  const ONE_TAP_DELAY_MS = 1000; // delay before showing One Tap, like production
  const SUPPRESS_COOKIE = 'nuvem_one_tap_suppress';
  const INFO_CARD_DURATION_MS = 3000; // keep Nuvem card visible for 3s

  function getEl(selector) {
    return document.querySelector(selector);
  }

  function saveSession(session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  function readSession() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function setCookie(name, value, maxAgeSeconds) {
    const parts = [`${name}=${encodeURIComponent(value)}`, 'path=/'];
    if (maxAgeSeconds) parts.push(`max-age=${maxAgeSeconds}`);
    document.cookie = parts.join('; ');
  }

  function getCookie(name) {
    const entry = document.cookie.split('; ').find((row) => row.startsWith(name + '='));
    return entry ? decodeURIComponent(entry.split('=')[1]) : undefined;
  }

  function createMockUser() {
    return {
      name: 'Valmir Afonso',
      email: 'designervga@gmail.com',
      pictureUrl: '',
      addressLine: 'Avenida Vereador José Diniz 341, 1620',
      addressMeta: 'CEP 04040-007 - Santo Amaro, São Paulo, São Paulo - +551197290734',
      shipping: { method: 'Nuvem Envio Correios PAC · Grátis', eta: 'Chega quarta-feira 20/08' },
      cardMasked: '•••• 1968'
    };
  }

  function mountOneTap(container, user, onContinue) {
    const root = document.createElement('div');
    root.className = 'one-tap-container';
    // Desktop: top-right; Mobile overridden in CSS to bottom sheet-like
    root.style.right = '24px';
    root.style.top = '110px';

    root.innerHTML = `
      <div class="one-tap-card" role="dialog" aria-label="Fazer login com o Google">
        <div class="one-tap-header">
          <div class="one-tap-title">
            <span class="google-g" aria-hidden="true">
              <svg viewBox="0 0 48 48" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.676 31.664 29.223 35 24 35 16.82 35 11 29.18 11 22S16.82 9 24 9c3.59 0 6.84 1.477 9.193 3.86l5.657-5.657C35.902 3.053 30.268 1 24 1 10.745 1 0 11.745 0 25s10.745 24 24 24 24-10.745 24-24c0-1.619-.166-3.198-.389-4.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.816C14.51 16.19 18.81 13 24 13c3.59 0 6.84 1.477 9.193 3.86l5.657-5.657C35.902 7.053 30.268 5 24 5 15.316 5 7.895 9.797 4.306 16.691z"/>
                <path fill="#4CAF50" d="M24 49c6.09 0 11.64-2.33 15.78-6.12l-7.29-5.99C30.12 38.61 27.26 39 24 39c-5.18 0-9.48-3.19-11.11-7.72l-6.58 5.07C7.87 43.2 15.26 49 24 49z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.28 3.664-5.023 7-11.303 7-5.18 0-9.48-3.19-11.11-7.72l-6.58 5.07C7.87 43.2 15.26 49 24 49c12 0 24-8.75 24-24 0-1.619-.166-3.198-.389-4.917z"/>
              </svg>
            </span>
            <span>Fazer login na Nuvem com o Google</span>
          </div>
          <button class="one-tap-close" aria-label="Close">&#x2715;</button>
        </div>
        <div class="one-tap-list">
          <div class="one-tap-item" data-acct="1">
            <span class="one-tap-avatar">V</span>
            <div class="one-tap-account"><strong>${user.name}</strong><span class="one-tap-email">${user.email}</span></div>
          </div>
        </div>
        <div class="one-tap-divider"></div>
        <div class="one-tap-consent">
          <button class="btn" id="mockContinue">Continuar como ${user.name.split(' ')[0]}</button>
          <div class="one-tap-fineprint">Para criar sua conta, o Google compartilhará seu nome, endereço de e‑mail e foto do perfil com a Nuvem. Veja a <a href="#">política de privacidade</a> e os <a href="#">termos de serviço</a> da Nuvem.</div>
        </div>
      </div>
    `;

    const close = () => root.remove();
    root.querySelector('.one-tap-close').addEventListener('click', () => {
      setCookie(SUPPRESS_COOKIE, '1', 1800);
      close();
    });

    root.querySelector('#mockContinue').addEventListener('click', () => {
      // Switch to verifying state
      const card = root.querySelector('.one-tap-card');
      card.innerHTML = `
        <div class="one-tap-header">
          <div class="one-tap-title"><span class="google-g">G</span> <span>Verificando…</span></div>
          <span style="width:18px"></span>
        </div>
        <div class="one-tap-verifying">
          <span class="one-tap-spinner"></span>
          <div>
            <div><strong>${user.name}</strong></div>
            <div class="one-tap-verify-email">${user.email}</div>
          </div>
        </div>
      `;

      setTimeout(() => {
        // Show success message in the same One Tap area
        card.innerHTML = `
          <div class=\"one-tap-header\">
            <div class=\"one-tap-title\"><span class=\"google-g\">G</span> <span>Conectado</span></div>
            <span style=\"width:18px\"></span>
          </div>
          <div class=\"one-tap-success\">
            <svg class=\"success-check\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6L9 17l-5-5\" stroke=\"#34a853\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>
            <div>
              <div class=\"success-title\">Conectado</div>
              <div class=\"success-sub\">Redirecionando…</div>
            </div>
          </div>
        `;
        // Seamless transition: replace content in the same card container
        setTimeout(() => {
          try { 
            // Transform the Google card into Nuvem card in-place
            const card = root.querySelector('.one-tap-card');
            if (card) {
              card.innerHTML = `
                <div class="nuvem-info-header">
                  <div class="nuvem-info-title">
                    <svg class="nuvem-cloud" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.5 18.5h9.2c2.1 0 3.8-1.7 3.8-3.8 0-1.9-1.4-3.5-3.2-3.8-.5-2.6-2.8-4.6-5.6-4.6-2.5 0-4.7 1.6-5.4 4-2.3.2-4.1 2.2-4.1 4.5 0 2.5 2 4.7 4.3 4.7z" stroke="#4e3aa4" stroke-width="1.4"/>
                    </svg>
                    <span>Nuvem</span>
                  </div>
                  <span style="width:18px"></span>
                </div>
                <div class="nuvem-info-body">
                  <span class="spinner"></span>
                  <div>
                    <div class="title">Você está utilizando Nuvem</div>
                    <div class="sub">Dados sendo preenchidos…</div>
                  </div>
                </div>
              `;
              
              // Apply Nuvem styling to the existing card
              card.style.fontFamily = 'Roboto, Arial, Helvetica, sans-serif';
              
              // Close the card after showing Nuvem for a moment
              setTimeout(() => {
                close();
                onContinue();
              }, 2000);
            }
          } catch (_) {}
        }, 10);
      }, 900);
    });

    container.appendChild(root);
  }

  function onGuest() {
    const continueBtn = getEl('#continueBtn');
    if (!continueBtn) return;

    const user = createMockUser();
    const container = document.body;
    // Show One Tap after a short identification delay
    setTimeout(() => {
      if (getCookie(SUPPRESS_COOKIE) === '1' || getEl('.one-tap-container')) return;
      mountOneTap(container, user, () => {
        // Show SPA overlay for 1s, and keep One Tap + Nuvem above it
        const overlay = document.getElementById('pageOverlay');
        if (overlay) overlay.classList.add('show');
        // Keep Google card visible during transition: do NOT close here; close after we leave page
        saveSession({ user });
        setTimeout(() => { window.location.href = 'payment.html'; }, 1000);
      });
    }, ONE_TAP_DELAY_MS);

    continueBtn.addEventListener('click', (e) => {
      // If the user clicks main CTA, simulate same flow
      const overlay = document.getElementById('pageOverlay');
      if (overlay) overlay.classList.add('show');
      saveSession({ user });
      setTimeout(() => { window.location.href = 'payment.html'; }, 1000);
    });
  }

  function onPayment() {
    const session = readSession();
    // If not logged, go back to guest
    if (!session || !session.user) {
      window.location.href = 'index.html';
      return;
    }
    const { user } = session;

    const logout = getEl('#logoutLink');
    if (logout) {
      logout.addEventListener('click', (e) => {
        // hard redirect to reset
        clearSession();
      });
    }

    const addrLine = getEl('#addrLine');
    const addrMeta = getEl('#addrMeta');
    const cardMasked = getEl('#cardMasked');
    if (addrLine) addrLine.textContent = user.addressLine;
    if (addrMeta) addrMeta.textContent = user.addressMeta;
    if (cardMasked) cardMasked.textContent = user.cardMasked;

    const placeOrderBtn = getEl('#placeOrderBtn');
    if (placeOrderBtn) {
      placeOrderBtn.addEventListener('click', (e) => {
        e.preventDefault();
        placeOrderBtn.textContent = 'PROCESSANDO…';
        placeOrderBtn.setAttribute('disabled', 'true');
        setTimeout(() => {
          placeOrderBtn.textContent = 'PEDIDO REALIZADO';
        }, 900);
      });
    }

    // Do not re-show Nuvem or Google components after arriving to payment

    // Skeleton: show for ~2s then reveal content
    // Keep structure intact; we rely on the overlay shimmer, not DOM duplication
  }

  // Toast desativado: usamos apenas o card do topo direito
  function showToast() {}
  function hideToast() {}

  function showNuvemInfoCard(messageTitle, messageSub, googleCardRect = null) {
    const card = getEl('#nuvemInfo');
    if (!card) return;
    
    // sync text with params to preserve UI continuity
    const title = card.querySelector('.nuvem-info-body .title');
    const sub = card.querySelector('.nuvem-info-body .sub');
    if (messageTitle && title) title.textContent = messageTitle;
    if (messageSub && sub) sub.textContent = messageSub;
    
    // If we have Google card position, position Nuvem card at same spot initially
    if (googleCardRect) {
      card.style.position = 'fixed';
      card.style.right = 'auto';
      card.style.top = 'auto';
      card.style.left = googleCardRect.left + 'px';
      card.style.top = googleCardRect.top + 'px';
      card.style.zIndex = '51'; // Above Google card
      
      // After a moment, animate to normal position
      setTimeout(() => {
        card.style.transition = 'all 0.3s ease-out';
        card.style.right = '24px';
        card.style.top = '110px';
        card.style.left = 'auto';
        
        // Reset transition after animation
        setTimeout(() => {
          card.style.transition = '';
        }, 300);
      }, 100);
    }
    
    card.style.display = 'block';
    // keep visible a bit longer (+1s)
    setTimeout(() => { card.style.display = 'none'; }, 2400);
  }

  function init() {
    const page = document.querySelector('main[data-page]')?.getAttribute('data-page');
    if (page === 'guest') onGuest();
    if (page === 'payment') onPayment();
  }

  document.addEventListener('DOMContentLoaded', init);
})();