// Multi Find Chrome Extension - Popup Script
// 弹出页面的交互逻辑

class PopupManager {
  constructor() {
    this.searches = [];
    this.isActive = false;
    this.colorClasses = [
      'multi-find-highlight-0', 'multi-find-highlight-1', 'multi-find-highlight-2', 
      'multi-find-highlight-3', 'multi-find-highlight-4', 'multi-find-highlight-5',
      'multi-find-highlight-6', 'multi-find-highlight-7', 'multi-find-highlight-8', 
      'multi-find-highlight-9'
    ];
    this.colorValues = [
      '#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3', '#e0e7ff',
      '#fed7d7', '#e6fffa', '#faf5ff', '#fff7ed', '#f0fdf4'
    ];
    
    // 初始化i18n配置
    this.i18n = {
      en: {
        'header.description': 'Smart multi-keyword search for efficient information finding',
        'input.placeholder': 'Enter search keyword...',
        'button.add': 'Add',
        'button.full': 'Full',
        'button.exists': 'Exists',
        'button.remove': 'Remove',
        'button.clearAll': 'Clear All',
        // 添加消息翻译
        'message.enterKeyword': 'Please enter a search keyword',
        'message.keywordExists': 'This keyword already exists',
        'message.maxKeywords': 'Maximum 8 search keywords supported',
        'message.keywordAdded': 'Added search keyword:',
        'message.keywordRemoved': 'Removed search keyword:',
        'message.addFailed': 'Failed to add search, please refresh and try again',
        'message.removeFailed': 'Failed to remove search',
        'message.noKeywordsToClear': 'No search keywords to clear',
        'message.allCleared': 'All search keywords cleared',
        'message.clearFailed': 'Failed to clear searches',
        'section.searchList': 'Search List',
        'empty.noKeywords': 'No search keywords',
        'empty.addKeywords': 'Add keywords to start multi-search',
        'shortcut.label': 'Shortcut:',
        'shortcut.description': 'Ctrl+Shift+F to quickly open multi-search panel',
        'nav.previous': '◀',
        'nav.next': '▶'
      },
      'zh-CN': {
        'header.description': '智能多关键词搜索，让信息查找更高效',
        'input.placeholder': '输入搜索关键词...',
        'button.add': '添加',
        'button.full': '已满',
        'button.exists': '已存在',
        'button.remove': '移除',
        'button.clearAll': '清空全部',
        // 添加消息翻译
        'message.enterKeyword': '请输入搜索关键词',
        'message.keywordExists': '该关键词已存在',
        'message.maxKeywords': '最多支持8个搜索关键词',
        'message.keywordAdded': '已添加搜索词: ',
        'message.keywordRemoved': '已移除搜索词: ',
        'message.addFailed': '添加搜索失败，请刷新页面重试',
        'message.removeFailed': '移除搜索失败',
        'message.noKeywordsToClear': '没有搜索词需要清空',
        'message.allCleared': '已清空所有搜索词',
        'message.clearFailed': '清空失败',
        'section.searchList': '搜索列表',
        'empty.noKeywords': '暂无搜索关键词',
        'empty.addKeywords': '添加关键词开始多搜索',
        'shortcut.label': '快捷键：',
        'shortcut.description': 'Ctrl+Shift+F 快速打开多搜索面板',
        'nav.previous': '◀',
        'nav.next': '▶'
      },
      'zh-TW': {
        'header.description': '智慧多关键字搜索，让信息查找更高效',
        'input.placeholder': '输入搜索关键词...',
        'button.add': '新增',
        'button.full': '已满',
        'button.exists': '已存在',
        'button.remove': '移除',
        'button.clearAll': '清空全部',
        // 添加消息翻译
        'message.enterKeyword': '请输入搜索关键词',
        'message.keywordExists': '该关键词已存在',
        'message.maxKeywords': '最多支持8个搜索关键词',
        'message.keywordAdded': '已添加搜索词: ',
        'message.keywordRemoved': '已移除搜索词: ',
        'message.addFailed': '添加搜索失败，请刷新页面重试',
        'message.removeFailed': '移除搜索失败',
        'message.noKeywordsToClear': '没有搜索词需要清空',
        'message.allCleared': '已清空所有搜索词',
        'message.clearFailed': '清空失败',
        'section.searchList': '搜索列表',
        'empty.noKeywords': '暂无搜索关键词',
        'empty.addKeywords': '添加关键词开始多搜索',
        'shortcut.label': '快捷键：',
        'shortcut.description': 'Ctrl+Shift+F 快速打开多搜索面板',
        'nav.previous': '◀',
        'nav.next': '▶'
      },
      fr: {
        'header.description': 'Recherche intelligente multi-mots-clés pour une recherche d\'informations efficace',
        'input.placeholder': 'Entrez le mot-clé de recherche...',
        'button.add': 'Ajouter',
        'button.full': 'Plein',
        'button.exists': 'Existe',
        'button.remove': 'Supprimer',
        'button.clearAll': 'Tout effacer',
        'message.enterKeyword': 'Veuillez entrer un mot-clé de recherche',
        'message.keywordExists': 'Ce mot-clé existe déjà',
        'message.maxKeywords': 'Maximum 8 mots-clés de recherche supportés',
        'message.keywordAdded': 'Mot-clé de recherche ajouté:',
        'message.keywordRemoved': 'Mot-clé de recherche supprimé:',
        'message.addFailed': 'Échec de l\'ajout de la recherche, veuillez actualiser et réessayer',
        'message.removeFailed': 'Échec de la suppression de la recherche',
        'message.noKeywordsToClear': 'Aucun mot-clé de recherche à effacer',
        'message.allCleared': 'Tous les mots-clés de recherche effacés',
        'message.clearFailed': 'Échec de l\'effacement',
        'section.searchList': 'Liste de recherche',
        'empty.noKeywords': 'Aucun mot-clé de recherche',
        'empty.addKeywords': 'Ajoutez des mots-clés pour commencer la multi-recherche',
        'shortcut.label': 'Raccourci :',
        'shortcut.description': 'Ctrl+Shift+F pour ouvrir rapidement le panneau multi-recherche',
        'nav.previous': '◀',
        'nav.next': '▶'
      },
      de: {
        'header.description': 'Intelligente Multi-Keyword-Suche für effiziente Informationsfindung',
        'input.placeholder': 'Suchbegriff eingeben...',
        'button.add': 'Hinzufügen',
        'button.full': 'Voll',
        'button.exists': 'Existiert',
        'button.remove': 'Entfernen',
        'button.clearAll': 'Alle löschen',
        'message.enterKeyword': 'Bitte geben Sie einen Suchbegriff ein',
        'message.keywordExists': 'Dieser Suchbegriff existiert bereits',
        'message.maxKeywords': 'Maximal 8 Suchbegriffe unterstützt',
        'message.keywordAdded': 'Suchbegriff hinzugefügt:',
        'message.keywordRemoved': 'Suchbegriff entfernt:',
        'message.addFailed': 'Hinzufügen der Suche fehlgeschlagen, bitte aktualisieren und erneut versuchen',
        'message.removeFailed': 'Entfernen der Suche fehlgeschlagen',
        'message.noKeywordsToClear': 'Keine Suchbegriffe zum Löschen',
        'message.allCleared': 'Alle Suchbegriffe gelöscht',
        'message.clearFailed': 'Löschen fehlgeschlagen',
        'section.searchList': 'Suchliste',
        'empty.noKeywords': 'Keine Suchbegriffe',
        'empty.addKeywords': 'Fügen Sie Schlüsselwörter hinzu, um die Multi-Suche zu starten',
        'shortcut.label': 'Tastenkürzel:',
        'shortcut.description': 'Strg+Shift+F zum schnellen Öffnen des Multi-Such-Panels',
        'nav.previous': '◀',
        'nav.next': '▶'
      },
      ru: {
        'header.description': 'Умный поиск по нескольким ключевым словам для эффективного поиска информации',
        'input.placeholder': 'Введите ключевое слово для поиска...',
        'button.add': 'Добавить',
        'button.full': 'Заполнено',
        'button.exists': 'Существует',
        'button.remove': 'Удалить',
        'button.clearAll': 'Очистить все',
        'message.enterKeyword': 'Пожалуйста, введите ключевое слово для поиска',
        'message.keywordExists': 'Это ключевое слово уже существует',
        'message.maxKeywords': 'Поддерживается максимум 8 ключевых слов для поиска',
        'message.keywordAdded': 'Добавлено ключевое слово:',
        'message.keywordRemoved': 'Удалено ключевое слово:',
        'message.addFailed': 'Не удалось добавить поиск, пожалуйста, обновите и попробуйте снова',
        'message.removeFailed': 'Не удалось удалить поиск',
        'message.noKeywordsToClear': 'Нет ключевых слов для очистки',
        'message.allCleared': 'Все ключевые слова очищены',
        'message.clearFailed': 'Не удалось очистить',
        'section.searchList': 'Список поиска',
        'empty.noKeywords': 'Нет ключевых слов для поиска',
        'empty.addKeywords': 'Добавьте ключевые слова для начала мульти-поиска',
        'shortcut.label': 'Горячая клавиша:',
        'shortcut.description': 'Ctrl+Shift+F для быстрого открытия панели мульти-поиска',
        'nav.previous': '◀',
        'nav.next': '▶'
      }
    };
    
    // 语言映射
    this.langDisplayNames = {
      'en': 'EN',
      'zh-CN': '中',
      'zh-TW': '繁',
      'fr': 'FR',
      'de': 'DE',
      'ru': 'RU'
    };
    
    // 初始化当前语言
    this.currentLanguage = this.loadSavedLanguage();
    
    this.init();
  }

  // 语言检测
  detectLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    
    const langMap = {
      'en': 'en',
      'en-US': 'en',
      'en-GB': 'en',
      'zh': 'zh-CN',
      'zh-CN': 'zh-CN',
      'zh-Hans': 'zh-CN',
      'zh-TW': 'zh-TW',
      'zh-Hant': 'zh-TW',
      'fr': 'fr',
      'fr-FR': 'fr',
      'de': 'de',
      'de-DE': 'de',
      'ru': 'ru',
      'ru-RU': 'ru'
    };
    
    return langMap[browserLang] || 'en';
  }

  // 翻译方法（支持参数替换）
  t(key, params = {}, lang = this.currentLanguage) {
    const translations = this.i18n[lang] || this.i18n.en;
    let text = translations[key] || key;
    
    // 替换参数
    Object.keys(params).forEach(param => {
      text = text.replace(`{${param}}`, params[param]);
    });
    
    return text;
  }

  // 保存和加载语言设置
  saveLanguage(lang) {
    localStorage.setItem('multifind-language', lang);
  }

  loadSavedLanguage() {
    return localStorage.getItem('multifind-language') || this.detectLanguage();
  }

  // 应用翻译
  applyTranslations(lang) {
    const translations = this.i18n[lang] || this.i18n.en;
    
    // 更新HTML lang属性
    document.documentElement.lang = lang;
    
    // 翻译所有带有data-i18n属性的元素
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (translations[key]) {
        element.textContent = translations[key];
      }
    });
    
    // 翻译placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      if (translations[key]) {
        element.placeholder = translations[key];
      }
    });
    
    // 更新语言按钮显示
    const currentLangText = document.getElementById('currentLangText');
    if (currentLangText) {
      currentLangText.textContent = this.langDisplayNames[lang] || 'EN';
    }
    
    // 更新语言选项的激活状态
    document.querySelectorAll('.language-option').forEach(option => {
      option.classList.remove('active');
      if (option.getAttribute('data-lang') === lang) {
        option.classList.add('active');
      }
    });
  }

  // 初始化语言选择器
  initLanguageSelector() {
    const languageBtn = document.getElementById('languageBtn');
    const languageDropdown = document.getElementById('languageDropdown');
    
    if (!languageBtn || !languageDropdown) return;
    
    // 点击语言按钮显示/隐藏下拉菜单
    languageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      languageDropdown.classList.toggle('show');
    });
    
    // 点击语言选项
    document.querySelectorAll('.language-option').forEach(option => {
      option.addEventListener('click', () => {
        const selectedLang = option.getAttribute('data-lang');
        this.currentLanguage = selectedLang;
        this.saveLanguage(selectedLang);
        this.applyTranslations(selectedLang);
        languageDropdown.classList.remove('show');
        
        // 重新更新UI以应用新语言
        this.updateUI();
      });
    });
    
    // 点击其他地方关闭下拉菜单
    document.addEventListener('click', () => {
      languageDropdown.classList.remove('show');
    });
  }

  async init() {
    // 获取DOM元素
    this.searchInput = document.getElementById('searchInput');
    this.addBtn = document.getElementById('addBtn');
    this.clearBtn = document.getElementById('clearBtn');
    this.searchesList = document.getElementById('searchesList');

    // 初始化语言选择器
    this.initLanguageSelector();
    
    // 应用初始翻译
    this.applyTranslations(this.currentLanguage);

    // 绑定事件
    this.bindEvents();

    // 加载当前状态
    await this.loadCurrentState();
    
    // 更新UI
    await this.updateUI();
  }

  bindEvents() {
    // 添加搜索按钮
    this.addBtn.addEventListener('click', () => {
      this.addSearch();
    });

    // 输入框回车键
    this.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addSearch();
      }
    });

    // 输入框变化时更新按钮状态
    this.searchInput.addEventListener('input', () => {
      this.updateAddButtonState();
    });

    // 清空所有搜索
    this.clearBtn.addEventListener('click', () => {
      this.clearAllSearches();
    });
  }

  async loadCurrentState() {
    try {
      // 获取当前标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        // 从content script获取当前搜索状态
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'getSearches' });
        if (response && response.searches) {
          this.searches = response.searches;
        }
      }
    } catch (error) {
      console.log('无法获取当前状态:', error);
      this.searches = [];
    }
  }

  async addSearch() {
    const keyword = this.searchInput.value.trim();
    
    if (!keyword) {
      this.showMessage(this.t('message.enterKeyword'), 'error');
      return;
    }

    if (this.searches.includes(keyword)) {
      this.showMessage(this.t('message.keywordExists'), 'warning');
      return;
    }

    if (this.searches.length >= 8) {
      this.showMessage(this.t('message.maxKeywords'), 'warning');
      return;
    }

    try {
      // 发送消息给content script
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'addSearch',
          keyword: keyword
        });
        
        this.searches.push(keyword);
        this.searchInput.value = '';
        await this.updateUI();
        this.showMessage(this.t('message.keywordAdded') + `${keyword}`, 'success');
      }
    } catch (error) {
      console.error(this.t('message.addFailed') , error);
      this.showMessage(this.t('message.addFailed'), 'error');
    }
  }

  async removeSearch(keyword) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'removeSearch',
          keyword: keyword
        });
        
        this.searches = this.searches.filter(s => s !== keyword);
        await this.updateUI();
        this.showMessage(this.t('message.keywordRemoved') + `${keyword}`, 'success');
      }
    } catch (error) {
      console.error(this.t('message.removeFailed'), error);
      this.showMessage(this.t('message.removeFailed'), 'error');
    }
  }

  async getMatchInfo() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        const response = await chrome.tabs.sendMessage(tab.id, { 
          action: 'getMatchInfo'
        });
        return response || {};
      }
    } catch (error) {
      console.error('Failed to get match info:', error);
    }
    return {};
  }

  async navigateToMatch(keyword, direction) {
    try {
      // 获取当前标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        // 发送导航消息给content script
        const response = await chrome.tabs.sendMessage(tab.id, { 
          action: 'navigate',
          keyword: keyword,
          direction: direction
        });
        console.log(response)
        if (response && response.success) {
          // 更新搜索列表显示
          await this.updateSearchesList();
          // 修复2：移除弹窗提醒，减少干扰
          // 不再显示showMessage
        } else {
          // 修复2：也移除错误提示，减少干扰
          // this.showMessage('未找到匹配项', 'warning');
        }
      }
    } catch (error) {
      console.error('导航失败:', error);
      // 修复2：也移除错误提示，减少干扰
      // this.showMessage('导航失败', 'error');
    }
  }

  async clearAllSearches() {
    if (this.searches.length === 0) {
      this.showMessage(this.t('message.noKeywordsToClear'), 'warning');
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'clearAll'
        });
        
        this.searches = [];
        await this.updateUI();
        this.showMessage(this.t('message.allCleared'), 'success');
      }
    } catch (error) {
      console.error(this.t('message.clearFailed'), error);
      this.showMessage(this.t('message.clearFailed'), 'error');
    }
  }

  async updateUI() {
    await this.updateSearchesList();
    this.updateAddButtonState();
    this.updateClearButton();
  }

  async updateSearchesList() {
    if (this.searches.length === 0) {
      this.searchesList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <div>${this.t('empty.noKeywords')}</div>
          <div>${this.t('empty.addKeywords')}</div>
        </div>
      `;
      return;
    }

    // 获取匹配信息
    const matchInfo = await this.getMatchInfo();

    const searchesHTML = this.searches.map((keyword, index) => {
      const color = this.colorValues[index % this.colorValues.length];
      const info = matchInfo[keyword] || { currentIndex: -1, totalMatches: 0 };
      const total = typeof info.totalMatches === 'number' ? info.totalMatches : 0;
      const currentIdx = typeof info.currentIndex === 'number' ? info.currentIndex : -1;
      const displayIndex = total > 0 ? Math.max(1, currentIdx + 1) : 0;
      const countText = ` (${displayIndex}/${total})`;

      return `
        <div class="search-item">
          <div class="search-content">
            <button class="nav-btn prev-btn" data-keyword="${this.escapeHtml(keyword)}" title="上一个">&lt;</button>
            <div class="search-text" style="background-color: ${color}; color: ${this.getContrastColor(color)};">
              ${this.escapeHtml(keyword)}<span class="match-count">${countText}</span>
            </div>
            <button class="nav-btn next-btn" data-keyword="${this.escapeHtml(keyword)}" title="下一个">&gt;</button>
          </div>
          <button class="remove-btn" data-keyword="${this.escapeHtml(keyword)}">
            ${this.t('button.remove')}
          </button>
        </div>
      `;
    }).join('');

    this.searchesList.innerHTML = searchesHTML;

    // 绑定移除按钮事件
    this.searchesList.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const keyword = e.target.getAttribute('data-keyword');
        this.removeSearch(keyword);
      });
    });

    // 绑定导航按钮事件
    this.searchesList.querySelectorAll('.prev-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const keyword = e.target.getAttribute('data-keyword');
        this.navigateToMatch(keyword, 'prev');
      });
    });

    this.searchesList.querySelectorAll('.next-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const keyword = e.target.getAttribute('data-keyword');
        this.navigateToMatch(keyword, 'next');
      });
    });
  }

  updateAddButtonState() {
    const keyword = this.searchInput.value.trim();
    const isDisabled = !keyword || this.searches.includes(keyword) || this.searches.length >= 8;
    
    this.addBtn.disabled = isDisabled;
    
    if (this.searches.length >= 8) {
      this.addBtn.textContent = this.t('button.full');
    } else if (this.searches.includes(keyword)) {
      this.addBtn.textContent = this.t('button.exists');
    } else {
      this.addBtn.textContent = this.t('button.add');
    }
  }



  updateClearButton() {
    this.clearBtn.disabled = this.searches.length === 0;
  }

  showMessage(message, type = 'info') {
    // 创建消息提示
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      z-index: 1000;
      animation: slideDown 0.3s ease;
    `;

    // 根据类型设置颜色
    switch (type) {
      case 'success':
        messageEl.style.background = '#d4edda';
        messageEl.style.color = '#155724';
        messageEl.style.border = '1px solid #c3e6cb';
        break;
      case 'error':
        messageEl.style.background = '#f8d7da';
        messageEl.style.color = '#721c24';
        messageEl.style.border = '1px solid #f5c6cb';
        break;
      case 'warning':
        messageEl.style.background = '#fff3cd';
        messageEl.style.color = '#856404';
        messageEl.style.border = '1px solid #ffeaa7';
        break;
      default:
        messageEl.style.background = '#d1ecf1';
        messageEl.style.color = '#0c5460';
        messageEl.style.border = '1px solid #bee5eb';
    }

    document.body.appendChild(messageEl);

    // 3秒后自动移除
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, 3000);
  }

  getContrastColor(hexColor) {
    // 计算对比色
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
`;
document.head.appendChild(style);

// 初始化弹出页面管理器
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});

console.log('Multi Find popup loaded');

