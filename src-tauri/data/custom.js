(function() {
    'use strict';
    
    // ==================== 配置管理模块 ====================
    class ConfigManager {
        constructor() {
            this.storagePrefix = 'xiaohongshu_auto_card_';
            this.defaultConfig = {
                enabled: true,
                autoInterval: 5000, // 5秒检查一次红点
                maxRetries: 3,
                debug: true,
                notifications: true,
                randomDelay: true, // 是否启用随机延迟
                minDelay: 1000,
                maxDelay: 3000,
                cardSelection: 'random', // 'random' or 'manual'
                selectedCardIndex: 0, // 手动选择的名片索引
                sentCount: 0 // 已发送名片次数
            };
        }
        
        getConfig(key) {
            try {
                const value = localStorage.getItem(this.storagePrefix + key);
                if (value !== null) {
                    return JSON.parse(value);
                }
                return this.defaultConfig[key];
            } catch (error) {
                console.error('读取配置失败:', error);
                return this.defaultConfig[key];
            }
        }
        
        setConfig(key, value) {
            try {
                localStorage.setItem(this.storagePrefix + key, JSON.stringify(value));
            } catch (error) {
                console.error('保存配置失败:', error);
            }
        }
        
        resetConfig() {
            try {
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith(this.storagePrefix)) {
                        localStorage.removeItem(key);
                    }
                });
            } catch (error) {
                console.error('重置配置失败:', error);
            }
        }
    }
    
    // ==================== 日志管理模块 ====================
    class Logger {
        constructor(debug = false) {
            this.debug = debug;
            this.prefix = '[小红书自动发名片]';
        }
        
        log(message, ...args) {
            if (this.debug) {
                console.log(`${this.prefix} ${message}`, ...args);
            }
        }
        
        error(message, ...args) {
            console.error(`${this.prefix} ERROR: ${message}`, ...args);
        }
        
        warn(message, ...args) {
            console.warn(`${this.prefix} WARN: ${message}`, ...args);
        }
        
        info(message, ...args) {
            console.info(`${this.prefix} INFO: ${message}`, ...args);
        }
    }
    
    // ==================== 通知管理模块 ====================
    class NotificationManager {
        constructor(enabled = true) {
            this.enabled = enabled;
            this.checkPermission();
        }
        
        async checkPermission() {
            if (!('Notification' in window)) {
                console.warn('此浏览器不支持桌面通知');
                this.enabled = false;
                return;
            }
            
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    this.enabled = false;
                }
            } else if (Notification.permission === 'denied') {
                this.enabled = false;
            }
        }
        
        show(title, message, type = 'info') {
            if (!this.enabled || Notification.permission !== 'granted') {
                console.log(`通知: ${title} - ${message}`);
                return;
            }
            
            try {
                const notification = new Notification(title, {
                    body: message,
                    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyUzYuNDggMjIgMTIgMjIgMjIgMTcuNTIgMjIgMTJTMTcuNTIgMiAxMiAyWk0xMiAyMEM3LjU5IDIwIDQgMTYuNDEgNCAxMlM3LjU5IDQgMTIgNFMyMCA3LjU5IDIwIDEyUzE2LjQxIDIwIDEyIDIwWiIgZmlsbD0iIzMzNzNkYyIvPgo8L3N2Zz4K'
                });
                
                setTimeout(() => {
                    notification.close();
                }, 3000);
            } catch (error) {
                console.error('通知显示失败:', error);
            }
        }
        
        success(message) {
            this.show('成功', message, 'success');
        }
        
        error(message) {
            this.show('错误', message, 'error');
        }
        
        warning(message) {
            this.show('警告', message, 'warning');
        }
        
        info(message) {
            this.show('信息', message, 'info');
        }
    }
    
    // ==================== 工具函数模块 ====================
    class Utils {
        static sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        
        static waitForElement(selector, timeout = 10000) {
            return new Promise((resolve, reject) => {
                const startTime = Date.now();
                
                const checkElement = () => {
                    const element = document.querySelector(selector);
                    if (element) {
                        resolve(element);
                        return;
                    }
                    
                    if (Date.now() - startTime > timeout) {
                        reject(new Error(`Element ${selector} not found within timeout`));
                        return;
                    }
                    
                    setTimeout(checkElement, 100);
                };
                
                checkElement();
            });
        }
        
        static getRandomDelay(min = 1000, max = 3000) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        
        static formatTime(date = new Date()) {
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
        
        static safeClick(element) {
            if (!element) {
                throw new Error('元素不存在，无法点击');
            }
            
            try {
                // 尝试直接点击
                element.click();
                return true;
            } catch (error) {
                // 如果直接点击失败，尝试使用事件分发
                try {
                    const clickEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true
                    });
                    element.dispatchEvent(clickEvent);
                    return true;
                } catch (eventError) {
                    // 如果事件分发也失败，使用最基本的方式
                    try {
                        element.dispatchEvent(new Event('click', {bubbles: true}));
                        return true;
                    } catch (basicError) {
                        throw new Error(`点击失败: ${basicError.message}`);
                    }
                }
            }
        }
    }
    
    // ==================== 页面检测模块 ====================
    class PageDetector {
        constructor() {
            this.targetUrlPattern = /^https:\/\/pro\.xiaohongshu\.com\/im\/multiCustomerService/;
        }
        
        detectCurrentPage() {
            const url = window.location.href;
            
            // 检测小红书专业版多客服页面
            if (this.targetUrlPattern.test(url)) {
                return 'multiCustomerService';
            }
            
            return 'unknown';
        }
        
        isTargetPage() {
            return this.detectCurrentPage() === 'multiCustomerService';
        }
        
        isTargetUrl() {
            return this.targetUrlPattern.test(window.location.href);
        }
    }
    
    // ==================== 名片操作模块 ====================
    class CardOperations {
        constructor(logger, notificationManager, uiManager = null, configManager = null) {
            this.logger = logger;
            this.notification = notificationManager;
            this.ui = uiManager;
            this.config = configManager;
            this.isRunning = false;
            this.retryCount = 0;
            this.maxRetries = 3;
        }
        
        setUIManager(uiManager) {
            this.ui = uiManager;
        }
        
        setConfigManager(configManager) {
            this.config = configManager;
        }
        
        async autoSendCard() {
            if (this.isRunning) {
                this.logger.warn('自动发名片已在运行中');
                this.ui && this.ui.updateStatus('运行中...');
                return;
            }
            
            this.isRunning = true;
            this.logger.info('开始自动发名片');
            this.ui && this.ui.updateStatus('正在发送名片...');
            
            try {
                await this.performCardAction();
                
                this.ui && this.ui.updateStatus('发送成功');
                this.ui && this.ui.updateSentCount();
                this.retryCount = 0;
            } catch (error) {
                this.logger.error('自动发名片失败:', error);
                this.ui && this.ui.updateStatus(`发送失败: ${error.message}`);
                this.handleError(error);
            } finally {
                this.isRunning = false;
            }
        }
        
        async performCardAction() {
            this.logger.log('开始执行自动发名片操作...');
            
            // 步骤1: 检查是否有红点（未回复消息）
            const redDots = document.querySelectorAll("div.item-main > div.item-avatar > span > span");
            if (redDots.length === 0) {
                this.logger.log('未找到红点元素，暂无未回复消息');
                return;
            }
            
            this.logger.log(`发现 ${redDots.length} 个未回复消息，开始处理第一个`);
            
            // 步骤2: 点击第一个红点对应的头像
            const firstAvatar = redDots[0].parentElement;
            if (!firstAvatar) {
                throw new Error('无法找到头像元素');
            }
            
            this.logger.log('点击头像...');
            Utils.safeClick(firstAvatar);
            await Utils.sleep(Utils.getRandomDelay(1000, 2000));
            
            // 步骤3: 点击获客工具
            this.logger.log('查找获客工具按钮...');
            const customerToolSvg = document.querySelector("#replyBox > div.reply-box > div.tool-list > div > div:nth-child(6) > svg");
            if (!customerToolSvg) {
                throw new Error('未找到获客工具按钮');
            }
            
            this.logger.log('点击获客工具...');
            Utils.safeClick(customerToolSvg);
            await Utils.sleep(Utils.getRandomDelay(1000, 2000));
            
            // 步骤4: 点击名片tab
            this.logger.log('查找名片tab...');
            const cardTab = document.querySelector("#rightPanel > div.right-side.right-side_pro > div > div.tabs > div.d-segment > div > div:nth-child(2)");
            if (!cardTab) {
                throw new Error('未找到名片tab');
            }
            
            this.logger.log('点击名片tab...');
            Utils.safeClick(cardTab);
            await Utils.sleep(Utils.getRandomDelay(1000, 2000));
            
            // 步骤5: 选择名片发送
            this.logger.log('查找名片列表...');
            const cardContainer = document.querySelector("#rightPanel > div.right-side.right-side_pro > div > div.page-container > div:nth-child(2) > div");
            if (!cardContainer || cardContainer.children.length === 0) {
                throw new Error('未找到名片列表或名片列表为空');
            }
            
            // 根据配置选择名片
            const cardSelection = this.config.getConfig('cardSelection');
            let selectedIndex;
            let selectedCard;
            
            if (cardSelection === 'manual') {
                selectedIndex = this.config.getConfig('selectedCardIndex');
                if (selectedIndex >= cardContainer.children.length) {
                    selectedIndex = 0; // 如果指定的索引超出范围，回到第一个
                }
                selectedCard = cardContainer.children[selectedIndex];
                this.logger.log(`手动选择第 ${selectedIndex + 1} 个名片（共 ${cardContainer.children.length} 个）`);
            } else {
                // 随机选择
                selectedIndex = Math.floor(Math.random() * cardContainer.children.length);
                selectedCard = cardContainer.children[selectedIndex];
                this.logger.log(`随机选择第 ${selectedIndex + 1} 个名片（共 ${cardContainer.children.length} 个）`);
            }
            
            // 找到发送按钮并点击
            const sendButton = selectedCard.children[0].children[0].children[0].children[1];
            if (!sendButton) {
                throw new Error('未找到发送按钮');
            }
            
            this.logger.log('点击发送按钮...');
            Utils.safeClick(sendButton);
            await Utils.sleep(Utils.getRandomDelay(500, 1000));
            
            // 增加发送计数
            const currentCount = this.config.getConfig('sentCount') || 0;
            this.config.setConfig('sentCount', currentCount + 1);
            
            this.logger.log('自动发名片操作完成');
        }
        
        getCardList() {
            const cardContainer = document.querySelector("#rightPanel > div.right-side.right-side_pro > div > div.page-container > div:nth-child(2) > div");
            if (!cardContainer || cardContainer.children.length === 0) {
                return [];
            }
            
            const cards = [];
            for (let i = 0; i < cardContainer.children.length; i++) {
                const card = cardContainer.children[i];
                try {
                    // 尝试获取名片的文本内容
                    const cardText = card.textContent || card.innerText || `名片${i + 1}`;
                    cards.push({
                        index: i,
                        text: cardText.trim().substring(0, 50) // 限制文本长度
                    });
                } catch (error) {
                    cards.push({
                        index: i,
                        text: `名片${i + 1}`
                    });
                }
            }
            
            return cards;
        }
        
        handleError(error) {
            this.retryCount++;
            
            if (this.retryCount <= this.maxRetries) {
                this.logger.warn(`发名片失败，将进行第${this.retryCount}次重试`);
                this.notification.warning(`发名片失败，正在重试 (${this.retryCount}/${this.maxRetries})`);
                
                setTimeout(() => {
                    this.autoSendCard();
                }, Utils.getRandomDelay(3000, 5000));
            } else {
                this.logger.error('达到最大重试次数，停止自动发名片');
                this.notification.error('自动发名片失败，请检查页面状态');
                this.retryCount = 0;
            }
        }
    }
    
    // ==================== UI界面模块 ====================
    class UIManager {
        constructor(configManager, cardOperations) {
            this.config = configManager;
            this.cardOps = cardOperations;
            this.panel = null;
            this.logger = new Logger(configManager.getConfig('debug'));
        }
        
        createControlPanel() {
            this.logger.log('创建控制面板...');
            
            // 检查是否已存在面板
            const existingPanel = document.getElementById('xiaohongshu-auto-card-panel');
            if (existingPanel) {
                existingPanel.remove();
            }
            
            // 创建控制面板容器
            this.panel = document.createElement('div');
            this.panel.id = 'xiaohongshu-auto-card-panel';
            this.panel.innerHTML = `
                <div style="
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    width: 350px;
                    background: #fff;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    z-index: 9999;
                    font-family: Arial, sans-serif;
                    font-size: 14px;
                ">
                    <div style="
                        background: #f5f5f5;
                        padding: 10px;
                        border-bottom: 1px solid #ddd;
                        border-radius: 8px 8px 0 0;
                        font-weight: bold;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <span>极光小红书自动发名片</span>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span id="sentCountDisplay" style="font-size: 12px; color: #666;">
                                已发送: ${this.config.getConfig('sentCount') || 0}
                            </span>
                            <button id="togglePanel" style="
                                background: #666;
                                color: white;
                                border: none;
                                padding: 4px 8px;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                            ">最小化</button>
                        </div>
                    </div>
                    <div id="panelContent" style="padding: 15px;">
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px;">
                                <input type="checkbox" id="autoEnabled" ${this.config.getConfig('enabled') ? 'checked' : ''}> 
                                启用自动发名片
                            </label>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px;">
                                检查间隔（秒）：
                                <input type="number" id="autoInterval" value="${this.config.getConfig('autoInterval') / 1000}" 
                                       min="1" max="60" style="width: 60px; margin-left: 5px;">
                            </label>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px;">
                                名片选择模式：
                                <select id="cardSelection" style="margin-left: 5px;">
                                    <option value="random" ${this.config.getConfig('cardSelection') === 'random' ? 'selected' : ''}>随机选择</option>
                                    <option value="manual" ${this.config.getConfig('cardSelection') === 'manual' ? 'selected' : ''}>手动指定</option>
                                </select>
                            </label>
                        </div>
                        <div id="cardListContainer" style="margin-bottom: 10px; display: ${this.config.getConfig('cardSelection') === 'manual' ? 'block' : 'none'};">
                            <label style="display: block; margin-bottom: 5px;">选择名片：</label>
                            <select id="cardList" style="width: 100%; margin-bottom: 5px;">
                                <option value="0">请先刷新名片列表</option>
                            </select>
                            <button id="refreshCardList" style="
                                background: #1890ff;
                                color: white;
                                border: none;
                                padding: 4px 8px;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                            ">刷新名片列表</button>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <button id="manualSend" style="
                                background: #ff2442;
                                color: white;
                                border: none;
                                padding: 8px 16px;
                                border-radius: 4px;
                                cursor: pointer;
                                margin-right: 10px;
                            ">手动发送</button>
                            <button id="resetCount" style="
                                background: #f5222d;
                                color: white;
                                border: none;
                                padding: 8px 16px;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                            ">重置计数</button>
                        </div>
                        <div id="statusDisplay" style="
                            background: #f9f9f9;
                            padding: 8px;
                            border-radius: 4px;
                            font-size: 12px;
                            color: #666;
                        ">
                            状态：等待中...
                        </div>
                    </div>
                </div>
            `;
            
            // 添加到页面
            document.body.appendChild(this.panel);
            
            // 绑定事件
            this.bindEvents();
            
            this.logger.log('控制面板创建完成');
        }
        
        bindEvents() {
            // 启用/禁用自动发名片
            const enabledCheckbox = document.getElementById('autoEnabled');
            if (enabledCheckbox) {
                enabledCheckbox.addEventListener('change', (e) => {
                    this.config.setConfig('enabled', e.target.checked);
                    this.logger.log(`自动发名片已${e.target.checked ? '启用' : '禁用'}`);
                    // 重新启动自动模式以应用配置变更
                    if (this.mainApp) {
                        setTimeout(() => {
                            this.mainApp.startAutoMode();
                        }, 100);
                    }
                });
            }
            
            // 修改检查间隔
            const intervalInput = document.getElementById('autoInterval');
            if (intervalInput) {
                intervalInput.addEventListener('change', (e) => {
                    const newInterval = parseInt(e.target.value) * 1000;
                    this.config.setConfig('autoInterval', newInterval);
                    this.logger.log(`检查间隔已修改为 ${e.target.value} 秒`);
                    // 重新启动自动模式以应用新的间隔
                    if (this.mainApp && this.config.getConfig('enabled')) {
                        setTimeout(() => {
                            this.mainApp.startAutoMode();
                        }, 100);
                    }
                });
            }
            
            // 名片选择模式
            const cardSelectionSelect = document.getElementById('cardSelection');
            if (cardSelectionSelect) {
                cardSelectionSelect.addEventListener('change', (e) => {
                    this.config.setConfig('cardSelection', e.target.value);
                    this.logger.log(`名片选择模式已修改为 ${e.target.value === 'random' ? '随机选择' : '手动指定'}`);
                    
                    // 显示/隐藏名片列表
                    const cardListContainer = document.getElementById('cardListContainer');
                    if (cardListContainer) {
                        cardListContainer.style.display = e.target.value === 'manual' ? 'block' : 'none';
                    }
                });
            }
            
            // 名片列表选择
            const cardListSelect = document.getElementById('cardList');
            if (cardListSelect) {
                cardListSelect.addEventListener('change', (e) => {
                    this.config.setConfig('selectedCardIndex', parseInt(e.target.value));
                    this.logger.log(`已选择第 ${parseInt(e.target.value) + 1} 个名片`);
                });
            }
            
            // 刷新名片列表
            const refreshCardListBtn = document.getElementById('refreshCardList');
            if (refreshCardListBtn) {
                refreshCardListBtn.addEventListener('click', () => {
                    this.refreshCardList();
                });
            }
            
            // 手动发送按钮
            const manualSendBtn = document.getElementById('manualSend');
            if (manualSendBtn) {
                manualSendBtn.addEventListener('click', () => {
                    this.cardOps.autoSendCard();
                });
            }
            
            // 重置计数按钮
            const resetCountBtn = document.getElementById('resetCount');
            if (resetCountBtn) {
                resetCountBtn.addEventListener('click', () => {
                    this.config.setConfig('sentCount', 0);
                    this.updateSentCount();
                    this.logger.log('已重置发送计数');
                });
            }
            
            // 最小化按钮
            const toggleBtn = document.getElementById('togglePanel');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    const content = document.getElementById('panelContent');
                    if (content) {
                        const isCurrentlyVisible = content.style.display !== 'none';
                        
                        if (isCurrentlyVisible) {
                            content.style.display = 'none';
                            toggleBtn.textContent = '展开';
                        } else {
                            content.style.display = 'block';
                            toggleBtn.textContent = '最小化';
                        }
                    }
                });
            }
        }
        
        refreshCardList() {
            const cardList = this.cardOps.getCardList();
            const cardListSelect = document.getElementById('cardList');
            
            // 清空现有选项
            cardListSelect.innerHTML = '';
            
            if (cardList.length === 0) {
                cardListSelect.innerHTML = '<option value="0">未找到名片或需要先打开名片页面</option>';
                return;
            }
            
            // 添加新选项
            cardList.forEach(card => {
                const option = document.createElement('option');
                option.value = card.index;
                option.textContent = `${card.index + 1}. ${card.text}`;
                if (card.index === this.config.getConfig('selectedCardIndex')) {
                    option.selected = true;
                }
                cardListSelect.appendChild(option);
            });
            
            this.logger.log(`已刷新名片列表，共 ${cardList.length} 个名片`);
        }
        
        updateSentCount() {
            const sentCountDisplay = document.getElementById('sentCountDisplay');
            if (sentCountDisplay) {
                const count = this.config.getConfig('sentCount') || 0;
                sentCountDisplay.textContent = `已发送: ${count}`;
            }
        }
        
        showPanel() {
            if (this.panel) {
                this.panel.style.display = 'block';
            }
        }
        
        hidePanel() {
            if (this.panel) {
                this.panel.style.display = 'none';
            }
        }
        
        updateStatus(status) {
            this.logger.log('更新状态:', status);
            const statusDisplay = document.getElementById('statusDisplay');
            if (statusDisplay) {
                const timestamp = Utils.formatTime();
                statusDisplay.textContent = `状态：${status} (${timestamp})`;
            }
        }
        
        destroy() {
            if (this.panel) {
                this.panel.remove();
                this.panel = null;
            }
        }
    }
    
    // ==================== 主应用模块 ====================
    class JuguangAutoCard {
        constructor() {
            this.config = new ConfigManager();
            this.logger = new Logger(this.config.getConfig('debug'));
            this.notification = new NotificationManager(this.config.getConfig('notifications'));
            this.pageDetector = new PageDetector();
            this.cardOps = new CardOperations(this.logger, this.notification, null, this.config);
            this.ui = null;
            
            this.isInitialized = false;
            this.intervalId = null;
            this.urlCheckInterval = null;
        }
        
        async init() {
            if (this.isInitialized) {
                this.logger.warn('应用已经初始化');
                return;
            }
            
            this.logger.info('初始化小红书专业版自动发名片脚本...');
            
            try {
                await this.waitForPageLoad();
                await this.setupUI();
                await this.startAutoMode();
                
                this.isInitialized = true;
                this.logger.info('脚本初始化完成');
                this.notification.success('小红书专业版自动发名片脚本已启动');
            } catch (error) {
                this.logger.error('初始化失败:', error);
                this.notification.error('脚本初始化失败');
            }
        }
        
        async waitForPageLoad() {
            return new Promise((resolve) => {
                if (document.readyState === 'complete') {
                    resolve();
                } else {
                    window.addEventListener('load', resolve);
                }
            });
        }
        
        async setupUI() {
            this.ui = new UIManager(this.config, this.cardOps);
            this.cardOps.setUIManager(this.ui);
            this.ui.mainApp = this;
            
            this.ui.createControlPanel();
            this.logger.log('UI设置完成');
        }
        
        async startAutoMode() {
            // 先停止之前的定时器
            this.stop();
            
            const enabled = this.config.getConfig('enabled');
            this.logger.log(`检查自动模式状态: ${enabled ? '启用' : '禁用'}`);
            
            if (!enabled) {
                this.logger.log('自动模式已禁用');
                this.ui && this.ui.updateStatus('自动模式已禁用');
                return;
            }
            
            if (!this.pageDetector.isTargetPage()) {
                this.logger.log('当前页面不是目标页面，跳过自动模式');
                this.ui && this.ui.updateStatus('当前页面不是目标页面');
                return;
            }
            
            const interval = this.config.getConfig('autoInterval');
            this.intervalId = setInterval(() => {
                // 每次执行前再次检查是否启用和是否在目标页面
                if (this.config.getConfig('enabled') && this.pageDetector.isTargetPage()) {
                    this.cardOps.autoSendCard();
                } else if (!this.pageDetector.isTargetPage()) {
                    this.logger.log('页面已跳转，停止自动模式');
                    this.stop();
                } else {
                    this.logger.log('检测到自动模式被禁用，停止定时器');
                    this.stop();
                }
            }, interval);
            
            this.logger.info(`自动模式已启动，间隔: ${interval}ms`);
            this.ui && this.ui.updateStatus(`自动模式运行中 (${interval/1000}s间隔)`);
        }
        
        stop() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
            
            this.logger.info('脚本已停止');
            this.ui && this.ui.updateStatus('已停止');
        }
        
        destroy() {
            this.stop();
            if (this.urlCheckInterval) {
                clearInterval(this.urlCheckInterval);
                this.urlCheckInterval = null;
            }
            if (this.ui) {
                this.ui.destroy();
                this.ui = null;
            }
            this.isInitialized = false;
            this.logger.info('脚本已销毁');
        }
        
        restart() {
            this.destroy();
            setTimeout(() => {
                this.init();
            }, 1000);
        }
    }
    
    // ==================== URL监听器 ====================
    class URLWatcher {
        constructor() {
            this.pageDetector = new PageDetector();
            this.app = null;
            this.logger = new Logger(true);
            this.currentUrl = window.location.href;
            this.checkInterval = null;
        }
        
        start() {
            this.logger.info('开始URL监听...');
            
            // 立即检查当前URL
            this.checkURL();
            
            // 定期检查URL变化（处理SPA路由）
            this.checkInterval = setInterval(() => {
                this.checkURL();
            }, 1000); // 每秒检查一次
            
            // 监听popstate事件（浏览器前进后退）
            window.addEventListener('popstate', () => {
                setTimeout(() => URLWatcher.instance.checkURL(), 100);
            });
            
            // 监听pushstate和replacestate（程序化导航）
            this.overrideHistoryMethods();
        }
        
        overrideHistoryMethods() {
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;
            
            history.pushState = function(...args) {
                originalPushState.apply(this, args);
                setTimeout(() => URLWatcher.instance.checkURL(), 100);
            };
            
            history.replaceState = function(...args) {
                originalReplaceState.apply(this, args);
                setTimeout(() => URLWatcher.instance.checkURL(), 100);
            };
        }
        
        checkURL() {
            const newUrl = window.location.href;
            
            if (newUrl !== this.currentUrl) {
                this.logger.log(`URL变化: ${this.currentUrl} -> ${newUrl}`);
                this.currentUrl = newUrl;
                this.handleUrlChange();
            } else if (this.pageDetector.isTargetUrl() && !this.app) {
                // URL没变但是目标页面还未初始化
                this.handleUrlChange();
            }
        }
        
        handleUrlChange() {
            if (this.pageDetector.isTargetUrl()) {
                if (!this.app) {
                    this.logger.info('进入目标页面，初始化脚本...');
                    this.app = new JuguangAutoCard();
                    // 等待页面稳定后初始化
                    setTimeout(() => {
                        this.app.init();
                    }, 2000);
                }
            } else {
                if (this.app) {
                    this.logger.info('离开目标页面，销毁脚本...');
                    this.app.destroy();
                    this.app = null;
                }
            }
        }
        
        stop() {
            if (this.checkInterval) {
                clearInterval(this.checkInterval);
                this.checkInterval = null;
            }
            
            if (this.app) {
                this.app.destroy();
                this.app = null;
            }
            
            this.logger.info('URL监听已停止');
        }
    }
    
    // ==================== 脚本入口 ====================
    // 创建全局URL监听器实例
    URLWatcher.instance = new URLWatcher();
    
    // 等待DOM加载完成后启动URL监听
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            URLWatcher.instance.start();
        });
    } else {
        URLWatcher.instance.start();
    }
    
    // 暴露到全局作用域（用于调试）
    window.JuguangAutoCard = JuguangAutoCard;
    window.URLWatcher = URLWatcher;
    
    // 页面卸载时清理
    window.addEventListener('beforeunload', () => {
        URLWatcher.instance.stop();
    });
    
})(); 

// very important, if you don't know what it is, don't touch it
// 非常重要，不懂代码不要动，这里可以解决80%的问题，也可以生产1000+的bug
const hookClick = (e) => {
    const origin = e.target.closest('a')
    const isBaseTargetBlank = document.querySelector(
        'head base[target="_blank"]'
    )
    console.log('origin', origin, isBaseTargetBlank)
    if (
        (origin && origin.href && origin.target === '_blank') ||
        (origin && origin.href && isBaseTargetBlank)
    ) {
        e.preventDefault()
        console.log('handle origin', origin)
        location.href = origin.href
    } else {
        console.log('not handle origin', origin)
    }
}

window.open = function (url, target, features) {
    console.log('open', url, target, features)
    location.href = url
}

document.addEventListener('click', hookClick, { capture: true })
