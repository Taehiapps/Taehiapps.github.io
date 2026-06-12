(function () {
  const CATEGORIES = ['不具合', 'ご要望', 'その他'];

  const ERROR_MESSAGES = {
    service_required: 'サービスを選んでください。',
    category_required: 'どうされましたか？を選んでください。',
    message_required: 'お問い合わせ内容をご記入ください。',
    email_required: '返信用のメールアドレスを正しくご入力ください。',
    mail_not_configured: 'いま送信できません。しばらくしてからもう一度お試しください。',
    server_not_configured: 'いま送信できません。しばらくしてからもう一度お試しください。',
    db_insert_failed: '送信できませんでした。しばらくしてからもう一度お試しください。',
    invalid_json: '送信できませんでした。もう一度お試しください。',
    method_not_allowed: '送信できませんでした。もう一度お試しください。',
  };

  const root = document.querySelector('[data-support-root]');
  if (!root) return;

  const formPanel = root.querySelector('[data-support-panel="form"]');
  const donePanel = root.querySelector('[data-support-panel="done"]');
  const serviceSelect = root.querySelector('[data-support-service]');
  const categoryField = root.querySelector('[data-support-categories]');
  const form = root.querySelector('[data-support-form]');
  const errorBox = root.querySelector('[data-support-error]');
  const errorText = root.querySelector('[data-support-error-text]');
  const submitBtn = root.querySelector('[data-support-submit]');
  const doneId = root.querySelector('[data-support-done-id]');
  const doneWarning = root.querySelector('[data-support-done-warning]');
  const newInquiryBtn = root.querySelector('[data-support-new]');
  const messageInput = root.querySelector('#support-message');
  const messageCount = root.querySelector('[data-support-message-count]');

  let selectedCategory = CATEGORIES[0];

  function showPanel(name) {
    if (formPanel) formPanel.hidden = name !== 'form';
    if (donePanel) donePanel.hidden = name !== 'done';
  }

  function showError(message) {
    if (!errorBox || !errorText) return;
    errorText.textContent = message;
    errorBox.hidden = !message;
  }

  function renderCategories() {
    if (!categoryField) return;
    categoryField.innerHTML = CATEGORIES.map(
      (category) => `
        <label class="support-chip">
          <input type="radio" name="support-category" value="${category}"${category === selectedCategory ? ' checked' : ''}>
          <span>${category}</span>
        </label>
      `,
    ).join('');

    categoryField.querySelectorAll('input[name="support-category"]').forEach((input) => {
      input.addEventListener('change', () => {
        if (input.checked) selectedCategory = input.value;
      });
    });
  }

  function getConfig() {
    const config = window.TAEHI_SUPPORT_CONFIG ?? {};
    const supabaseUrl = String(config.supabaseUrl ?? '').replace(/\/$/, '');
    const supabaseAnonKey = String(config.supabaseAnonKey ?? '').trim();
    if (!supabaseUrl || !supabaseAnonKey) return null;
    return { supabaseUrl, supabaseAnonKey };
  }

  function parseErrorBody(body) {
    const code = body?.error ?? '';
    return ERROR_MESSAGES[code] ?? '送信できませんでした。しばらくしてからもう一度お試しください。';
  }

  async function submitForm(event) {
    event.preventDefault();
    showError('');

    const config = getConfig();
    if (!config) {
      showError('問い合わせフォームの設定が完了していません。しばらくしてからもう一度お試しください。');
      return;
    }

    const formData = new FormData(form);
    const service = String(formData.get('service') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const message = String(formData.get('message') ?? '').trim();
    const website = String(formData.get('website') ?? '').trim();

    if (!service) {
      showError(ERROR_MESSAGES.service_required);
      return;
    }
    if (!email) {
      showError(ERROR_MESSAGES.email_required);
      return;
    }
    if (!message) {
      showError(ERROR_MESSAGES.message_required);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '送信中…';

    try {
      const res = await fetch(`${config.supabaseUrl}/functions/v1/submit-web-inquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: config.supabaseAnonKey,
          Authorization: `Bearer ${config.supabaseAnonKey}`,
        },
        body: JSON.stringify({
          service,
          category: selectedCategory,
          message,
          email,
          website,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(parseErrorBody(body));
      }

      if (doneId) doneId.textContent = body.inquiryId ?? '—';

      const warnings = [];
      if (body.emailSent === false) {
        warnings.push('運営への通知メールを送れませんでしたが、お問い合わせは受け付け済みです。');
      }
      if (body.autoReplySent === false) {
        warnings.push('受付確認メールを送れませんでしたが、お問い合わせは受け付け済みです。');
      }
      if (doneWarning) {
        doneWarning.textContent = warnings.join('\n');
        doneWarning.hidden = warnings.length === 0;
      }

      showPanel('done');
      window.scrollTo({ top: root.offsetTop - 96, behavior: 'smooth' });
    } catch (e) {
      showError(e instanceof Error ? e.message : '送信できませんでした。もう一度お試しください。');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '送信する';
    }
  }

  newInquiryBtn?.addEventListener('click', () => {
    form?.reset();
    if (serviceSelect) serviceSelect.value = 'soranikki';
    selectedCategory = CATEGORIES[0];
    renderCategories();
    showError('');
    if (doneWarning) doneWarning.hidden = true;
    showPanel('form');
    messageInput?.focus();
  });

  form?.addEventListener('submit', (event) => {
    void submitForm(event);
  });

  function updateMessageCount() {
    if (!messageInput || !messageCount) return;
    messageCount.textContent = String(Math.min(2000, messageInput.value.length));
  }

  messageInput?.addEventListener('input', updateMessageCount);

  renderCategories();
  updateMessageCount();
  showPanel('form');
})();
