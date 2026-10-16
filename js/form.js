(() => {
  const form = document.querySelector("#cadastro-form");
  if (!form) return;

  const success = document.querySelector("#cadastro-sucesso");
  const notice = document.querySelector(".notice");
  const phone = form.querySelector("#telefone");
  const cpf = form.querySelector("#cpf");
  const senha = form.querySelector("#senha");
  const confirmar = form.querySelector("#confirmar");
  const bar = form.querySelector(".strength span");

  const maskPhone = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
    }
    return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
  };

  const maskCpf = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const validCpf = (value) => {
    const n = value.replace(/\D/g, "");
    if (n.length !== 11 || /^(\d)\1+$/.test(n)) return false;
    const calc = (base) => {
      let sum = 0;
      for (let i = 0; i < base; i += 1) sum += Number(n[i]) * (base + 1 - i);
      const rest = (sum * 10) % 11;
      return rest === 10 ? 0 : rest;
    };
    return calc(9) === Number(n[9]) && calc(10) === Number(n[10]);
  };

  const scorePassword = (value) => {
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    return score;
  };

  phone?.addEventListener("input", () => {
    phone.value = maskPhone(phone.value);
  });
  cpf?.addEventListener("input", () => {
    cpf.value = maskCpf(cpf.value);
  });
  senha?.addEventListener("input", () => {
    const score = scorePassword(senha.value);
    const widths = ["0%", "25%", "50%", "75%", "100%"];
    const colors = ["transparent", "#c45b67", "#d4a04a", "#c9a56a", "#7dcea0"];
    if (bar) {
      bar.style.width = widths[score];
      bar.style.background = colors[score];
    }
  });

  const setError = (field, message) => {
    const wrap = field.closest(".field") || field.closest(".check");
    if (!wrap) return;
    wrap.classList.add("is-invalid");
    const slot = wrap.querySelector(".error");
    if (slot) slot.textContent = message;
  };

  const clearError = (field) => {
    const wrap = field.closest(".field") || field.closest(".check");
    if (!wrap) return;
    wrap.classList.remove("is-invalid");
    const slot = wrap.querySelector(".error");
    if (slot) slot.textContent = "";
  };

  form.querySelectorAll("input, select").forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => clearError(field));
  });

  const validateField = (field) => {
    clearError(field);
    if (field.validity.valueMissing) {
      setError(field, "Campo obrigatório.");
      return false;
    }
    if (field.type === "email" && field.validity.typeMismatch) {
      setError(field, "Informe um e-mail válido.");
      return false;
    }
    if (field.id === "cpf" && !validCpf(field.value)) {
      setError(field, "CPF inválido.");
      return false;
    }
    if (field.id === "telefone" && field.value.replace(/\D/g, "").length < 10) {
      setError(field, "Telefone incompleto.");
      return false;
    }
    if (field.id === "senha" && scorePassword(field.value) < 3) {
      setError(field, "Use 8+ caracteres, número e letra maiúscula.");
      return false;
    }
    if (field.id === "confirmar" && field.value !== senha.value) {
      setError(field, "As senhas não coincidem.");
      return false;
    }
    if (field.id === "termos" && !field.checked) {
      setError(field, "É preciso aceitar os termos.");
      return false;
    }
    return true;
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const fields = [...form.querySelectorAll("input[required], select[required]")];
    const ok = fields.every((field) => validateField(field));
    if (!ok) {
      form.querySelector(".is-invalid input, .is-invalid select, .is-invalid")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const account = {
      nome: form.nome.value,
      email: form.email.value,
      loja: form.loja.value,
      estilo: form.estilo.value,
      criadoEm: new Date().toISOString(),
    };
    localStorage.setItem("eternos-conta", JSON.stringify(account));
    form.classList.add("is-hidden");
    form.hidden = true;
    success?.classList.add("is-visible");
    if (notice) {
      notice.textContent = `Conta criada. Bem-vindo aos Eternos, ${account.nome.split(" ")[0]}.`;
      notice.classList.add("is-on");
      window.setTimeout(() => notice.classList.remove("is-on"), 4200);
    }
    success?.focus();
  });
})();
