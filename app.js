const galleryRail = document.getElementById("galleryRail");
const emptyState = document.getElementById("emptyState");
const previewTitle = document.getElementById("previewTitle");
const previewDescription = document.getElementById("previewDescription");
const previewMeta = document.getElementById("previewMeta");

const modal = document.getElementById("modal");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalClose = document.getElementById("modalClose");
const modalImage = document.getElementById("modalImage");
const modalPageIndicator = document.getElementById("modalPageIndicator");
const modalPrev = document.getElementById("modalPrev");
const modalNext = document.getElementById("modalNext");
const modalThumbnails = document.getElementById("modalThumbnails");

const template = document.getElementById("galleryCardTemplate");

const mobilePromptRoot = document.getElementById("mobilePrompt");
const mobilePromptDismiss = document.getElementById("mobilePromptDismiss");

const customCursor = document.getElementById("customCursor");
const interactiveCursorTargets = "a, button, .gallery-card, .modal__nav, .modal__close";

if (customCursor) {
  const finePointer = window.matchMedia("(pointer: fine)");
  const isMouseEvent = (event) => typeof event.pointerType !== "string" || event.pointerType === "mouse";

  const enableCursor = () => {
    document.body.classList.add("has-custom-cursor");

    const updateInteractiveState = (target) => {
      const element = target instanceof Element ? target.closest(interactiveCursorTargets) : null;
      customCursor.classList.toggle("is-aiming", Boolean(element));
    };

    const setCursorVisibility = (shouldShow) => {
      customCursor.classList.toggle("is-visible", shouldShow);
    };

    document.addEventListener("pointermove", (event) => {
      if (!isMouseEvent(event)) {
        return;
      }
      customCursor.style.left = `${event.clientX}px`;
      customCursor.style.top = `${event.clientY}px`;
      updateInteractiveState(event.target);
      setCursorVisibility(true);
    }, { passive: true });

    document.addEventListener("pointerdown", (event) => {
      if (!isMouseEvent(event)) {
        return;
      }
      customCursor.classList.add("is-clicked");
    });

    document.addEventListener("pointerup", (event) => {
      if (!isMouseEvent(event)) {
        return;
      }
      customCursor.classList.remove("is-clicked");
    });

    document.addEventListener("pointerout", (event) => {
      if (!isMouseEvent(event)) {
        return;
      }
      if (!event.relatedTarget) {
        setCursorVisibility(false);
        customCursor.classList.remove("is-aiming");
      }
    });

    document.addEventListener("pointerover", (event) => {
      if (!isMouseEvent(event)) {
        return;
      }
      if (!event.relatedTarget) {
        setCursorVisibility(true);
      }
    });

    window.addEventListener("blur", () => {
      setCursorVisibility(false);
      customCursor.classList.remove("is-clicked");
      customCursor.classList.remove("is-aiming");
    });
  };

  if (finePointer.matches) {
    enableCursor();
  } else {
    customCursor.remove();
  }

  if (typeof finePointer.addEventListener === "function") {
    finePointer.addEventListener("change", (event) => {
      if (!event.matches) {
        customCursor.remove();
        document.body.classList.remove("has-custom-cursor");
      }
    });
  } else if (typeof finePointer.addListener === "function") {
    finePointer.addListener((event) => {
      if (!event.matches) {
        customCursor.remove();
        document.body.classList.remove("has-custom-cursor");
      }
    });
  }
}

const rootStyle = document.documentElement.style;
const DEFAULT_BACKDROP = 'assets/logo1.png';
const DEFAULT_BACKDROP_SCALE = '0.73';
const BACKDROP_SCALES = {
  'assets/latelan.png': '0.88',
  'assets/kazidaier.png': '0.78',
};

const backdropState = {
  locked: false,
  hover: null,
  hoverId: null,
  active: null,
  transitionToken: null,
};

const COLOR_THEMES = {
  dark: {
    vars: {
      '--text-primary': '#f5f5f7',
      '--text-secondary': 'rgba(245, 245, 247, 0.7)',
      '--cursor-base': 'rgba(255, 255, 255, 0.18)',
      '--cursor-aim': 'rgba(255, 255, 255, 0.28)',
      '--cursor-click': 'rgba(120, 132, 150, 0.68)',
      '--cursor-click-aim': 'rgba(96, 117, 135, 0.85)',
      '--cursor-shadow': '0 12px 34px rgba(7, 10, 24, 0.33)',
      '--cursor-shadow-aim': '0 18px 46px rgba(10, 132, 255, 0.35)',
      '--cursor-shadow-click': '0 12px 28px rgba(7, 10, 24, 0.45)',
    },
  },
  light: {
    vars: {
      '--text-primary': '#121318',
      '--text-secondary': 'rgba(17, 19, 26, 0.66)',
      '--cursor-base': 'rgba(26, 30, 40, 0.18)',
      '--cursor-aim': 'rgba(26, 30, 40, 0.28)',
      '--cursor-click': 'rgba(26, 30, 40, 0.42)',
      '--cursor-click-aim': 'rgba(26, 30, 40, 0.5)',
      '--cursor-shadow': '0 12px 28px rgba(16, 23, 42, 0.16)',
      '--cursor-shadow-aim': '0 18px 40px rgba(17, 24, 45, 0.18)',
      '--cursor-shadow-click': '0 12px 24px rgba(17, 24, 45, 0.2)',
    },
  },
};

const brightnessCache = new Map();

const setColorTheme = (nextTheme) => {
  const target = COLOR_THEMES[nextTheme] ? nextTheme : 'dark';
  if (document.body) {
    document.body.classList.toggle('theme-light', target === 'light');
  }
  const vars = COLOR_THEMES[target].vars;
  Object.entries(vars).forEach(([key, value]) => {
    rootStyle.setProperty(key, value);
  });
};

setColorTheme('dark');

const determineThemeFromImage = (img) => {
  const naturalWidth = img.naturalWidth || img.width || 1;
  const naturalHeight = img.naturalHeight || img.height || 1;
  const width = Math.max(1, Math.min(64, naturalWidth));
  const height = Math.max(1, Math.round((naturalHeight / naturalWidth) * width));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return 'dark';
  }
  context.drawImage(img, 0, 0, width, height);
  const { data } = context.getImageData(0, 0, width, height);
  let luminance = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    luminance += 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  const avg = luminance / (data.length / 4);
  return avg > 0.62 ? 'light' : 'dark';
};

const updateThemeForBackdrop = (imageUrl) => {
  if (!imageUrl) {
    setColorTheme('dark');
    return;
  }
  if (brightnessCache.has(imageUrl)) {
    setColorTheme(brightnessCache.get(imageUrl));
    return;
  }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = imageUrl;
  const applyResult = () => {
    try {
      const theme = determineThemeFromImage(img);
      brightnessCache.set(imageUrl, theme);
      if (backdropState.active === imageUrl) {
        setColorTheme(theme);
      }
    } catch (_error) {
      brightnessCache.set(imageUrl, 'dark');
      if (backdropState.active === imageUrl) {
        setColorTheme('dark');
      }
    }
  };
  const handleError = () => {
    brightnessCache.set(imageUrl, 'dark');
    if (backdropState.active === imageUrl) {
      setColorTheme('dark');
    }
  };
  if (typeof img.decode === 'function') {
    img.decode().then(applyResult).catch(handleError);
  } else {
    img.onload = applyResult;
    img.onerror = handleError;
  }
};

const applyBackdrop = (imageUrl, options = {}) => {
  const { skipTransition = false } = options;
  const targetUrl = imageUrl || DEFAULT_BACKDROP;
  const scale = BACKDROP_SCALES[targetUrl] || DEFAULT_BACKDROP_SCALE;

  if (backdropState.active === targetUrl) {
    rootStyle.setProperty('--backdrop-scale', scale);
    rootStyle.setProperty('--backdrop-opacity', '0.92');
    updateThemeForBackdrop(targetUrl);
    return;
  }

  const token = Symbol('backdrop-transition');
  backdropState.transitionToken = token;

  const commit = () => {
    if (backdropState.transitionToken !== token) {
      return;
    }
    rootStyle.setProperty('--backdrop-image', `url("${targetUrl}")`);
    rootStyle.setProperty('--backdrop-scale', scale);
    backdropState.active = targetUrl;
    updateThemeForBackdrop(targetUrl);
    window.requestAnimationFrame(() => {
      if (backdropState.transitionToken !== token) {
        return;
      }
      rootStyle.setProperty('--backdrop-opacity', '0.92');
    });
  };

  if (skipTransition || !backdropState.active) {
    commit();
    return;
  }

  rootStyle.setProperty('--backdrop-opacity', '0');
  window.requestAnimationFrame(commit);
};

const transitionalApplyBackdrop = (imageUrl) => {
  applyBackdrop(imageUrl, { skipTransition: false });
};

const setHoverBackdrop = (imageUrl, sourceId) => {
  backdropState.hover = imageUrl || null;
  backdropState.hoverId = sourceId || null;
  if (!backdropState.locked) {
    transitionalApplyBackdrop(backdropState.hover);
  }
};

const clearHoverBackdrop = (sourceId) => {
  if (sourceId && backdropState.hoverId && backdropState.hoverId !== sourceId) {
    return;
  }
  backdropState.hover = null;
  backdropState.hoverId = null;
  if (!backdropState.locked) {
    transitionalApplyBackdrop(null);
  }
};

const lockBackdrop = (imageUrl) => {
  if (imageUrl) {
    backdropState.locked = true;
    transitionalApplyBackdrop(imageUrl);
  } else {
    backdropState.locked = false;
    transitionalApplyBackdrop(backdropState.hover);
  }
};

const releaseBackdrop = () => {
  backdropState.locked = false;
  if (backdropState.hover) {
    transitionalApplyBackdrop(backdropState.hover);
  } else {
    transitionalApplyBackdrop(null);
  }
};

applyBackdrop(DEFAULT_BACKDROP, { skipTransition: true });

let viewerState = {
  list: [],
  mangaIndex: 0,
  pageIndex: 0,
};

async function loadGallery() {
  try {
    const dataUrl = new URL('gallery-data.json', window.location.href);
    const response = await fetch(dataUrl.toString(), { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`请求失败：${response.status}`);
    }
    const data = await response.json();
    viewerState.list = data.items ?? [];
    renderGallery(viewerState.list);
  } catch (error) {
    console.error("加载画廊数据出错", error);
    emptyState.textContent = "加载画廊数据时出现问题，请稍后重试。";
    emptyState.style.display = "block";
  }
}

function renderGallery(items) {
  galleryRail.innerHTML = "";
  if (!items.length) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  items.forEach((item, index) => {
    const node = template.content.firstElementChild.cloneNode(true);
    const image = node.querySelector(".gallery-card__image");
    const title = node.querySelector(".gallery-card__title");

    image.src = item.cover;
    image.alt = `${item.title} - 封面`;
    title.textContent = item.title;

    const showPreview = () => {
      updatePreviewPanel(item);
      setHoverBackdrop(item.backdrop, item.id);
    };

    const handleLeave = (relatedTarget) => {
      if (relatedTarget && relatedTarget.closest && relatedTarget.closest('.gallery-card')) {
        return;
      }
      resetPreviewPanel();
      clearHoverBackdrop(item.id);
    };

    node.addEventListener("mouseenter", (event) => {
      showPreview();
    });
    node.addEventListener("focus", () => {
      showPreview();
    });
    node.addEventListener("mouseleave", (event) => {
      handleLeave(event.relatedTarget);
    });
    node.addEventListener("blur", () => {
      const next = document.activeElement;
      handleLeave(next);
    });

    const open = () => openModal(index, 0);
    node.addEventListener("click", open);
    node.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });

    galleryRail.appendChild(node);
  });
}

function updatePreviewPanel(item) {
  previewTitle.textContent = item.title;
  previewDescription.textContent = item.description || "暂无简介，期待您的补充。";
  const info = [`共 ${item.pages.length} 页`];
  if (item.updatedAt) {
    info.push(`最近更新：${new Date(item.updatedAt).toLocaleDateString("zh-CN")}`);
  }
  previewMeta.textContent = info.join(" · ");
}

function resetPreviewPanel() {
  previewTitle.textContent = "探索漫画";
  previewDescription.textContent = "将鼠标移动到封面上查看简介，点击查看完整内容。";
  previewMeta.textContent = "";
}

function openModal(mangaIndex, pageIndex) {
  viewerState.mangaIndex = mangaIndex;
  viewerState.pageIndex = pageIndex;
  const manga = viewerState.list[mangaIndex];
  lockBackdrop(manga ? manga.backdrop : null);
  updateModal();
  modal.classList.add("is-active");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("is-active");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  releaseBackdrop();
}

function updateModal() {
  const manga = viewerState.list[viewerState.mangaIndex];
  const pageCount = manga.pages.length;
  const currentPage = Math.min(Math.max(viewerState.pageIndex, 0), pageCount - 1);
  viewerState.pageIndex = currentPage;

  modalImage.src = manga.pages[currentPage];
  modalImage.alt = `${manga.title} - 第 ${currentPage + 1} 页`;
  modalPageIndicator.textContent = `${currentPage + 1} / ${pageCount}`;

  renderThumbnails(manga, currentPage);

  modalPrev.disabled = currentPage === 0;
  modalNext.disabled = currentPage === pageCount - 1;
}

function renderThumbnails(manga, activeIndex) {
  modalThumbnails.innerHTML = "";
  manga.pages.forEach((page, index) => {
    const thumb = document.createElement("img");
    thumb.src = page;
    thumb.alt = `${manga.title} 第 ${index + 1} 页缩略图`;
    if (index === activeIndex) {
      thumb.classList.add("is-active");
    }
    thumb.addEventListener("click", () => {
      viewerState.pageIndex = index;
      updateModal();
    });
    modalThumbnails.appendChild(thumb);
  });
}

modalPrev.addEventListener("click", () => {
  viewerState.pageIndex = Math.max(viewerState.pageIndex - 1, 0);
  updateModal();
});

modalNext.addEventListener("click", () => {
  const manga = viewerState.list[viewerState.mangaIndex];
  viewerState.pageIndex = Math.min(viewerState.pageIndex + 1, manga.pages.length - 1);
  updateModal();
});

modalClose.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", closeModal);

window.addEventListener("keydown", (event) => {
  if (!modal.classList.contains("is-active")) return;
  if (event.key === "Escape") {
    closeModal();
  }
  if (event.key === "ArrowRight") {
    modalNext.click();
  }
  if (event.key === "ArrowLeft") {
    modalPrev.click();
  }
});

loadGallery();
const mobilePromptState = {
  isOpen: false,
  hasBeenShown: false,
};

const isProbablyMobile = () => {
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const narrowViewport = window.matchMedia('(max-width: 768px)').matches;
  return coarsePointer || narrowViewport;
};

const openMobilePrompt = () => {
  if (!mobilePromptRoot || mobilePromptState.isOpen) return;
  mobilePromptRoot.classList.add('is-active');
  mobilePromptRoot.removeAttribute('hidden');
  mobilePromptRoot.setAttribute('aria-hidden', 'false');
  mobilePromptState.isOpen = true;
  mobilePromptState.hasBeenShown = true;
  document.body.style.overflow = 'hidden';
};

const closeMobilePrompt = () => {
  if (!mobilePromptRoot || !mobilePromptState.isOpen) return;
  mobilePromptRoot.classList.remove('is-active');
  mobilePromptRoot.setAttribute('aria-hidden', 'true');
  mobilePromptRoot.setAttribute('hidden', '');
  mobilePromptState.isOpen = false;
  document.body.style.overflow = '';
};

if (mobilePromptDismiss) {
  mobilePromptDismiss.addEventListener('click', (event) => {
    event.preventDefault();
    closeMobilePrompt();
  });
}

if (mobilePromptRoot) {
  mobilePromptRoot.addEventListener('click', (event) => {
    if (event.target === mobilePromptRoot) {
      closeMobilePrompt();
    }
  });
}

const maybeShowMobilePrompt = () => {
  if (mobilePromptState.hasBeenShown) return;
  if (isProbablyMobile()) {
    openMobilePrompt();
  }
};

maybeShowMobilePrompt();

window.addEventListener('resize', () => {
  if (!mobilePromptState.isOpen && !mobilePromptState.hasBeenShown && isProbablyMobile()) {
    openMobilePrompt();
  }
});
