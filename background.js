// Multi Find Chrome Extension - Background Script
// 背景脚本处理插件的后台逻辑

class BackgroundManager {
  constructor() {
    this.init();
  }

  init() {
    // 监听插件安装事件
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstalled(details);
    });

    // 监听来自content script和popup的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // 保持消息通道开放
    });

    // 监听标签页更新事件
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdated(tabId, changeInfo, tab);
    });

    // 监听快捷键命令
    chrome.commands.onCommand.addListener((command) => {
      this.handleCommand(command);
    });
  }

  handleInstalled(details) {
    console.log('Multi Find extension installed:', details);
    
    if (details.reason === 'install') {
      // 首次安装时的处理
      this.showWelcomeNotification();
      this.setDefaultSettings();
    } else if (details.reason === 'update') {
      // 更新时的处理
      console.log('Extension updated to version:', chrome.runtime.getManifest().version);
    }
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'openPopup':
          await this.openPopup(sender.tab);
          sendResponse({ success: true });
          break;
          
        case 'getTabInfo':
          const tabInfo = await this.getTabInfo(sender.tab.id);
          sendResponse({ tabInfo });
          break;
          
        case 'saveSearchData':
          await this.saveSearchData(sender.tab.id, request.data);
          sendResponse({ success: true });
          break;
          
        case 'loadSearchData':
          const searchData = await this.loadSearchData(sender.tab.id);
          sendResponse({ searchData });
          break;
          
        case 'clearSearchData':
          await this.clearSearchData(sender.tab.id);
          sendResponse({ success: true });
          break;
          
        default:
          console.log('Unknown action:', request.action);
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }
  }

  handleTabUpdated(tabId, changeInfo, tab) {
    // 当标签页完成加载时，清理该标签页的搜索数据
    if (changeInfo.status === 'complete' && tab.url) {
      // 如果是新的URL，清理旧的搜索数据
      this.cleanupTabData(tabId);
    }
  }

  async handleCommand(command) {
    try {
      switch (command) {
        case 'toggle-multi-find':
          // 快捷键打开/切换多搜索
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (activeTab) {
            // 发送消息给content script切换多搜索状态
            await chrome.tabs.sendMessage(activeTab.id, { action: 'toggleMultiFind' });
          }
          break;
          
        default:
          console.log('Unknown command:', command);
      }
    } catch (error) {
      console.error('Error handling command:', error);
    }
  }

  async openPopup(tab) {
    try {
      // 尝试打开popup
      await chrome.action.openPopup();
    } catch (error) {
      // 如果无法打开popup，可能是因为用户交互限制
      console.log('Cannot open popup programmatically:', error);
      
      // 可以考虑显示通知提示用户手动点击插件图标
      this.showNotification(
        'Multi Find',
        '请点击浏览器工具栏中的 Multi Find 图标来打开搜索面板',
        'info'
      );
    }
  }

  async getTabInfo(tabId) {
    try {
      const tab = await chrome.tabs.get(tabId);
      return {
        id: tab.id,
        url: tab.url,
        title: tab.title,
        active: tab.active
      };
    } catch (error) {
      console.error('Error getting tab info:', error);
      return null;
    }
  }

  async saveSearchData(tabId, data) {
    try {
      const key = `searchData_${tabId}`;
      await chrome.storage.local.set({ [key]: data });
      console.log('Search data saved for tab:', tabId);
    } catch (error) {
      console.error('Error saving search data:', error);
      throw error;
    }
  }

  async loadSearchData(tabId) {
    try {
      const key = `searchData_${tabId}`;
      const result = await chrome.storage.local.get([key]);
      return result[key] || null;
    } catch (error) {
      console.error('Error loading search data:', error);
      return null;
    }
  }

  async clearSearchData(tabId) {
    try {
      const key = `searchData_${tabId}`;
      await chrome.storage.local.remove([key]);
      console.log('Search data cleared for tab:', tabId);
    } catch (error) {
      console.error('Error clearing search data:', error);
      throw error;
    }
  }

  async cleanupTabData(tabId) {
    // 清理标签页相关的数据
    try {
      await this.clearSearchData(tabId);
    } catch (error) {
      console.error('Error cleaning up tab data:', error);
    }
  }

  async setDefaultSettings() {
    try {
      const defaultSettings = {
        maxSearchTerms: 8,
        highlightColors: [
          '#ffeb3b', '#ff9800', '#4caf50', '#2196f3', 
          '#9c27b0', '#f44336', '#00bcd4', '#795548'
        ],
        autoSave: true,
        caseSensitive: false,
        wholeWords: false
      };
      
      await chrome.storage.sync.set({ settings: defaultSettings });
      console.log('Default settings saved');
    } catch (error) {
      console.error('Error setting default settings:', error);
    }
  }

  showWelcomeNotification() {
    this.showNotification(
      'Multi Find 已安装',
      '使用 Ctrl+Shift+F 快速打开多搜索功能，或点击工具栏图标开始使用！',
      'info'
    );
  }

  showNotification(title, message, type = 'info') {
    // 创建通知
    const notificationOptions = {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: title,
      message: message
    };

    try {
      chrome.notifications.create('', notificationOptions, (notificationId) => {
        if (chrome.runtime.lastError) {
          console.error('Notification error:', chrome.runtime.lastError);
        } else {
          console.log('Notification created:', notificationId);
          
          // 5秒后自动清除通知
          setTimeout(() => {
            chrome.notifications.clear(notificationId);
          }, 5000);
        }
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  // 清理存储中的过期数据
  async cleanupStorage() {
    try {
      const allData = await chrome.storage.local.get();
      const currentTime = Date.now();
      const oneWeekAgo = currentTime - (7 * 24 * 60 * 60 * 1000); // 一周前
      
      const keysToRemove = [];
      
      for (const key in allData) {
        if (key.startsWith('searchData_')) {
          const data = allData[key];
          if (data.timestamp && data.timestamp < oneWeekAgo) {
            keysToRemove.push(key);
          }
        }
      }
      
      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
        console.log('Cleaned up expired data:', keysToRemove.length, 'items');
      }
    } catch (error) {
      console.error('Error cleaning up storage:', error);
    }
  }
}

// 初始化背景管理器
const backgroundManager = new BackgroundManager();

// 定期清理存储（每天一次）
setInterval(() => {
  backgroundManager.cleanupStorage();
}, 24 * 60 * 60 * 1000);

console.log('Multi Find background script loaded');

// 导出到全局作用域供调试使用
if (typeof globalThis !== 'undefined') {
  globalThis.backgroundManager = backgroundManager;
}