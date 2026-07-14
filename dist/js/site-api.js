(function () {
    "use strict";

    var IMAGE_POSITIONS = {
        left: "left",
        "left-offset": "left-offset",
        "bottom-left": "bottom-left",
        bottom: "bottom",
        "full-width": "full-width"
    };
    var IMAGE_FITS = { contain: "contain", cover: "cover" };

    function getApiBase() {
        var base = document.documentElement.getAttribute("data-api-base") || "";
        return base.replace(/\/$/, "");
    }

    function requestJson(method, path, body) {
        var url = getApiBase() + path;
        var opts = {
            method: method,
            headers: { Accept: "application/json" }
        };
        if (body != null) {
            opts.headers["Content-Type"] = "application/json";
            opts.body = JSON.stringify(body);
        }
        return fetch(url, opts).then(function (res) {
            return res.text().then(function (text) {
                var data = null;
                if (text) {
                    try {
                        data = JSON.parse(text);
                    } catch (e) {
                        data = null;
                    }
                }
                return { ok: res.ok, status: res.status, body: data };
            });
        });
    }

    function getSectionIndex() {
        return requestJson("GET", "/section/index", null);
    }

    function submitFeedback(phone) {
        return requestJson("POST", "/feedback", { phone: phone });
    }

    function feedbackErrorMessage(result) {
        if (!result || !result.body) return "Не удалось отправить заявку.";
        if (result.body.message) return result.body.message;
        var err = result.body.errors;
        if (err && err.phone) {
            var p = err.phone;
            return Array.isArray(p) ? p[0] : String(p);
        }
        return "Не удалось отправить заявку.";
    }

    function ensureMeta(name) {
        var el = document.querySelector('meta[name="' + name + '"]');
        if (!el) {
            el = document.createElement("meta");
            el.setAttribute("name", name);
            document.head.appendChild(el);
        }
        return el;
    }

    function telegramHref(value) {
        var v = String(value || "").trim();
        if (!v) return "#";
        if (/^https?:\/\//i.test(v)) return v;
        if (v.indexOf("t.me/") !== -1) return v.indexOf("http") === 0 ? v : "https://" + v.replace(/^\/*/, "");
        var u = v.replace(/^@/, "");
        return "https://t.me/" + u;
    }

    function telegramLabel(value) {
        var v = String(value || "").trim();
        if (!v) return "";
        if (/^https?:\/\//i.test(v)) return v;
        return v.indexOf("@") === 0 ? v : "@" + v.replace(/^@/, "");
    }

    function telHref(phone) {
        var s = String(phone || "").trim();
        if (!s) return "#";
        var cleaned = s.replace(/[^\d+]/g, "");
        if (!cleaned) return "#";
        if (cleaned.charAt(0) !== "+") cleaned = "+" + cleaned.replace(/\+/g, "");
        return "tel:" + cleaned;
    }

    function applyConfigContacts(config) {
        if (!config || typeof config !== "object") return;
        var items = document.querySelector(".contacts__info-items");
        if (!items) return;
        var links = items.querySelectorAll("a.contacts__info-item");
        if (links.length < 3) return;

        var email = config.email;
        if (email && String(email).trim()) {
            var e = String(email).trim();
            links[0].setAttribute("href", "mailto:" + e);
            var s0 = links[0].querySelector("span");
            if (s0) s0.textContent = e;
        }

        var telegram = config.telegram;
        if (telegram && String(telegram).trim()) {
            var t = String(telegram).trim();
            links[1].setAttribute("href", telegramHref(t));
            var s1 = links[1].querySelector("span");
            if (s1) s1.textContent = telegramLabel(t);
        }

        var phone = config.phone;
        if (phone && String(phone).trim()) {
            var p = String(phone).trim();
            links[2].setAttribute("href", telHref(p));
            var s2 = links[2].querySelector("span");
            if (s2) s2.textContent = p;
        }
    }

    function parsePositiveNumber(value) {
        var n = Number(value);
        return n > 0 && isFinite(n) ? n : null;
    }

    function normalizeColor(value, fallback) {
        if (value == null) return fallback || "";
        var s = String(value).trim();
        return s || fallback || "";
    }

    function colorLuminance(hex) {
        var m = String(hex || "")
            .trim()
            .replace(/^#/, "")
            .match(/^([0-9a-f]{3}|[0-9a-f]{6})$/i);
        if (!m) return null;
        var h = m[1];
        if (h.length === 3) {
            h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        }
        var r = parseInt(h.slice(0, 2), 16) / 255;
        var g = parseInt(h.slice(2, 4), 16) / 255;
        var b = parseInt(h.slice(4, 6), 16) / 255;
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    function isDarkColor(hex) {
        var lum = colorLuminance(hex);
        return lum != null ? lum < 0.5 : false;
    }

    function resolveImageAsset(asset) {
        if (!asset) return null;
        if (typeof asset === "string") {
            var s = asset.trim();
            return s
                ? {
                      path: s,
                      width: null,
                      height: null,
                      position: null,
                      fit: null,
                      maxWidthPercent: null
                  }
                : null;
        }
        if (typeof asset === "object" && asset.path) {
            var path = String(asset.path).trim();
            if (!path) return null;
            var maxW = parsePositiveNumber(asset.max_width_percent);
            return {
                path: path,
                width: parsePositiveNumber(asset.width),
                height: parsePositiveNumber(asset.height),
                position: asset.position != null ? String(asset.position).trim() : null,
                fit: asset.fit != null ? String(asset.fit).trim() : null,
                maxWidthPercent: maxW
            };
        }
        return null;
    }

    function resolveImagePosition(asset, pageIdx) {
        var raw = asset && asset.position ? String(asset.position).trim() : "";
        if (IMAGE_POSITIONS[raw]) return IMAGE_POSITIONS[raw];
        if (pageIdx > 0) return "full-width";
        return "left";
    }

    function resolveImageFit(asset, position) {
        // bottom / full-width: always contain so the photo isn't cropped to a short strip
        if (position === "bottom" || position === "full-width") return "contain";
        var raw = asset && asset.fit ? String(asset.fit).trim() : "";
        if (IMAGE_FITS[raw]) return IMAGE_FITS[raw];
        return "contain";
    }

    function createAssetImg(asset, alt, options) {
        var data = resolveImageAsset(asset);
        if (!data) return null;
        options = options || {};
        var img = document.createElement("img");
        img.src = data.path;
        img.alt = alt || "";
        img.decoding = "async";

        if (data.width && data.height) {
            img.setAttribute("width", String(data.width));
            img.setAttribute("height", String(data.height));
            img.style.aspectRatio = data.width + " / " + data.height;
        }

        if (options.objectFit) {
            img.style.objectFit = options.objectFit;
        }

        return img;
    }

    var ARROW_DOWN_SVG_LIGHT =
        '<svg width="24" height="38" viewBox="0 0 24 38" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M11.5225 4.40277e-06L11.5225 36M11.5225 36L22.5225 25.3333M11.5225 36L0.522458 25.3333" stroke="white" stroke-width="1.5" />' +
        "</svg>";

    var ARROW_DOWN_SVG_DARK =
        '<svg width="24" height="38" viewBox="0 0 24 38" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M11.5225 4.40277e-06L11.5225 36M11.5225 36L22.5225 25.3333M11.5225 36L0.522458 25.3333" stroke="#0B0B0B" stroke-width="1.5" />' +
        "</svg>";

    function getProjectQuerySlug() {
        try {
            var params = new URLSearchParams(window.location.search || "");
            var value = params.get("project");
            return value != null ? String(value).trim() : "";
        } catch (e) {
            return "";
        }
    }

    function slugsEqual(a, b) {
        return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
    }

    function revealDeepLinkedProject() {
        document.querySelectorAll(".spollers-menu__item._active").forEach(function (item) {
            item.style.transition = "none";
            item.style.opacity = "1";
            item.style.visibility = "visible";
            item.style.webkitTransform = "translate(0,0)";
            item.style.transform = "translate(0,0)";
            void item.offsetWidth;
            item.style.transition = "";
            item.style.opacity = "";
            item.style.visibility = "";
            item.style.webkitTransform = "";
            item.style.transform = "";
        });
    }

    function openProjectsSection() {
        if (typeof window.openGenisoftProjectsMenu === "function") {
            window.openGenisoftProjectsMenu({ forceShowActive: true });
            return;
        }
        var root = document.documentElement;
        if (!root.classList.contains("menu-open")) {
            root.classList.add("menu-open");
            root.classList.add("lock");
        }
        revealDeepLinkedProject();
    }

    function appendApiProjects(data) {
        var list = data.projects && data.projects.list ? data.projects.list : [];
        var container = document.querySelector(".menu__spollers.spollers-menu");
        if (!list.length || !container) return;

        var existing = container.querySelectorAll(".spollers-menu__item").length;
        var targetSlug = getProjectQuerySlug();
        var matchedIdx = -1;

        if (targetSlug) {
            for (var i = 0; i < list.length; i++) {
                if (slugsEqual(list[i].slug, targetSlug)) {
                    matchedIdx = i;
                    break;
                }
            }
        }

        list.forEach(function (proj, listIdx) {
            var pages = proj.pages && proj.pages.length ? proj.pages : [];
            if (!pages.length) return;

            var titleColor = normalizeColor(proj.title_color, "#ffffff");
            var num = proj.number != null ? String(proj.number) : "";
            var title = proj.title != null ? String(proj.title) : "";
            var slug = proj.slug != null ? String(proj.slug) : "";
            var isActive =
                matchedIdx >= 0 ? listIdx === matchedIdx : existing === 0 && listIdx === 0;
            var firstPage = pages[0];
            var firstTextColor = normalizeColor(firstPage.text_color, titleColor);

            var item = document.createElement("div");
            item.className = "spollers-menu__item" + (isActive ? " _active" : "");

            var wrap = document.createElement("div");
            wrap.className =
                "spollers-menu__project project project-from-api" +
                (isActive ? " _active" : " _not-active");
            if (slug) wrap.setAttribute("data-project-slug", slug);

            var fallbackBg = firstPage.backgroundColor || "";
            if (fallbackBg) {
                wrap.setAttribute("data-api-bg", "");
                wrap.style.setProperty("--api-project-bg", fallbackBg);
            }
            wrap.style.setProperty("--api-active-number-color", firstTextColor || "#ffffff");

            pages.forEach(function (page, pageIdx) {
                wrap.appendChild(buildProjectBody(page, titleColor, num, title, pageIdx, pages.length));
            });

            if (pages.length > 1) {
                var arrow = document.createElement("button");
                arrow.type = "button";
                arrow.className = "project__arrow-down";
                arrow.innerHTML = isDarkColor(firstTextColor) ? ARROW_DOWN_SVG_DARK : ARROW_DOWN_SVG_LIGHT;
                wrap.appendChild(arrow);
            }

            item.appendChild(wrap);
            container.appendChild(item);
        });

        if (typeof window.reinitGenisoftProjectsUI === "function") {
            window.reinitGenisoftProjectsUI();
        }

        if (matchedIdx >= 0) {
            // Double rAF: let the browser paint collapsed cards, then open.
            // After a slow init, icon.click() + CSS 2.2s intro often never show the project.
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    openProjectsSection();
                });
            });
        }
    }

    function buildProjectBody(page, titleColor, numberText, titleText, pageIdx, totalPages) {
        var body = document.createElement("div");
        body.className = "project__body";
        body.setAttribute("data-page-index", String(pageIdx));

        var bg = page.backgroundColor || "";
        if (bg) {
            body.setAttribute("data-api-body-bg", "");
            body.style.setProperty("--api-body-bg", bg);
        }

        var pageTextColor = normalizeColor(page.text_color, titleColor);
        if (pageTextColor) {
            body.style.setProperty("--api-page-text-color", pageTextColor);
        }

        var textPosition = page.text_position === "left" ? "left" : "right";
        body.setAttribute("data-text-position", textPosition);
        if (textPosition === "left") {
            body.classList.add("project__body--text-left");
        }

        var left = buildProjectLeft(page, pageTextColor, numberText, titleText, pageIdx);
        var right = buildProjectRight(page, pageTextColor);

        // DOM order: visual left, text right; CSS flips when text_position=left
        body.appendChild(left);
        body.appendChild(right);

        if (totalPages > 1) {
            body.classList.add("project__body--multi");
        }

        return body;
    }

    function buildProjectLeft(page, pageTextColor, numberText, titleText, pageIdx) {
        var left = document.createElement("div");
        left.className = "project__left";

        if (pageIdx === 0) {
            var numEl = document.createElement("div");
            numEl.className = "project__number";
            numEl.textContent = numberText;
            // Color for collapsed list is dark via CSS; expanded uses --api-active-number-color
            left.appendChild(numEl);
        }

        var titleEl = document.createElement("div");
        titleEl.className = "project__title";
        titleEl.textContent = titleText;
        if (pageTextColor) titleEl.style.color = pageTextColor;
        left.appendChild(titleEl);

        var imageAsset = resolveImageAsset(page.backgroundImage);
        if (imageAsset) {
            var position = resolveImagePosition(imageAsset, pageIdx);
            var fit = resolveImageFit(imageAsset, position);
            var imageWrap = document.createElement("div");
            imageWrap.className = "project__image";
            imageWrap.setAttribute("data-image-position", position);
            imageWrap.setAttribute("data-image-fit", fit);

            if (imageAsset.maxWidthPercent != null) {
                imageWrap.style.setProperty("--api-image-max-width", imageAsset.maxWidthPercent + "%");
            }

            var heroImg = createAssetImg(page.backgroundImage, "", {
                role: "hero",
                objectFit: fit
            });
            if (heroImg) imageWrap.appendChild(heroImg);
            left.appendChild(imageWrap);
        }

        var logoAsset = resolveImageAsset(page.logo);
        if (logoAsset) {
            var logoWrap = document.createElement("div");
            logoWrap.className = "project__logo";
            var logoPosition =
                page.logo && page.logo.position != null && String(page.logo.position).trim()
                    ? String(page.logo.position).trim()
                    : "bottom-left";
            logoWrap.setAttribute("data-logo-position", logoPosition);
            if (logoAsset.width && logoAsset.height) {
                logoWrap.style.setProperty("--logo-w", String(Math.max(1, Math.round(logoAsset.width / 2))));
                logoWrap.style.setProperty("--logo-h", String(Math.max(1, Math.round(logoAsset.height / 2))));
            }
            var logoImg = createAssetImg(page.logo, "", { objectFit: "contain" });
            if (logoImg) {
                logoWrap.appendChild(logoImg);
                left.appendChild(logoWrap);
            }
        }

        if (pageIdx === 0) {
            var hiddenTitle = document.createElement("div");
            hiddenTitle.className = "project__hidden-title";
            hiddenTitle.textContent = titleText;
            left.appendChild(hiddenTitle);
        }

        return left;
    }

    function buildProjectRight(page, pageTextColor) {
        var right = document.createElement("div");
        right.className = "project__right";
        if (pageTextColor) right.style.color = pageTextColor;

        var plist = page.products && page.products.length ? page.products : [];
        if (plist.length) {
            var products = document.createElement("div");
            products.className = "project__products";

            var productsTitle = document.createElement("div");
            productsTitle.className = "project__products-title";
            productsTitle.textContent = "Продукты";

            var ul = document.createElement("ul");
            ul.className = "project__products-list";

            plist.forEach(function (p) {
                var li = document.createElement("li");
                li.className = "project__products-item";
                var t = p && p.title != null ? String(p.title) : "";
                li.appendChild(document.createTextNode(t));
                if (p && p.description) {
                    var span = document.createElement("span");
                    span.textContent = String(p.description);
                    li.appendChild(span);
                }
                ul.appendChild(li);
            });

            products.appendChild(productsTitle);
            products.appendChild(ul);
            right.appendChild(products);
        }

        if (page.description) {
            var descr = document.createElement("div");
            descr.className = "project__descr";
            descr.innerHTML = page.description;
            var descrColor = normalizeColor(page.descriptionColor, pageTextColor);
            if (descrColor) descr.style.color = descrColor;
            right.appendChild(descr);
        }

        if (!plist.length && !page.description) {
            right.hidden = true;
        }

        return right;
    }

    function applySectionToHome(data) {
        if (!data || typeof data !== "object") return;

        applyConfigContacts(data.config);

        if (data.title) document.title = data.title;
        if (data.description) ensureMeta("description").setAttribute("content", data.description);
        if (data.keywords) ensureMeta("keywords").setAttribute("content", data.keywords);

        var h1 = document.querySelector(".header__title");
        if (h1 && data.primary_text) h1.innerHTML = data.primary_text;

        var bgFirst = document.querySelector(".header__background-text--first");
        if (bgFirst && data.secondary_text) bgFirst.innerHTML = data.secondary_text;

        var bgSecond = document.querySelector(".header__background-text--second");
        if (bgSecond && data.tetriary_text) bgSecond.innerHTML = data.tetriary_text;

        var labels = data.projects && data.projects.labels ? data.projects.labels : {};
        var orderLabel = document.querySelector(".header__main-button .header__button-label");
        if (orderLabel && labels.order_project_title) orderLabel.textContent = labels.order_project_title;

        var feedbackLabel = document.querySelector(".header__contact-button .header__button-label");
        if (feedbackLabel && labels.feedback_button_title) feedbackLabel.textContent = labels.feedback_button_title;

        appendApiProjects(data);
    }

    function initHomePageFromApi() {
        getSectionIndex()
            .then(function (result) {
                if (result.ok && result.body) applySectionToHome(result.body);
            })
            .catch(function (e) {
                console.warn("[Genisoft] GET /section/index:", e);
            });
    }

    window.GenisoftSiteApi = {
        getApiBase: getApiBase,
        getSectionIndex: getSectionIndex,
        submitFeedback: submitFeedback,
        feedbackErrorMessage: feedbackErrorMessage
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initHomePageFromApi);
    } else {
        initHomePageFromApi();
    }
})();
