// Multi Find Chrome Extension - Content Script
// 多搜索功能的核心实现

class MultiFindManager {
  constructor() {
    this.searches = new Map(); // 存储所有搜索项
    this.colors = [
      '#ffeb3b', '#ff9800', '#4caf50', '#2196f3', 
      '#9c27b0', '#f44336', '#00bcd4', '#795548'
    ]; // 高亮颜色
    this.currentColorIndex = 0;
    this.isActive = false;
    this.originalContent = null;
    
    this.init();
  }

  init() {
    // 监听来自popup的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'addSearch':
          this.addSearch(request.keyword);
          sendResponse({ success: true });
          break;
        case 'removeSearch':
          this.removeSearch(request.keyword);
          sendResponse({ success: true });
          break;
        case 'clearAll':
          this.clearAllSearches();
          sendResponse({ success: true });
          break;
        case 'getSearches':
          sendResponse({ searches: Array.from(this.searches.keys()) });
          break;
        case 'toggle':
          this.toggle();
          sendResponse({ success: true, active: this.isActive });
          break;
        case 'toggleMultiFind':
          this.toggle();
          sendResponse({ success: true, active: this.isActive });
          break;
      }
    });

    // 监听键盘快捷键
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+F 打开多搜索
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        this.openPopup();
      }
    });
  }

  addSearch(keyword) {
    if (!keyword || this.searches.has(keyword)) return;

    const color = this.colors[this.currentColorIndex % this.colors.length];
    this.searches.set(keyword, {
      color: color,
      matches: []
    });
    this.currentColorIndex++;

    this.updateDisplay();
  }

  removeSearch(keyword) {
    if (this.searches.has(keyword)) {
      this.searches.delete(keyword);
      this.updateDisplay();
    }
  }

  clearAllSearches() {
    this.searches.clear();
    this.currentColorIndex = 0;
    this.restoreOriginalContent();
  }

  performSearch(keyword) {
    // 搜索逻辑已移到findMatches方法中
    // 这里只需要确保关键词在搜索列表中
    if (!this.searches.has(keyword)) {
      const color = this.colors[this.currentColorIndex % this.colors.length];
      this.searches.set(keyword, {
        color: color,
        matches: []
      });
      this.currentColorIndex++;
    }
  }

  updateDisplay() {
    // 先恢复原始内容
    this.restoreOriginalContent();

    if (this.searches.size === 0) return;

    // 保存原始内容（如果还没保存）
    if (!this.originalContent) {
      this.originalContent = document.body.innerHTML;
    }

    // 重新执行所有搜索以获取最新的DOM节点引用
    const allMatches = [];
    this.searches.forEach((searchData, keyword) => {
      const matches = this.findMatches(keyword, searchData.color);
      matches.forEach(match => {
        allMatches.push(match);
      });
    });

    // 按文档位置排序
    allMatches.sort((a, b) => {
      const position = a.node.compareDocumentPosition(b.node);
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return a.start - b.start;
    });

    // 应用高亮
    this.applyHighlights(allMatches);
  }

  findMatches(keyword, color) {
    const matches = [];
    const regex = new RegExp(this.escapeRegExp(keyword), 'gi');
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // 跳过script、style等标签内的文本
          const parent = node.parentElement;
          if (parent && ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      },
      false
    );

    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent;
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          node: node,
          start: match.index,
          end: match.index + match[0].length,
          keyword: keyword,
          color: color
        });
      }
    }

    return matches;
  }

  applyHighlights(matches) {
    // 按文本节点分组
    const nodeGroups = new Map();
    matches.forEach(match => {
      if (!nodeGroups.has(match.node)) {
        nodeGroups.set(match.node, []);
      }
      nodeGroups.get(match.node).push(match);
    });

    // 为每个文本节点应用高亮
    nodeGroups.forEach((nodeMatches, textNode) => {
      // 检查节点是否仍然存在于DOM中
      if (!textNode || !textNode.parentNode || !document.contains(textNode)) {
        return;
      }

      // 按起始位置正序排序，从前往后处理
      nodeMatches.sort((a, b) => a.start - b.start);
      
      const parentNode = textNode.parentNode;
      const originalText = textNode.textContent;
      let currentOffset = 0;
      
      // 创建文档片段来存储新的节点
      const fragment = document.createDocumentFragment();
      
      nodeMatches.forEach((match, index) => {
        // 添加匹配前的文本
        if (match.start > currentOffset) {
          const beforeText = originalText.substring(currentOffset, match.start);
          if (beforeText) {
            fragment.appendChild(document.createTextNode(beforeText));
          }
        }
        
        // 创建高亮元素
        const highlightSpan = document.createElement('span');
        highlightSpan.className = 'multi-find-highlight';
        highlightSpan.style.backgroundColor = match.color;
        highlightSpan.style.padding = '1px 2px';
        highlightSpan.style.borderRadius = '2px';
        highlightSpan.style.fontWeight = 'bold';
        highlightSpan.textContent = originalText.substring(match.start, match.end);
        fragment.appendChild(highlightSpan);
        
        currentOffset = match.end;
      });
      
      // 添加最后剩余的文本
      if (currentOffset < originalText.length) {
        const remainingText = originalText.substring(currentOffset);
        if (remainingText) {
          fragment.appendChild(document.createTextNode(remainingText));
        }
      }
      
      // 安全地替换原始文本节点
      try {
        parentNode.replaceChild(fragment, textNode);
      } catch (error) {
        console.warn('Failed to replace text node:', error);
      }
    });
  }

  restoreOriginalContent() {
    if (this.originalContent) {
      try {
        // 移除所有高亮元素
        const highlights = document.querySelectorAll('.multi-find-highlight');
        highlights.forEach(highlight => {
          const parent = highlight.parentNode;
          if (parent) {
            // 用文本节点替换高亮元素
            const textNode = document.createTextNode(highlight.textContent);
            parent.replaceChild(textNode, highlight);
          }
        });
        
        // 合并相邻的文本节点
        this.normalizeTextNodes(document.body);
      } catch (error) {
        console.warn('Failed to restore content, falling back to innerHTML:', error);
        // 如果上述方法失败，回退到innerHTML方法
        document.body.innerHTML = this.originalContent;
      }
    }
  }

  normalizeTextNodes(element) {
    // 合并相邻的文本节点
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    
    textNodes.forEach(textNode => {
      if (textNode.parentNode) {
        textNode.parentNode.normalize();
      }
    });
  }

  toggle() {
    this.isActive = !this.isActive;
    if (this.isActive) {
      this.updateDisplay();
    } else {
      this.restoreOriginalContent();
    }
  }

  openPopup() {
    // 发送消息给background script打开popup
    chrome.runtime.sendMessage({ action: 'openPopup' });
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// 初始化多搜索管理器
const multiFindManager = new MultiFindManager();

// 导出到全局作用域供调试使用
window.multiFindManager = multiFindManager;

console.log('Multi Find extension loaded');