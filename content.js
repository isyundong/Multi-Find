// Multi Find Chrome Extension - Content Script
// 多搜索功能的核心实现

class MultiFindManager {
  constructor() {
    this.searches = new Map(); // 存储所有搜索项
    this.colorClasses = [
      'multi-find-highlight-0', 'multi-find-highlight-1', 'multi-find-highlight-2', 
      'multi-find-highlight-3', 'multi-find-highlight-4', 'multi-find-highlight-5',
      'multi-find-highlight-6', 'multi-find-highlight-7', 'multi-find-highlight-8', 
      'multi-find-highlight-9'
    ]; // 高亮CSS类名
    this.currentColorIndex = 0;
    this.isActive = false;
    this.originalContent = null;
    this.currentMatchIndices = new Map(); // 存储每个关键词的当前匹配索引
    
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
        case 'navigate':
          try {
            const result = this.navigateToMatch(request.keyword, request.direction);
            console.log('Navigate result:', result);
            sendResponse(result);
          } catch (error) {
            console.error('Navigation error:', error);
            sendResponse({ success: false, message: '导航失败' });
          }
          break;
        case 'getMatchInfo':
          try {
            const matchInfo = {};
            for (const [keyword, searchData] of this.searches) {
              const currentIndex = this.currentMatchIndices.get(keyword) || -1;
              matchInfo[keyword] = {
                currentIndex: currentIndex,
                totalMatches: typeof searchData.matchCount === 'number'
                  ? searchData.matchCount
                  : (searchData.matches ? searchData.matches.length : 0)
              };
            }
            sendResponse(matchInfo);
          } catch (error) {
            console.error('Get match info error:', error);
            sendResponse({});
          }
          return true; // 保持消息通道开放
      }
      return true; // 保持消息通道开放，确保异步响应能正确发送
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

    // 修复颜色BUG：使用当前可用的最小颜色索引
    const usedColors = new Set();
    this.searches.forEach(searchData => {
      const colorIndex = this.colorClasses.indexOf(searchData.colorClass);
      if (colorIndex !== -1) {
        usedColors.add(colorIndex);
      }
    });
    
    // 找到第一个未使用的颜色索引
    let colorIndex = 0;
    while (usedColors.has(colorIndex) && colorIndex < this.colorClasses.length) {
      colorIndex++;
    }
    
    const colorClass = this.colorClasses[colorIndex % this.colorClasses.length];
    this.searches.set(keyword, {
      colorClass: colorClass,
      matches: [],
      colorIndex: colorIndex // 记录颜色索引
    });
    this.currentMatchIndices.set(keyword, -1); // 初始化当前匹配索引

    this.updateDisplay();
  }

  removeSearch(keyword) {
    if (this.searches.has(keyword)) {
      this.searches.delete(keyword);
      this.currentMatchIndices.delete(keyword);
      // 修复颜色BUG：不需要重置currentColorIndex，让addSearch自动分配
      this.updateDisplay();
    }
  }

  clearAllSearches() {
    this.searches.clear();
    this.currentMatchIndices.clear();
    // 重置颜色索引
    this.currentColorIndex = 0;
    this.restoreOriginalContent();
  }

  performSearch(keyword) {
    // 搜索逻辑已移到findMatches方法中
    // 这里只需要确保关键词在搜索列表中
    if (!this.searches.has(keyword)) {
      const colorClass = this.colorClasses[this.currentColorIndex % this.colorClasses.length];
      this.searches.set(keyword, {
        colorClass: colorClass,
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
      const matches = this.findMatches(keyword, searchData.colorClass);
      // 先清空之前的匹配数据
      searchData.matches = [];
      // 新增：记录匹配总数，避免 getMatchInfo 在高亮尚未回填时读到 0/0
      searchData.matchCount = matches.length;
      matches.forEach(match => {
        allMatches.push(match);
      });
    });
    
    // 修复4：按DOM顺序排序所有匹配项
    this.sortMatchesByDOMOrder(allMatches);
    
    // ... 后面调用applyHighlights才重新填充searchData.matches
    this.applyHighlights(allMatches);
    
    // 修复：定义并调用自动选中第一个可见的匹配项
    this.selectFirstVisibleMatch();
  }

  // 修复4：新增按DOM顺序排序匹配项的方法
  // 修复DOM排序BUG：改进排序逻辑
  sortMatchesByDOMOrder(matches) {
    matches.sort((a, b) => {
      // 如果是同一个节点，按起始位置排序
      if (a.node === b.node) {
        return a.start - b.start;
      }
      
      // 不同节点，使用compareDocumentPosition
      const comparison = a.node.compareDocumentPosition(b.node);
      if (comparison & Node.DOCUMENT_POSITION_FOLLOWING) {
        return -1; // a在b前面
      } else if (comparison & Node.DOCUMENT_POSITION_PRECEDING) {
        return 1; // a在b后面
      } else if (comparison & Node.DOCUMENT_POSITION_CONTAINS) {
        return 1; // a包含b，a排在后面
      } else if (comparison & Node.DOCUMENT_POSITION_CONTAINED_BY) {
        return -1; // a被b包含，a排在前面
      }
      
      // 如果无法比较，尝试使用元素在DOM中的位置
      const aRect = a.node.getBoundingClientRect ? a.node.getBoundingClientRect() : null;
      const bRect = b.node.getBoundingClientRect ? b.node.getBoundingClientRect() : null;
      
      if (aRect && bRect) {
        // 先按Y坐标排序（从上到下）
        if (Math.abs(aRect.top - bRect.top) > 1) {
          return aRect.top - bRect.top;
        }
        // Y坐标相近，按X坐标排序（从左到右）
        return aRect.left - bRect.left;
      }
      
      return 0;
    });
  }

  // 改进applyHighlights中的排序逻辑
  applyHighlights(matches) {
    // 按匹配类型分组处理
    const textMatches = matches.filter(m => m.type === 'text');
    const formMatches = matches.filter(m => m.type === 'form_value' || m.type === 'form_placeholder');
    const titleMatches = matches.filter(m => m.type === 'title_attribute');
    
    // 处理文本节点匹配（原有逻辑）
    const nodeGroups = new Map();
    textMatches.forEach(match => {
      if (!nodeGroups.has(match.node)) {
        nodeGroups.set(match.node, []);
      }
      nodeGroups.get(match.node).push(match);
    });

    const orderedMatches = [];
    
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
        highlightSpan.className = `multi-find-highlight ${match.colorClass}`;
        highlightSpan.textContent = originalText.substring(match.start, match.end);
        fragment.appendChild(highlightSpan);
        
        // 按DOM顺序添加到有序匹配数组
        orderedMatches.push({
          element: highlightSpan,
          text: originalText.substring(match.start, match.end),
          keyword: match.keyword,
          node: highlightSpan, // 使用新创建的span作为节点引用
          originalNode: textNode
        });
        
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

    // 处理表单元素匹配
    formMatches.forEach(match => {
      const element = match.node;
      if (match.type === 'form_value') {
        element.classList.add('multi-find-form-highlight');
        element.setAttribute('data-multi-find-keyword', match.keyword);
      }
      
      orderedMatches.push({
        element: element,
        text: match.type === 'form_value' ? match.originalValue.substring(match.start, match.end) : match.originalPlaceholder.substring(match.start, match.end),
        keyword: match.keyword,
        node: element,
        type: match.type
      });
    });

    // 处理title属性匹配
    titleMatches.forEach(match => {
      const element = match.node;
      element.classList.add('multi-find-title-highlight');
      element.setAttribute('data-multi-find-keyword', match.keyword);
      
      orderedMatches.push({
        element: element,
        text: match.originalTitle.substring(match.start, match.end),
        keyword: match.keyword,
        node: element,
        type: match.type
      });
    });

    // 修复排序BUG：使用改进的排序逻辑
    orderedMatches.sort((a, b) => {
      // 如果是同一个节点，无需排序
      if (a.node === b.node) {
        return 0;
      }
      
      // 获取元素的位置信息进行排序
      const aRect = a.element.getBoundingClientRect ? a.element.getBoundingClientRect() : null;
      const bRect = b.element.getBoundingClientRect ? b.element.getBoundingClientRect() : null;
      
      if (aRect && bRect) {
        // 先按Y坐标排序（从上到下）
        if (Math.abs(aRect.top - bRect.top) > 1) {
          return aRect.top - bRect.top;
        }
        // Y坐标相近，按X坐标排序（从左到右）
        return aRect.left - bRect.left;
      }
      
      // 回退到DOM位置比较
      const comparison = a.node.compareDocumentPosition ? a.node.compareDocumentPosition(b.node) : 0;
      if (comparison & Node.DOCUMENT_POSITION_FOLLOWING) {
        return -1;
      } else if (comparison & Node.DOCUMENT_POSITION_PRECEDING) {
        return 1;
      }
      return 0;
    });

    // 清空所有关键词的matches数组，重新按DOM顺序填充
    this.searches.forEach((searchData) => {
      searchData.matches = [];
    });

    orderedMatches.forEach((match) => {
      const searchData = this.searches.get(match.keyword);
      if (searchData) {
        searchData.matches.push({
          element: match.element,
          text: match.text,
          type: match.type || 'text'
        });
      }
    });
  }

  // 修复1：导航逻辑
  // 修复导航BUG：改进导航逻辑
  navigateToMatch(keyword, direction) {
    console.log('navigateToMatch called with:', keyword, direction);
    
    if (!this.searches.has(keyword)) {
      console.log('关键词不存在:', keyword);
      return { success: false, message: '关键词不存在' };
    }
    
    const searchData = this.searches.get(keyword);
    const matches = searchData.matches;
    console.log('搜索数据:', searchData);
    console.log('匹配项数量:', matches.length);
    
    if (matches.length === 0) {
      console.log('未找到匹配项，搜索数据:', searchData);
      return { success: false, message: '未找到匹配项' };
    }

    let currentIndex = this.currentMatchIndices.get(keyword);
    
    // 修复导航BUG：正确处理索引逻辑
    if (direction === 'next') {
      if (currentIndex === undefined || currentIndex === -1) {
        currentIndex = 0; // 从第一个开始
      } else {
        currentIndex = (currentIndex + 1) % matches.length; // 循环到下一个
      }
    } else if (direction === 'prev') {
      if (currentIndex === undefined || currentIndex === -1) {
        currentIndex = matches.length - 1; // 从最后一个开始
      } else {
        currentIndex = currentIndex === 0 ? matches.length - 1 : currentIndex - 1; // 循环到上一个
      }
    }
    
    this.currentMatchIndices.set(keyword, currentIndex);
    
    // 滚动到匹配项
    const matchElement = matches[currentIndex].element;
    if (matchElement) {
      matchElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
      
      // 增强当前匹配项高亮
      this.highlightCurrentMatch(matchElement, keyword, currentIndex, matches.length);
    }
    
    return {
      success: true,
      currentIndex: currentIndex,
      totalMatches: matches.length
    };
  }

  // 修复3：优化当前匹配项高亮样式，不自动移除
  highlightCurrentMatch(element, keyword = null, currentIndex = null, totalMatches = null) {
    // 移除之前的当前匹配高亮
    document.querySelectorAll('.multi-find-current-match').forEach(el => {
      el.classList.remove('multi-find-current-match');
    });
    
    // 移除之前的提示框
    document.querySelectorAll('.multi-find-tooltip').forEach(el => {
      el.remove();
    });
    
    // 添加当前匹配高亮（修复3：保持显示，不自动移除）
    element.classList.add('multi-find-current-match');
    
    // 修复2：不再显示提示框，减少干扰
    // if (keyword && currentIndex !== null && totalMatches !== null) {
    //   this.showMatchTooltip(keyword, currentIndex + 1, totalMatches);
    // }
  }
  
  showMatchTooltip(keyword, currentIndex, totalMatches) {
    // 修复2：移除提示框实现，减少干扰
    // 或者可以选择性地保留，但不在navigateToMatch中调用
  }

  // 修复：新增 selectFirstVisibleMatch 方法
  // 修复初始化BUG：改进selectFirstVisibleMatch
  selectFirstVisibleMatch() {
    // 为每个关键词选中第一个匹配项，但不覆盖已有的有效索引
    this.searches.forEach((searchData, keyword) => {
      if (searchData.matches && searchData.matches.length > 0) {
        const currentIndex = this.currentMatchIndices.get(keyword);
        // 只有当前索引无效时才设置为0
        if (currentIndex === undefined || currentIndex === -1 || currentIndex >= searchData.matches.length) {
          this.currentMatchIndices.set(keyword, 0);
        }
      } else {
        // 没有匹配项时重置索引
        this.currentMatchIndices.set(keyword, -1);
      }
    });
  }

  findMatches(keyword, colorClass) {
    const matches = [];
    const regex = new RegExp(this.escapeRegExp(keyword), 'gi');
    
    // 添加可见性检查函数
    const isElementVisible = (element) => {
      if (!element || !element.offsetParent) {
        return false;
      }
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             style.opacity !== '0' &&
             element.offsetWidth > 0 && 
             element.offsetHeight > 0;
    };
    
    // 1. 搜索文本节点
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
          // 检查父元素是否可见
          if (!isElementVisible(parent)) {
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
      regex.lastIndex = 0;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          node: node,
          start: match.index,
          end: match.index + match[0].length,
          keyword: keyword,
          colorClass: colorClass,
          type: 'text'
        });
      }
    }
  
    // 2. 搜索可见的表单元素
    const formElements = document.querySelectorAll('input[type="text"], input[type="search"], input[type="email"], input[type="url"], textarea, input[placeholder]');
    formElements.forEach(element => {
      // 只处理可见的表单元素
      if (!isElementVisible(element)) {
        return;
      }
      
      // 搜索value值
      if (element.value) {
        let match;
        regex.lastIndex = 0;
        while ((match = regex.exec(element.value)) !== null) {
          matches.push({
            node: element,
            start: match.index,
            end: match.index + match[0].length,
            keyword: keyword,
            colorClass: colorClass,
            type: 'form_value',
            originalValue: element.value
          });
        }
      }
      
      // 搜索placeholder值（只有当元素为空且placeholder可见时）
      if (element.placeholder && !element.value) {
        let match;
        regex.lastIndex = 0;
        while ((match = regex.exec(element.placeholder)) !== null) {
          matches.push({
            node: element,
            start: match.index,
            end: match.index + match[0].length,
            keyword: keyword,
            colorClass: colorClass,
            type: 'form_placeholder',
            originalPlaceholder: element.placeholder
          });
        }
      }
    });
  
    // 3. 移除title属性搜索，因为title通常不被Ctrl+F搜索
    // （title属性只在鼠标悬停时显示，不算作页面可见内容）
  
    return matches;
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