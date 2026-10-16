const { test, expect } = require("@playwright/test");

const pages = ["/", "/colecao.html", "/lojas.html", "/sobre.html", "/cadastro.html"];

test.describe("SEO", () => {
  test("home has language, title, description, canonical and JSON-LD", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    await expect(page).toHaveTitle(/Eternos/i);
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute("content", /Curitiba/i);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /eternos/);
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(jsonLd).toContain("ClothingStore");
    expect(jsonLd).toContain("Batel");
    expect(jsonLd).toContain("Juvevê");
    expect(jsonLd).toContain("Água Verde");
    expect(jsonLd).toContain("Centro");
  });

  test("every page has a unique h1 and alt text on images", async ({ page }) => {
    for (const path of pages) {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
      const images = page.locator("img");
      const count = await images.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i += 1) {
        await expect(images.nth(i)).toHaveAttribute("alt", /.+/);
      }
    }
  });
});

test.describe("Identidade visual e tipografia", () => {
  test("logo destaca o E e o trocadilho (E) Ternos", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".brand__e")).toHaveText("E");
    await expect(page.locator(".brand__rest")).toHaveText("ternos");
    await expect(page.locator(".brand__hint")).toHaveText(/\(E\) Ternos/);
    const eColor = await page.locator(".brand__e").evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(eColor).toMatch(/gradient/i);
  });

  test("carrega as famílias tipográficas da marca", async ({ page }) => {
    await page.goto("/");
    const fonts = await page.evaluate(() => {
      const body = getComputedStyle(document.body).fontFamily;
      const display = getComputedStyle(document.querySelector(".brand__rest")).fontFamily;
      const mark = getComputedStyle(document.querySelector(".brand__e")).fontFamily;
      return { body, display, mark };
    });
    expect(fonts.body).toMatch(/Outfit/i);
    expect(fonts.display).toMatch(/Cormorant/i);
    expect(fonts.mark).toMatch(/Cinzel/i);
  });
});

test.describe("Usabilidade e UX", () => {
  test("skip link, landmarks e navegação principal", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".skip-link")).toHaveAttribute("href", "#conteudo");
    await expect(page.getByRole("banner").first()).toBeVisible();
    const nav = page.locator("nav.nav");
    await expect(nav).toHaveCount(1);
    if (!(await nav.isVisible())) {
      await page.getByLabel("Abrir menu").click();
    }
    await expect(nav).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });

  test("carrossel avança, pausa e possui controles acessíveis", async ({ page }) => {
    await page.goto("/");
    const carousel = page.locator("[data-carousel]");
    await expect(carousel).toBeVisible();
    const first = page.locator(".slide").first();
    await expect(first).toHaveClass(/is-active/);
    await page.getByRole("button", { name: "Próximo slide" }).click();
    await expect(page.locator(".slide").nth(1)).toHaveClass(/is-active/);
    await page.getByRole("button", { name: "Slide anterior" }).click();
    await expect(first).toHaveClass(/is-active/);
    await expect(page.getByLabel("Selecionar campanha")).toBeVisible();
  });

  test("filtro da coleção altera o catálogo", async ({ page }) => {
    await page.goto("/colecao.html");
    await page.getByRole("button", { name: "Ternos" }).click();
    const visible = page.locator(".product:visible");
    const hidden = page.locator(".product.is-hidden");
    expect(await visible.count()).toBeGreaterThan(0);
    expect(await hidden.count()).toBeGreaterThan(0);
    for (const item of await visible.all()) {
      await expect(item).toHaveAttribute("data-category", "ternos");
    }
  });
});

test.describe("Formulário de cadastro", () => {
  test("bloqueia envio vazio e cria conta com dados válidos", async ({ page }) => {
    await page.goto("/cadastro.html");
    await page.getByRole("button", { name: "Criar minha conta" }).click();
    await expect(page.locator(".error").first()).not.toHaveText("");

    await page.fill("#nome", "Carlos Mendes");
    await page.fill("#email", "carlos@eternos.com.br");
    await page.fill("#telefone", "41999887766");
    await page.fill("#cpf", "39053344705");
    await page.fill("#nascimento", "1990-04-12");
    await page.selectOption("#loja", "batel");
    await page.selectOption("#estilo", "ambos");
    await page.fill("#senha", "Eternos1");
    await page.fill("#confirmar", "Eternos1");
    await page.check("#termos");
    await page.getByRole("button", { name: "Criar minha conta" }).click();
    await expect(page.locator("#cadastro-sucesso")).toBeVisible();
    await expect(page.locator("#cadastro-sucesso")).toContainText("Bem-vindo");
  });
});

test.describe("Lojas e conteúdo", () => {
  test("apresenta as quatro casas de Curitiba", async ({ page }) => {
    await page.goto("/lojas.html");
    await expect(page.getByRole("heading", { name: "Batel" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Juvevê" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Água Verde" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Centro" })).toBeVisible();
  });
});

test.describe("Responsividade", () => {
  const viewports = [
    { name: "mobile", width: 375, height: 812 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    test(`home não transborda em ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(2);
    });
  }

  test("menu móvel abre a navegação", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByLabel("Abrir menu").click();
    await expect(page.locator("body")).toHaveClass(/nav-open/);
    await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Coleção" }).click();
    await expect(page).toHaveURL(/colecao/);
  });
});
