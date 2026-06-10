// file: src/domino/ui.js
// 墨西哥火车多米诺 — 完整 UI 渲染与游戏循环模块

var DominoUI = (function() {
  "use strict";

  // ============================================================================
  // CSS 注入
  // ============================================================================
  var CSS_TEXT = [
    "/* === 全局重置 === */",
    "* { margin: 0; padding: 0; box-sizing: border-box; }",
    "",
    "html, body {",
    "  width: 100%;",
    "  min-height: 100vh;",
    "  overflow-x: hidden;",
    "}",
    "",
    "body {",
    "  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif;",
    "  background: #1a1a2e;",
    "  color: #e0e0e0;",
    "  min-width: 1000px;",
    "  line-height: 1.5;",
    "}",
    "",
    "/* === 主容器 === */",
    "#game-container {",
    "  display: grid;",
    "  grid-template-rows: auto auto 1fr auto auto auto;",
    "  grid-template-columns: 1fr;",
    "  gap: 12px;",
    "  max-width: 1400px;",
    "  margin: 0 auto;",
    "  padding: 16px 20px;",
    "  min-height: 100vh;",
    "}",
    "",
    "/* === Header === */",
    "#header {",
    "  display: flex;",
    "  justify-content: space-between;",
    "  align-items: center;",
    "  padding: 12px 20px;",
    "  background: linear-gradient(135deg, #16213e 0%, #0f3460 100%);",
    "  border-radius: 10px;",
    "  border: 1px solid #1a3a5c;",
    "}",
    "",
    "#header h1 {",
    "  font-size: 1.6em;",
    "  font-weight: 700;",
    "  letter-spacing: 2px;",
    "  color: #e0d5c0;",
    "  text-shadow: 0 2px 4px rgba(0,0,0,0.5);",
    "}",
    "",
    "#round-info, #target-info {",
    "  font-size: 0.95em;",
    "  padding: 4px 14px;",
    "  background: rgba(255,255,255,0.08);",
    "  border-radius: 16px;",
    "  color: #b0c4de;",
    "}",
    "",
    "#round-info { margin-right: 8px; }",
    "",
    "/* === 主区域：分数面板 + 棋盘 === */",
    "#main-area {",
    "  display: grid;",
    "  grid-template-columns: 240px 1fr;",
    "  gap: 12px;",
    "  min-height: 400px;",
    "}",
    "",
    "/* --- 分面板 --- */",
    "#score-panel {",
    "  display: flex;",
    "  flex-direction: column;",
    "  gap: 8px;",
    "}",
    "",
    ".score-card {",
    "  background: #16213e;",
    "  border: 1px solid #1a3a5c;",
    "  border-radius: 8px;",
    "  padding: 10px 12px;",
    "  transition: all 0.25s ease;",
    "  position: relative;",
    "}",
    "",
    ".score-card.active {",
    "  border-left: 4px solid #4fc3f7;",
    "  box-shadow: 0 0 14px rgba(79,195,247,0.25);",
    "  background: #1a2744;",
    "}",
    "",
    ".score-card-header {",
    "  display: flex;",
    "  align-items: center;",
    "  gap: 6px;",
    "  margin-bottom: 4px;",
    "}",
    "",
    ".score-card-emoji { font-size: 1.3em; }",
    "",
    ".score-card-name {",
    "  font-weight: 600;",
    "  font-size: 0.95em;",
    "}",
    "",
    ".score-card-badge {",
    "  font-size: 0.7em;",
    "  padding: 1px 6px;",
    "  border-radius: 8px;",
    "  background: rgba(255,255,255,0.1);",
    "  color: #aaa;",
    "}",
    "",
    ".score-card-round {",
    "  font-size: 0.82em;",
    "  color: #f0c060;",
    "}",
    "",
    ".score-card-total {",
    "  font-size: 0.82em;",
    "  color: #a0d0a0;",
    "}",
    "",
    ".score-card-total.leading {",
    "  color: #ff6b6b;",
    "  font-weight: 600;",
    "}",
    "",
    "/* --- 棋盘区域 --- */",
    "#board-area {",
    "  display: flex;",
    "  flex-direction: column;",
    "  gap: 10px;",
    "}",
    "",
    "#engine-display {",
    "  display: flex;",
    "  align-items: center;",
    "  justify-content: center;",
    "  gap: 10px;",
    "  padding: 6px 0;",
    "}",
    "",
    ".engine-badge {",
    "  font-size: 1.1em;",
    "  padding: 6px 18px;",
    "  background: #0f3460;",
    "  border: 2px solid #e2b04a;",
    "  border-radius: 20px;",
    "  color: #e2b04a;",
    "  font-weight: 600;",
    "  letter-spacing: 1px;",
    "}",
    "",
    "#trains-container {",
    "  display: flex;",
    "  flex-direction: column;",
    "  gap: 8px;",
    "}",
    "",
    ".train-row {",
    "  display: flex;",
    "  align-items: center;",
    "  gap: 4px;",
    "  padding: 6px 10px;",
    "  background: #0d1b32;",
    "  border: 2px solid transparent;",
    "  border-radius: 8px;",
    "  min-height: 52px;",
    "  overflow-x: auto;",
    "  transition: border-color 0.2s, box-shadow 0.2s;",
    "  cursor: default;",
    "  scrollbar-width: thin;",
    "  scrollbar-color: #2a3a5c transparent;",
    "}",
    "",
    ".train-row::-webkit-scrollbar { height: 4px; }",
    ".train-row::-webkit-scrollbar-track { background: transparent; }",
    ".train-row::-webkit-scrollbar-thumb { background: #2a3a5c; border-radius: 2px; }",
    "",
    ".train-row.highlight {",
    "  border-color: #4fc3f7;",
    "  box-shadow: 0 0 12px rgba(79,195,247,0.35);",
    "  cursor: pointer;",
    "}",
    "",
    ".train-row.highlight:hover {",
    "  background: #122344;",
    "}",
    "",
    ".train-label {",
    "  flex-shrink: 0;",
    "  font-size: 0.8em;",
    "  padding: 4px 10px;",
    "  border-radius: 12px;",
    "  font-weight: 600;",
    "  white-space: nowrap;",
    "  min-width: 70px;",
    "  text-align: center;",
    "}",
    "",
    ".train-tiles {",
    "  display: flex;",
    "  gap: 3px;",
    "  flex-wrap: nowrap;",
    "  align-items: center;",
    "  overflow-x: auto;",
    "  flex: 1;",
    "  scrollbar-width: none;",
    "}",
    "",
    ".train-tiles::-webkit-scrollbar { display: none; }",
    "",
    ".train-open {",
    "  flex-shrink: 0;",
    "  width: 28px;",
    "  height: 28px;",
    "  border-radius: 50%;",
    "  display: flex;",
    "  align-items: center;",
    "  justify-content: center;",
    "  font-size: 0.75em;",
    "  font-weight: 700;",
    "  color: #fff;",
    "}",
    "",
    ".train-badge {",
    "  flex-shrink: 0;",
    "  font-size: 0.7em;",
    "  padding: 2px 6px;",
    "  border-radius: 8px;",
    "  white-space: nowrap;",
    "  font-weight: 500;",
    "}",
    "",
    "/* === 骨牌 tile === */",
    ".tile {",
    "  flex-shrink: 0;",
    "  width: 50px;",
    "  height: 28px;",
    "  background: #f0e6d3;",
    "  border: 1.5px solid #8b7355;",
    "  border-radius: 4px;",
    "  display: flex;",
    "  align-items: center;",
    "  justify-content: center;",
    "  font-size: 0.7em;",
    "  font-weight: 700;",
    "  color: #3e2f1c;",
    "  cursor: pointer;",
    "  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;",
    "  user-select: none;",
    "  position: relative;",
    "}",
    "",
    ".tile:hover {",
    "  transform: translateY(-2px);",
    "  box-shadow: 0 3px 8px rgba(0,0,0,0.3);",
    "}",
    "",
    ".tile.small {",
    "  width: 40px;",
    "  height: 22px;",
    "  font-size: 0.62em;",
    "}",
    "",
    ".tile-double {",
    "  border-color: #d4a017;",
    "  border-width: 2px;",
    "  box-shadow: 0 0 6px rgba(212,160,23,0.3);",
    "}",
    "",
    ".tile-selected {",
    "  border-color: #4fc3f7 !important;",
    "  box-shadow: 0 0 12px rgba(79,195,247,0.6) !important;",
    "  transform: translateY(-4px) !important;",
    "  background: #faf3e6 !important;",
    "}",
    "",
    ".tile-legal {",
    "  border-color: #66bb6a !important;",
    "  box-shadow: 0 0 6px rgba(102,187,106,0.4);",
    "}",
    "",
    ".tile-highlight-train {",
    "  border-color: #4fc3f7 !important;",
    "  box-shadow: 0 0 8px rgba(79,195,247,0.4);",
    "}",
    "",
    "/* === AI 状态卡 === */",
    "#ai-cards {",
    "  display: flex;",
    "  flex-direction: row;",
    "  gap: 10px;",
    "  flex-wrap: wrap;",
    "}",
    "",
    ".ai-card {",
    "  width: 220px;",
    "  background: #16213e;",
    "  border: 1px solid #1a3a5c;",
    "  border-radius: 10px;",
    "  padding: 12px;",
    "  transition: all 0.25s ease;",
    "}",
    "",
    ".ai-card.thinking {",
    "  animation: pulse 1.5s ease-in-out infinite;",
    "  border-color: #ffb74d;",
    "  box-shadow: 0 0 16px rgba(255,183,77,0.3);",
    "}",
    "",
    ".ai-card-top {",
    "  display: flex;",
    "  align-items: center;",
    "  gap: 8px;",
    "  margin-bottom: 6px;",
    "}",
    "",
    ".ai-card-emoji { font-size: 1.8em; }",
    "",
    ".ai-card-name {",
    "  font-weight: 600;",
    "  font-size: 0.95em;",
    "}",
    "",
    ".ai-card-badge {",
    "  font-size: 0.7em;",
    "  padding: 1px 7px;",
    "  border-radius: 8px;",
    "  background: rgba(255,255,255,0.12);",
    "  color: #ccc;",
    "}",
    "",
    ".ai-card-mood {",
    "  font-size: 1.4em;",
    "  display: inline-block;",
    "}",
    "",
    ".ai-card-hand {",
    "  font-size: 0.82em;",
    "  color: #b0c4de;",
    "  margin-bottom: 4px;",
    "}",
    "",
    ".ai-card-msg {",
    "  font-size: 0.78em;",
    "  color: #d0c8b0;",
    "  font-style: italic;",
    "  background: rgba(255,255,255,0.05);",
    "  border-radius: 6px;",
    "  padding: 5px 8px;",
    "  margin-top: 4px;",
    "  min-height: 20px;",
    "  word-break: break-word;",
    "  transition: opacity 0.3s;",
    "}",
    "",
    ".ai-card-thinking-text {",
    "  font-size: 0.78em;",
    "  color: #ffb74d;",
    "}",
    "",
    "/* === 事件日志 === */",
    "#event-log {",
    "  height: 120px;",
    "  overflow-y: auto;",
    "  background: #0d1b32;",
    "  border: 1px solid #1a3a5c;",
    "  border-radius: 8px;",
    "  padding: 8px 12px;",
    "  font-size: 0.8em;",
    "  line-height: 1.6;",
    "  scrollbar-width: thin;",
    "  scrollbar-color: #2a3a5c transparent;",
    "}",
    "",
    "#event-log::-webkit-scrollbar { width: 4px; }",
    "#event-log::-webkit-scrollbar-track { background: transparent; }",
    "#event-log::-webkit-scrollbar-thumb { background: #2a3a5c; border-radius: 2px; }",
    "",
    ".event-entry {",
    "  padding: 2px 0;",
    "  border-bottom: 1px solid rgba(255,255,255,0.03);",
    "  animation: slideIn 0.3s ease-out;",
    "}",
    "",
    ".event-system { color: #888; }",
    ".event-round-break {",
    "  color: #e2b04a;",
    "  text-align: center;",
    "  font-weight: 600;",
    "  padding: 4px 0;",
    "}",
    ".event-gameover {",
    "  color: #ff6b6b;",
    "  text-align: center;",
    "  font-size: 0.95em;",
    "  font-weight: 700;",
    "  padding: 4px 0;",
    "}",
    "",
    "/* === 手牌区域 === */",
    "#hand-area {",
    "  padding: 12px 16px;",
    "  background: #16213e;",
    "  border-radius: 10px;",
    "  border: 1px solid #1a3a5c;",
    "}",
    "",
    "#hand-area-label {",
    "  font-size: 0.85em;",
    "  color: #b0c4de;",
    "  margin-bottom: 6px;",
    "  font-weight: 600;",
    "}",
    "",
    "#hand-tiles {",
    "  display: flex;",
    "  flex-wrap: wrap;",
    "  gap: 6px;",
    "  align-items: flex-start;",
    "  min-height: 36px;",
    "}",
    "",
    "#action-buttons {",
    "  display: flex;",
    "  gap: 10px;",
    "  margin-top: 10px;",
    "}",
    "",
    "#action-buttons button {",
    "  padding: 8px 22px;",
    "  border: none;",
    "  border-radius: 8px;",
    "  font-size: 0.9em;",
    "  font-weight: 600;",
    "  cursor: pointer;",
    "  transition: all 0.2s;",
    "  color: #fff;",
    "  letter-spacing: 1px;",
    "}",
    "",
    "#action-buttons button:hover {",
    "  transform: translateY(-1px);",
    "  box-shadow: 0 4px 12px rgba(0,0,0,0.3);",
    "}",
    "",
    "#action-buttons button:active {",
    "  transform: translateY(0);",
    "}",
    "",
    "#btn-draw {",
    "  background: linear-gradient(135deg, #4fc3f7, #29b6f6);",
    "}",
    "",
    "#btn-draw:hover {",
    "  background: linear-gradient(135deg, #29b6f6, #03a9f4);",
    "}",
    "",
    "#btn-pass {",
    "  background: linear-gradient(135deg, #ffb74d, #ff9800);",
    "}",
    "",
    "#btn-pass:hover {",
    "  background: linear-gradient(135deg, #ff9800, #f57c00);",
    "}",
    "",
    "/* === 覆盖层 / 模态框 === */",
    "#overlay {",
    "  position: fixed;",
    "  inset: 0;",
    "  background: rgba(0,0,0,0.75);",
    "  display: flex;",
    "  align-items: center;",
    "  justify-content: center;",
    "  z-index: 1000;",
    "  animation: fadeIn 0.3s ease-out;",
    "}",
    "",
    "#overlay.hidden { display: none; }",
    "",
    "#overlay-content {",
    "  background: linear-gradient(135deg, #16213e, #1a2744);",
    "  border: 2px solid #e2b04a;",
    "  border-radius: 16px;",
    "  padding: 30px 40px;",
    "  min-width: 380px;",
    "  max-width: 500px;",
    "  text-align: center;",
    "  box-shadow: 0 10px 40px rgba(0,0,0,0.6);",
    "  animation: popIn 0.35s ease-out;",
    "}",
    "",
    "#overlay-content h2 {",
    "  font-size: 1.6em;",
    "  margin-bottom: 16px;",
    "  color: #e2b04a;",
    "}",
    "",
    "#overlay-content table {",
    "  width: 100%;",
    "  border-collapse: collapse;",
    "  margin: 16px 0;",
    "  font-size: 0.9em;",
    "}",
    "",
    "#overlay-content th {",
    "  text-align: left;",
    "  padding: 6px 8px;",
    "  border-bottom: 1px solid #2a3a5c;",
    "  color: #b0c4de;",
    "  font-weight: 500;",
    "}",
    "",
    "#overlay-content td {",
    "  text-align: left;",
    "  padding: 6px 8px;",
    "  border-bottom: 1px solid rgba(42,58,92,0.5);",
    "}",
    "",
    "#overlay-btn {",
    "  margin-top: 20px;",
    "  padding: 10px 32px;",
    "  font-size: 1em;",
    "  font-weight: 700;",
    "  border: none;",
    "  border-radius: 10px;",
    "  background: linear-gradient(135deg, #e2b04a, #d4a017);",
    "  color: #1a1a2e;",
    "  cursor: pointer;",
    "  transition: all 0.2s;",
    "  letter-spacing: 1px;",
    "}",
    "",
    "#overlay-btn:hover {",
    "  transform: translateY(-2px);",
    "  box-shadow: 0 6px 20px rgba(226,176,74,0.4);",
    "}",
    "",
    "/* === 动画 === */",
    "@keyframes pulse {",
    "  0%, 100% { box-shadow: 0 0 8px rgba(255,183,77,0.2); }",
    "  50% { box-shadow: 0 0 20px rgba(255,183,77,0.5); }",
    "}",
    "",
    "@keyframes slideIn {",
    "  from { opacity: 0; transform: translateY(-8px); }",
    "  to { opacity: 1; transform: translateY(0); }",
    "}",
    "",
    "@keyframes fadeIn {",
    "  from { opacity: 0; }",
    "  to { opacity: 1; }",
    "}",
    "",
    "@keyframes popIn {",
    "  from { opacity: 0; transform: scale(0.85); }",
    "  to { opacity: 1; transform: scale(1); }",
    "}",
    "",
    "/* === 响应式 === */",
    "@media (max-width: 1100px) {",
    "  #main-area {",
    "    grid-template-columns: 200px 1fr;",
    "  }",
    "  .ai-card {",
    "    width: 180px;",
    "  }",
    "}",
    "",
    "/* === 隐藏按钮 === */",
    "#action-buttons button.hidden {",
    "  display: none;",
    "}",
    ""
  ].join("\n");

  function injectCSS() {
    var styleEl = document.createElement("style");
    styleEl.textContent = CSS_TEXT;
    document.head.appendChild(styleEl);
  }

  // ============================================================================
  // 常量
  // ============================================================================
  var MAX_EVENT_LOG_ENTRIES = 50;

  // ============================================================================
  // 玩家颜色缓存 (从 Config 中提取)
  // ============================================================================
  function getPlayerColor(index) {
    var players = DominoConfig.PLAYERS;
    if (players && players[index]) {
      return players[index].color;
    }
    return "#e0e0e0";
  }

  function getPlayerEmoji(index) {
    var players = DominoConfig.PLAYERS;
    if (players && players[index]) {
      return players[index].emoji;
    }
    return "?";
  }

  function getPlayerName(index) {
    var players = DominoConfig.PLAYERS;
    if (players && players[index]) {
      return players[index].name;
    }
    return "Player " + index;
  }

  function getPlayerPersonality(index) {
    var players = DominoConfig.PLAYERS;
    if (players && players[index]) {
      return players[index].personality;
    }
    return "human";
  }

  // ============================================================================
  // 初始化
  // ============================================================================
  function init() {
    // 1. 注入 CSS
    injectCSS();

    // 2. 创建 DOM 结构
    createDOMStructure();

    // 3. 设置事件监听
    setupEventListeners();

    // 4. 初始化游戏
    DominoApp.state = DominoState.initNewGame();
    DominoEngine.initRound(DominoApp.state);

    // 5. 渲染全部
    renderAll();

    // 6. 启动游戏循环
    processNextTurn();
  }

  // ============================================================================
  // DOM 结构创建
  // ============================================================================
  function createDOMStructure() {
    var container = document.createElement("div");
    container.id = "game-container";
    container.innerHTML = [
      '<div id="header">',
      '  <h1>&#x1F004; 墨西哥火车多米诺</h1>',
      '  <span id="round-info">第 1 轮</span>',
      '  <span id="target-info">目标: ' + DominoConfig.TARGET_SCORE + '分</span>',
      '</div>',
      '<div id="main-area">',
      '  <div id="score-panel"></div>',
      '  <div id="board-area">',
      '    <div id="engine-display"></div>',
      '    <div id="trains-container"></div>',
      '  </div>',
      '</div>',
      '<div id="ai-cards"></div>',
      '<div id="event-log"></div>',
      '<div id="hand-area">',
      '  <div id="hand-area-label">你的手牌</div>',
      '  <div id="hand-tiles"></div>',
      '  <div id="action-buttons">',
      '    <button id="btn-draw">&#x1F0CF; 摸牌</button>',
      '    <button id="btn-pass">&#x23ED; 跳过</button>',
      '  </div>',
      '</div>',
      '</div>',
      '<div id="overlay" class="hidden">',
      '  <div id="overlay-content"></div>',
      '</div>'
    ].join("\n");
    document.body.appendChild(container);
  }

  // ============================================================================
  // 元素获取辅助函数
  // ============================================================================
  function $(id) { return document.getElementById(id); }

  // ============================================================================
  // 事件监听设置
  // ============================================================================
  function setupEventListeners() {
    // 手牌点击（事件委托）
    var handTiles = $("hand-tiles");
    if (handTiles) {
      handTiles.addEventListener("click", function(e) {
        var tileEl = e.target.closest(".tile");
        if (!tileEl) return;
        var stateObj = getState();
        if (!stateObj) return;
        // 只有人类玩家回合才响应
        if (stateObj.currentPlayerIndex !== 0) return;
        if (stateObj.phase !== "waiting_human") return;

        var tileIndex = parseInt(tileEl.getAttribute("data-tile-index"), 10);
        if (isNaN(tileIndex)) return;

        // 切换选择
        if (stateObj.selectedTileIndex === tileIndex) {
          stateObj.selectedTileIndex = null;
        } else {
          stateObj.selectedTileIndex = tileIndex;
        }
        renderAll();
      });
    }

    // 火车行点击（事件委托）
    var trainsContainer = $("trains-container");
    if (trainsContainer) {
      trainsContainer.addEventListener("click", function(e) {
        var trainRow = e.target.closest(".train-row.highlight");
        if (!trainRow) return;
        var stateObj = getState();
        if (!stateObj) return;
        if (stateObj.currentPlayerIndex !== 0) return;
        if (stateObj.phase !== "waiting_human") return;
        if (stateObj.selectedTileIndex === null) return;

        var trainId = trainRow.getAttribute("data-train-id");
        if (!trainId) return;

        // 尝试出牌
        var result = DominoEngine.executePlay(stateObj, 0, stateObj.selectedTileIndex, trainId);
        stateObj.selectedTileIndex = null;

        if (result && result.success) {
          var tile = result.tile;
          var tileStr = tile[0] + "|" + tile[1];
          var trainName = getTrainDisplayName(trainId, stateObj);
          addEvent(stateObj, 0, "play", "你 出了 [" + tileStr + "] → " + trainName);
        }

        renderAll();
        setTimeout(function() { processNextTurn(); }, 300);
      });
    }

    // 摸牌按钮
    var btnDraw = $("btn-draw");
    if (btnDraw) {
      btnDraw.addEventListener("click", function() {
        var stateObj = getState();
        if (!stateObj) return;
        if (stateObj.currentPlayerIndex !== 0) return;

        var result = DominoEngine.executeDraw(stateObj, 0);

        if (result && result.success) {
          if (result.tile) {
            var tile = result.tile;
            var tileStr = tile[0] + "|" + tile[1];
            addEvent(stateObj, 0, "draw", "你 摸了 [" + tileStr + "]");

            // 检查摸到的牌能否打出
            var legalMoves = DominoEngine.getLegalMoves(stateObj, 0);
            if (!legalMoves || legalMoves.length === 0) {
              // 不能打出，显示 pass 按钮
              stateObj.phase = "waiting_human_drew_no_play";
            } else {
              // 自动打出了
              addEvent(stateObj, 0, "play", "你 打出摸到的牌 [" + tileStr + "]");
            }
          } else if (result.autoPlayed) {
            var atile = result.autoPlayed.tile;
            var trainName = getTrainDisplayName(result.autoPlayed.trainId, stateObj);
            addEvent(stateObj, 0, "play",
              "你 打出摸到的牌 [" + atile[0] + "|" + atile[1] + "] → " + trainName);
          }
        }

        renderAll();
        setTimeout(function() { processNextTurn(); }, 300);
      });
    }

    // 跳过按钮
    var btnPass = $("btn-pass");
    if (btnPass) {
      btnPass.addEventListener("click", function() {
        var stateObj = getState();
        if (!stateObj) return;
        if (stateObj.currentPlayerIndex !== 0) return;

        DominoEngine.executePass(stateObj, 0);
        addEvent(stateObj, 0, "pass", "你 跳过回合，火车开放");

        renderAll();
        setTimeout(function() { processNextTurn(); }, 300);
      });
    }

    // 覆盖层按钮（动态绑定，点击时处理）
    var overlay = $("overlay");
    if (overlay) {
      overlay.addEventListener("click", function(e) {
        var btn = e.target.closest("#overlay-btn");
        if (!btn) return;
        var action = btn.getAttribute("data-action");
        if (action === "new_game") {
          handleNewGame();
        } else if (action === "next_round") {
          handleNextRound();
        }
      });
    }
  }

  // ============================================================================
  // 状态获取
  // ============================================================================
  function getState() {
    return (typeof DominoApp !== "undefined" && DominoApp.state) ? DominoApp.state : null;
  }

  // ============================================================================
  // 核心渲染函数
  // ============================================================================

  function renderAll() {
    renderScores();
    renderBoard();
    renderHand();
    renderAICards();
    renderEventLog();
    updateActionButtons();
  }

  // ============================================================================
  // 分数面板
  // ============================================================================
  function renderScores() {
    var panel = $("score-panel");
    if (!panel) return;
    var stateObj = getState();
    if (!stateObj) return;

    var players = stateObj.players;
    var html = "";

    for (var i = 0; i < players.length; i++) {
      var p = players[i];
      var isActive = (stateObj.currentPlayerIndex === i);
      var cardClass = "score-card" + (isActive ? " active" : "");
      var nameColor = "color:" + getPlayerColor(i) + ";";

      // 本轮惩罚：计算手牌点数和
      var roundPenalty = 0;
      if (p.hand && p.hand.length > 0) {
        for (var h = 0; h < p.hand.length; h++) {
          roundPenalty += DominoState.pips(p.hand[h]);
        }
      }

      var totalScore = p.totalScore || 0;

      // 找出当前领先（分数最低的）玩家
      var minScore = Infinity;
      for (var j = 0; j < players.length; j++) {
        if ((players[j].totalScore || 0) < minScore) {
          minScore = (players[j].totalScore || 0);
        }
      }
      var isLeading = (totalScore === minScore && players.length > 1);

      var totalClass = "score-card-total" + (isLeading ? " leading" : "");

      html += '<div class="' + cardClass + '">';
      html += '  <div class="score-card-header">';
      html += '    <span class="score-card-emoji">' + p.emoji + '</span>';
      html += '    <span class="score-card-name" style="' + nameColor + '">' + p.name + '</span>';
      if (p.personality && p.personality !== "human") {
        var persName = getPersonalityLabel(p.personality);
        html += '    <span class="score-card-badge">' + persName + '</span>';
      }
      html += '  </div>';
      html += '  <div class="score-card-round">本轮: ' + roundPenalty + '分</div>';
      html += '  <div class="' + totalClass + '">累计: ' + totalScore + '分</div>';
      html += '</div>';
    }

    panel.innerHTML = html;
  }

  function getPersonalityLabel(personality) {
    if (personality === "conservative") return "保守型";
    if (personality === "aggressive") return "冒险型";
    if (personality === "emotional") return "情绪型";
    return personality;
  }

  // ============================================================================
  // 棋盘渲染
  // ============================================================================
  function renderBoard() {
    var stateObj = getState();
    if (!stateObj) return;

    // 引擎显示
    var engineDisplay = $("engine-display");
    if (engineDisplay) {
      engineDisplay.innerHTML = '<span class="engine-badge">🀄 引擎: ' +
        (stateObj.engineValue !== null ? stateObj.engineValue : "—") + '</span>';
    }

    // 火车容器
    var container = $("trains-container");
    if (!container) return;

    // 计算哪些火车对当前选中牌是合法的
    var legalTrainIds = {};
    if (stateObj.selectedTileIndex !== null && stateObj.legalMoves) {
      var moves = stateObj.legalMoves;
      for (var m = 0; m < moves.length; m++) {
        if (moves[m].tileIndex === stateObj.selectedTileIndex) {
          legalTrainIds[moves[m].trainId] = true;
        }
      }
    }

    // 渲染顺序：墨西哥火车优先，然后个人火车按玩家顺序
    var trainOrder = ["mexican", "p0", "p1", "p2", "p3"];
    var html = "";

    for (var t = 0; t < trainOrder.length; t++) {
      var tid = trainOrder[t];
      var train = null;
      for (var tr = 0; tr < stateObj.trains.length; tr++) {
        if (stateObj.trains[tr].id === tid) {
          train = stateObj.trains[tr];
          break;
        }
      }
      if (!train) continue;

      var isHighlighted = (tid in legalTrainIds);
      var rowClass = "train-row" + (isHighlighted ? " highlight" : "");
      var displayName = getTrainDisplayName(tid, stateObj);

      html += '<div class="' + rowClass + '" data-train-id="' + tid + '">';

      // 标签
      var labelColor = getTrainLabelColor(tid, stateObj);
      html += '<span class="train-label" style="background:' + labelColor + ';">' + displayName + '</span>';

      // 徽章
      if (train.isPublic) {
        html += '<span class="train-badge" style="background:rgba(255,255,255,0.12);">🔓 开放</span>';
      }

      // 未满足双牌警告
      if (train.hasUnsatisfiedDouble && train.unsatisfiedDoubleValue !== null) {
        html += '<span class="train-badge" style="background:rgba(255,100,100,0.2);color:#ff6b6b;">⚠️ 需满足双' + train.unsatisfiedDoubleValue + '</span>';
      }

      // 开放标记（自己的火车当不能出牌时）
      if (tid === "p0" && stateObj.currentPlayerIndex === 0 &&
          stateObj.phase === "waiting_human_drew_no_play") {
        // 人类跳过，自己的火车开放（但实际上是自己跳过了）
        // 此标记由 advanceTurn 或 pass 逻辑处理，我们检查 train.isPublic
      }
      if (tid === "p0" && train.isPublic && stateObj.currentPlayerIndex !== 0) {
        html += '<span class="train-badge" style="background:rgba(102,187,106,0.2);color:#66bb6a;">🔓 开放</span>';
      }

      // 牌
      html += '<span class="train-tiles">';
      for (var ti = 0; ti < train.tiles.length; ti++) {
        html += renderTileHTML(train.tiles[ti], "small");
      }
      html += '</span>';

      // 开放端标记
      if (train.openValue !== null) {
        var openColor = getTrainOpenColor(tid, stateObj);
        html += '<span class="train-open" style="background:' + openColor + ';">' + train.openValue + '</span>';
      }

      html += '</div>';
    }

    container.innerHTML = html;
  }

  function getTrainLabelColor(trainId, stateObj) {
    if (trainId === "mexican") return "#e2b04a";
    var idx = parseInt(trainId.charAt(1), 10);
    if (isNaN(idx)) return "#555";
    return getPlayerColor(idx);
  }

  function getTrainOpenColor(trainId, stateObj) {
    if (trainId === "mexican") return "#c49a30";
    var idx = parseInt(trainId.charAt(1), 10);
    if (isNaN(idx)) return "#555";
    return getPlayerColor(idx);
  }

  // ============================================================================
  // 手牌渲染
  // ============================================================================
  function renderHand() {
    var handTiles = $("hand-tiles");
    if (!handTiles) return;
    var stateObj = getState();
    if (!stateObj) return;

    // 获取人类玩家的手牌
    var humanPlayer = stateObj.players[0];
    if (!humanPlayer || !humanPlayer.hand) {
      handTiles.innerHTML = "";
      return;
    }

    var hand = humanPlayer.hand;

    // 获取合法出牌（用于标记哪些牌可以打出）
    var legalTileIndices = {};
    if (stateObj.legalMoves) {
      var moves = stateObj.legalMoves;
      for (var m = 0; m < moves.length; m++) {
        legalTileIndices[moves[m].tileIndex] = true;
      }
    }

    var html = "";
    for (var i = 0; i < hand.length; i++) {
      var tile = hand[i];
      var classes = "tile";
      if (stateObj.selectedTileIndex === i) {
        classes += " tile-selected";
      }
      if (i in legalTileIndices) {
        classes += " tile-legal";
      }
      if (DominoState.isDouble(tile)) {
        classes += " tile-double";
      }
      html += '<div class="' + classes + '" data-tile-index="' + i + '">' +
        tile[0] + '│' + tile[1] + '</div>';
    }

    handTiles.innerHTML = html;
  }

  function renderTileHTML(tile, size) {
    var classes = "tile";
    if (size === "small") classes += " small";
    if (DominoState.isDouble(tile)) classes += " tile-double";
    return '<div class="' + classes + '">' + tile[0] + '│' + tile[1] + '</div>';
  }

  function renderTileElement(tile, size) {
    var el = document.createElement("div");
    el.className = "tile" + (size === "small" ? " small" : "");
    if (DominoState.isDouble(tile)) {
      el.className += " tile-double";
    }
    el.textContent = tile[0] + "│" + tile[1];
    return el;
  }

  // ============================================================================
  // AI 状态卡
  // ============================================================================
  function renderAICards() {
    var container = $("ai-cards");
    if (!container) return;
    var stateObj = getState();
    if (!stateObj) return;

    var html = "";
    for (var i = 1; i <= 3; i++) {
      var player = stateObj.players[i];
      if (!player) continue;

      var aiState = stateObj.aiStates ? stateObj.aiStates[i] : null;
      var isThinking = (stateObj.phase === "ai_thinking" && stateObj.currentPlayerIndex === i);
      var cardClass = "ai-card" + (isThinking ? " thinking" : "");
      var color = getPlayerColor(i);

      html += '<div class="' + cardClass + '">';

      // 顶部：emoji + 名字 + 个性标签
      html += '<div class="ai-card-top">';
      html += '<span class="ai-card-emoji">' + player.emoji + '</span>';
      html += '<div>';
      html += '<div class="ai-card-name" style="color:' + color + ';">' + player.name + '</div>';
      html += '<span class="ai-card-badge" style="background:' + color + '33;color:' + color + ';">' +
        getPersonalityLabel(player.personality) + '</span>';
      html += '</div>';
      html += '</div>';

      // 情绪 emoji（仅情绪型 AI 显示）
      if (player.personality === "emotional" && aiState) {
        var moodEmoji = DominoConfig.getMoodEmoji(aiState.mood);
        html += '<div style="margin-bottom:2px;">';
        html += '<span class="ai-card-mood">' + moodEmoji + '</span>';
        html += '</div>';
      }

      // 手牌数
      html += '<div class="ai-card-hand">🃏 ×' + (player.hand ? player.hand.length : 0) + '</div>';

      // 思考中 / 消息
      if (isThinking) {
        html += '<div class="ai-card-thinking-text">思考中...</div>';
      } else if (player.latestMessage) {
        html += '<div class="ai-card-msg">' + escapeHTML(player.latestMessage) + '</div>';
      }

      html += '</div>';
    }

    container.innerHTML = html;
  }

  // ============================================================================
  // 事件日志
  // ============================================================================
  function renderEventLog() {
    var logEl = $("event-log");
    if (!logEl) return;
    var stateObj = getState();
    if (!stateObj) return;

    var log = stateObj.eventLog || [];
    var html = "";

    // 只显示最近 MAX_EVENT_LOG_ENTRIES 条
    var start = Math.max(0, log.length - MAX_EVENT_LOG_ENTRIES);
    for (var i = start; i < log.length; i++) {
      html += renderEventEntryHTML(log[i]);
    }

    logEl.innerHTML = html;

    // 自动滚动到底部
    logEl.scrollTop = logEl.scrollHeight;
  }

  function renderEventEntryHTML(entry) {
    var cls = "event-entry";
    var msg = escapeHTML(entry.message || "");

    if (entry.type === "round_end") {
      cls += " event-round-break";
    } else if (entry.type === "game_over") {
      cls += " event-gameover";
    } else if (entry.type === "system") {
      cls += " event-system";
    }

    if (entry.playerIndex !== undefined && entry.playerIndex !== null && entry.type !== "round_end" && entry.type !== "game_over") {
      var emoji = getPlayerEmoji(entry.playerIndex);
      var color = getPlayerColor(entry.playerIndex);
      msg = '<span style="color:' + color + ';">' + emoji + ' ' + msg + '</span>';
    }

    return '<div class="' + cls + '">' + msg + '</div>';
  }

  function addEvent(stateObj, playerIndex, type, message) {
    if (!stateObj) return;
    if (!stateObj.eventLog) {
      stateObj.eventLog = [];
    }
    stateObj.eventLog.push({
      round: stateObj.roundNumber || 1,
      playerIndex: playerIndex,
      type: type,
      message: message
    });

    // 裁剪旧条目
    if (stateObj.eventLog.length > MAX_EVENT_LOG_ENTRIES) {
      stateObj.eventLog = stateObj.eventLog.slice(stateObj.eventLog.length - MAX_EVENT_LOG_ENTRIES);
    }

    renderEventLog();
  }

  // ============================================================================
  // 动作按钮
  // ============================================================================
  function updateActionButtons() {
    var stateObj = getState();
    var btnDraw = $("btn-draw");
    var btnPass = $("btn-pass");

    if (!btnDraw || !btnPass) return;

    // 默认隐藏
    btnDraw.classList.add("hidden");
    btnPass.classList.add("hidden");

    if (!stateObj) return;

    // 只有人类玩家回合才显示按钮
    if (stateObj.currentPlayerIndex !== 0) return;

    if (stateObj.phase === "waiting_human_drew_no_play") {
      // 摸牌后没有可出的牌，显示 pass
      btnPass.classList.remove("hidden");
    } else if (stateObj.phase === "waiting_human") {
      // 人类回合，检查是否有合法出牌
      var legalMoves = stateObj.legalMoves;
      if (!legalMoves || legalMoves.length === 0) {
        // 没有合法出牌，显示摸牌按钮
        btnDraw.classList.remove("hidden");
      }
      // 如果有合法出牌，不显示任何按钮（用户通过点击tile/train出牌）
    }
  }

  // ============================================================================
  // 高亮合法火车
  // ============================================================================
  function highlightLegalTrains(stateObj) {
    // 这个方法的效果已集成在 renderBoard() 中
    // 通过检查 stateObj.selectedTileIndex 和 stateObj.legalMoves 决定高亮
    // 这里提供独立调用以便需要时刷新
    if (!stateObj) stateObj = getState();
    if (!stateObj) return;
    renderBoard();
  }

  // ============================================================================
  // 游戏主循环
  // ============================================================================
  function processNextTurn() {
    var stateObj = getState();
    if (!stateObj) return;

    // 检查游戏是否已结束
    if (stateObj.gameOver) return;

    // 检查当前轮是否结束
    if (DominoEngine.isRoundOver(stateObj)) {
      DominoEngine.scoreRound(stateObj);
      renderAll();

      // 添加轮次结束事件
      var roundPenalties = [];
      for (var rp = 0; rp < stateObj.players.length; rp++) {
        var pp = stateObj.players[rp];
        var penalty = 0;
        if (pp.hand && pp.hand.length > 0) {
          for (var ph = 0; ph < pp.hand.length; ph++) {
            penalty += DominoState.pips(pp.hand[ph]);
          }
        }
        roundPenalties.push(pp.emoji + " " + pp.name + ": +" + penalty + "分");
      }
      addEvent(stateObj, null, "round_end",
        "━━ 第" + stateObj.roundNumber + "轮结束 ━━ " + roundPenalties.join(" | "));

      if (DominoEngine.isGameOver(stateObj)) {
        var winner = DominoEngine.getWinner(stateObj);
        if (winner) {
          addEvent(stateObj, null, "game_over",
            "🏆 游戏结束！胜者: " + winner.emoji + " " + winner.name);
        }
        showGameOver(stateObj);
        return;
      } else {
        showRoundSummary(stateObj);
        return;
      }
    }

    // 检查当前玩家是否已出完所有牌（手牌为0），推进到下一玩家
    var currentPlayer = stateObj.players[stateObj.currentPlayerIndex];
    if (currentPlayer && currentPlayer.hand && currentPlayer.hand.length === 0) {
      // 当前玩家已出完牌，推进
      DominoEngine.advanceTurn(stateObj);
      // 递归检查下一个
      setTimeout(function() { processNextTurn(); }, 200);
      return;
    }

    var currentPlayerIndex = stateObj.currentPlayerIndex;

    if (currentPlayerIndex === 0) {
      // 人类玩家回合
      stateObj.phase = "waiting_human";
      stateObj.legalMoves = DominoEngine.getLegalMoves(stateObj, 0);
      renderAll();
      return; // 等待用户输入
    } else {
      // AI 回合
      stateObj.phase = "ai_thinking";
      renderAll();

      var delay = DominoAI.getThinkingDelay(stateObj, currentPlayerIndex);
      var aiIndex = currentPlayerIndex;
      setTimeout(function() {
        processAITurn(stateObj, aiIndex);
      }, delay);
    }
  }

  // ============================================================================
  // AI 回合处理
  // ============================================================================
  function processAITurn(stateObj, playerIndex) {
    if (!stateObj) return;

    var player = stateObj.players[playerIndex];
    if (!player) return;

    var move = DominoAI.selectMove(stateObj, playerIndex);

    if (move) {
      // AI 出牌
      var result = DominoEngine.executePlay(stateObj, playerIndex, move.tileIndex, move.trainId);

      // 确定上下文
      var ctx = DominoAI.determineContext(stateObj, playerIndex, result);

      // 更新情绪
      DominoAI.updateMood(stateObj, playerIndex, ctx);

      // 获取消息
      var msg = DominoAI.selectMessage(stateObj, playerIndex, ctx);
      if (msg) {
        player.latestMessage = msg;
      }

      // 生成事件文本
      var tile = result.tile;
      var tileStr = tile ? (tile[0] + "|" + tile[1]) : "?";
      var trainName = getTrainDisplayName(move.trainId, stateObj);
      addEvent(stateObj, playerIndex, "play",
        player.name + " 出了 [" + tileStr + "] → " + trainName);
    } else {
      // AI 无法出牌
      if (stateObj.boneyard && stateObj.boneyard.length > 0) {
        // 摸牌
        var drawResult = DominoEngine.executeDraw(stateObj, playerIndex);
        var dctx = DominoAI.determineContext(stateObj, playerIndex, drawResult);
        DominoAI.updateMood(stateObj, playerIndex, dctx);
        var dmsg = DominoAI.selectMessage(stateObj, playerIndex, dctx);
        if (dmsg) {
          player.latestMessage = dmsg;
        }

        if (drawResult && drawResult.tile) {
          var dtile = drawResult.tile;
          addEvent(stateObj, playerIndex, "draw",
            player.name + " 摸了 [" + dtile[0] + "|" + dtile[1] + "]");
        }
        if (drawResult && drawResult.autoPlayed) {
          var ap = drawResult.autoPlayed;
          var trainName = getTrainDisplayName(ap.trainId, stateObj);
          addEvent(stateObj, playerIndex, "play",
            player.name + " 打出摸到的牌 [" + ap.tile[0] + "|" + ap.tile[1] + "] → " + trainName);
        }
      } else {
        // 跳过
        DominoEngine.executePass(stateObj, playerIndex);
        var pctx = { action: "pass" };
        DominoAI.updateMood(stateObj, playerIndex, pctx);
        var pmsg = DominoAI.selectMessage(stateObj, playerIndex, pctx);
        if (pmsg) {
          player.latestMessage = pmsg;
        }

        addEvent(stateObj, playerIndex, "pass",
          player.name + " 跳过回合，火车开放");
      }
    }

    renderAll();

    // 延迟后进入下一回合
    setTimeout(function() {
      processNextTurn();
    }, 500);
  }

  // ============================================================================
  // 游戏结束覆盖层
  // ============================================================================
  function showGameOver(stateObj) {
    if (!stateObj) stateObj = getState();
    if (!stateObj) return;

    var winner = DominoEngine.getWinner(stateObj);
    var overlay = $("overlay");
    var content = $("overlay-content");
    if (!overlay || !content) return;

    overlay.classList.remove("hidden");

    var winnerHTML = winner ?
      (winner.emoji + " " + winner.name + " 获胜！") :
      "游戏结束";

    var html = '<h2>🏆 ' + winnerHTML + '</h2>';

    // 最终分数表
    html += '<table>';
    html += '<tr><th>玩家</th><th>最终总分</th></tr>';
    var players = stateObj.players;
    for (var i = 0; i < players.length; i++) {
      var p = players[i];
      var color = getPlayerColor(i);
      html += '<tr>';
      html += '<td style="color:' + color + ';">' + p.emoji + ' ' + p.name + '</td>';
      html += '<td>' + (p.totalScore || 0) + '分</td>';
      html += '</tr>';
    }
    html += '</table>';

    html += '<button id="overlay-btn" data-action="new_game">🔄 再来一局</button>';
    content.innerHTML = html;

    stateObj.gameOver = true;
    stateObj.winner = winner;
  }

  // ============================================================================
  // 轮次总结覆盖层
  // ============================================================================
  function showRoundSummary(stateObj) {
    if (!stateObj) stateObj = getState();
    if (!stateObj) return;

    var overlay = $("overlay");
    var content = $("overlay-content");
    if (!overlay || !content) return;

    overlay.classList.remove("hidden");

    var roundNum = stateObj.roundNumber;

    var html = '<h2>第 ' + roundNum + ' 轮结束</h2>';

    html += '<table>';
    html += '<tr><th>玩家</th><th>本轮惩罚</th><th>累计总分</th></tr>';

    var players = stateObj.players;
    for (var i = 0; i < players.length; i++) {
      var p = players[i];
      var color = getPlayerColor(i);

      // 本轮惩罚
      var penalty = 0;
      if (p.hand && p.hand.length > 0) {
        for (var h = 0; h < p.hand.length; h++) {
          penalty += DominoState.pips(p.hand[h]);
        }
      }

      html += '<tr>';
      html += '<td style="color:' + color + ';">' + p.emoji + ' ' + p.name + '</td>';
      html += '<td>+' + penalty + '分</td>';
      html += '<td>' + (p.totalScore || 0) + '分</td>';
      html += '</tr>';
    }
    html += '</table>';

    html += '<button id="overlay-btn" data-action="next_round">▶ 下一轮</button>';
    content.innerHTML = html;
  }

  // ============================================================================
  // 覆盖层动作处理
  // ============================================================================
  function handleNewGame() {
    var overlay = $("overlay");
    if (overlay) overlay.classList.add("hidden");

    DominoApp.state = DominoState.initNewGame();
    DominoEngine.initRound(DominoApp.state);
    renderAll();
    processNextTurn();
  }

  function handleNextRound() {
    var overlay = $("overlay");
    if (overlay) overlay.classList.add("hidden");

    var stateObj = getState();
    if (!stateObj) return;

    DominoEngine.initRound(stateObj);
    renderAll();
    processNextTurn();
  }

  // ============================================================================
  // 火车显示名称
  // ============================================================================
  function getTrainDisplayName(trainId, stateObj) {
    if (trainId === "mexican") return "🇲🇽 墨西哥火车";
    if (trainId === "p0") return "🚂 你的火车";
    if (trainId === "p1") return "🐢 老稳的火车";
    if (trainId === "p2") return "🔥 小冲的火车";
    if (trainId === "p3") return "🎭 大悲大喜的火车";

    // 回退：尝试从配置中获取
    if (trainId && trainId.length >= 2) {
      var idx = parseInt(trainId.charAt(1), 10);
      if (!isNaN(idx)) {
        var name = getPlayerName(idx);
        var emoji = getPlayerEmoji(idx);
        return emoji + " " + name + "的火车";
      }
    }

    return trainId;
  }

  // ============================================================================
  // 工具
  // ============================================================================
  function escapeHTML(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ============================================================================
  // 公开 API
  // ============================================================================
  return {
    init: init,
    renderAll: renderAll,
    renderScores: renderScores,
    renderBoard: renderBoard,
    renderHand: renderHand,
    renderTileElement: renderTileElement,
    renderAICards: renderAICards,
    renderEventLog: renderEventLog,
    addEvent: addEvent,
    updateActionButtons: updateActionButtons,
    highlightLegalTrains: highlightLegalTrains,
    processNextTurn: processNextTurn,
    processAITurn: processAITurn,
    showGameOver: showGameOver,
    showRoundSummary: showRoundSummary,
    getTrainDisplayName: getTrainDisplayName,
    handleNewGame: handleNewGame,
    handleNextRound: handleNextRound
  };

})();
