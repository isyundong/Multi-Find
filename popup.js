// Multi Find Chrome Extension - Popup Script
// 弹出页面的交互逻辑

class PopupManager {
  constructor() {
    this.searches = [];
    this.isActive = false;
    this.colors = [
      '#ffeb3b', '#ff9800', '#4caf50', '#2196f3', 
      '#9c27b0', '#f44336', '#00bcd4', '#795548'
    ];
    
    this.init();
  }

  async init() {
    // 获取DOM元素
    this.searchInput = document.getElementById('searchInput');
    this.addBtn = document.getElementById('addBtn');
    this.toggleBtn = document.getElementById('toggleBtn');
    this.clearBtn = document.getElementById('clearBtn');
    this.searchesList = document.getElementById('searchesList');

    // 绑定事件
    this.bindEvents();

    // 加载当前状态
    await this.loadCurrentState();
    
    // 更新UI
    this.updateUI();
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

    // 切换搜索状态
    this.toggleBtn.addEventListener('click', () => {
      this.toggleSearch();
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
      this.showMessage('请输入搜索关键词', 'error');
      return;
    }

    if (this.searches.includes(keyword)) {
      this.showMessage('该关键词已存在', 'warning');
      return;
    }

    if (this.searches.length >= 8) {
      this.showMessage('最多支持8个搜索关键词', 'warning');
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
        this.updateUI();
        this.showMessage(`已添加搜索词: ${keyword}`, 'success');
      }
    } catch (error) {
      console.error('添加搜索失败:', error);
      this.showMessage('添加搜索失败，请刷新页面重试', 'error');
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
        this.updateUI();
        this.showMessage(`已移除搜索词: ${keyword}`, 'success');
      }
    } catch (error) {
      console.error('移除搜索失败:', error);
      this.showMessage('移除搜索失败', 'error');
    }
  }

  async toggleSearch() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: 'toggle'
        });
        
        if (response) {
          this.isActive = response.active;
          this.updateToggleButton();
          
          const status = this.isActive ? '已启用' : '已禁用';
          this.showMessage(`多搜索功能${status}`, 'success');
        }
      }
    } catch (error) {
      console.error('切换搜索状态失败:', error);
      this.showMessage('操作失败，请刷新页面重试', 'error');
    }
  }

  async clearAllSearches() {
    if (this.searches.length === 0) {
      this.showMessage('没有搜索词需要清空', 'warning');
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'clearAll'
        });
        
        this.searches = [];
        this.updateUI();
        this.showMessage('已清空所有搜索词', 'success');
      }
    } catch (error) {
      console.error('清空搜索失败:', error);
      this.showMessage('清空失败', 'error');
    }
  }

  updateUI() {
    this.updateSearchesList();
    this.updateAddButtonState();
    this.updateToggleButton();
    this.updateClearButton();
  }

  updateSearchesList() {
    if (this.searches.length === 0) {
      this.searchesList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <div>暂无搜索关键词</div>
          <div>添加关键词开始多搜索</div>
        </div>
      `;
      return;
    }

    const searchesHTML = this.searches.map((keyword, index) => {
      const color = this.colors[index % this.colors.length];
      return `
        <div class="search-item">
          <div class="search-text" style="background-color: ${color}; color: ${this.getContrastColor(color)};">
            ${this.escapeHtml(keyword)}
          </div>
          <button class="remove-btn" data-keyword="${this.escapeHtml(keyword)}">
            移除
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
  }

  updateAddButtonState() {
    const keyword = this.searchInput.value.trim();
    const isDisabled = !keyword || this.searches.includes(keyword) || this.searches.length >= 8;
    
    this.addBtn.disabled = isDisabled;
    
    if (this.searches.length >= 8) {
      this.addBtn.textContent = '已满';
    } else if (this.searches.includes(keyword)) {
      this.addBtn.textContent = '已存在';
    } else {
      this.addBtn.textContent = '添加';
    }
  }

  updateToggleButton() {
    if (this.isActive) {
      this.toggleBtn.textContent = '禁用搜索';
      this.toggleBtn.classList.add('active');
    } else {
      this.toggleBtn.textContent = '启用搜索';
      this.toggleBtn.classList.remove('active');
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