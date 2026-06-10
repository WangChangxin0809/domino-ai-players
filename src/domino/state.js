// file: src/domino/state.js
// 墨西哥火车多米诺 — 游戏状态管理

var DominoState = (function() {
  "use strict";

  // 依赖 DominoConfig（需先加载 config.js）
  var C = (typeof DominoConfig !== "undefined") ? DominoConfig : null;

  // ============================================================================
  // 骨牌工具函数
  // ============================================================================

  /** 返回骨牌的字符串 key，如 [3,7] → "3-7" */
  function tileKey(tile) {
    return tile[0] + "-" + tile[1];
  }

  /** 返回骨牌的点数总和 */
  function pips(tile) {
    return tile[0] + tile[1];
  }

  /** 是否为双牌（两端相同） */
  function isDouble(tile) {
    return tile[0] === tile[1];
  }

  /** 骨牌的某一端是否匹配指定值 */
  function matches(tile, value) {
    return tile[0] === value || tile[1] === value;
  }

  /** 返回骨牌中不匹配 matchValue 的另一端值；
   *  如果两端都匹配，返回 —1；如果都不匹配，返回 —1。 */
  function otherEnd(tile, matchValue) {
    if (tile[0] === matchValue && tile[1] === matchValue) return -1;
    if (tile[0] === matchValue) return tile[1];
    if (tile[1] === matchValue) return tile[0];
    return -1;
  }

  /** Fisher——Yates 洗牌算法，返回新数组 */
  function shuffleTiles(tiles) {
    var arr = tiles.slice();
    var i, j, tmp;
    for (i = arr.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  // ============================================================================
  // 数据创建函数
  // ============================================================================

  /** 创建一个火车对象 */
  function createTrain(id, ownerIndex) {
    return {
      id: id,
      tiles: [],
      openValue: null,
      isPublic: false,
      ownerIndex: (ownerIndex !== undefined) ? ownerIndex : null,
      hasUnsatisfiedDouble: false,
      unsatisfiedDoubleValue: null
    };
  }

  /** 根据玩家配置创建一个 Player 对象 */
  function createPlayer(config, index) {
    // config 来自 DominoConfig.PLAYERS[index]
    if (config.index !== index) {
      console.warn("createPlayer: config.index 与参数 index 不一致，以参数为准。");
    }
    return {
      index: index,
      name: config.name,
      type: config.type,
      personality: config.personality,
      emoji: config.emoji,
      color: config.color,
      hand: [],
      scoreHistory: [],
      totalScore: 0
    };
  }

  /** 创建一个 AI 状态对象 */
  function createAIState() {
    return {
      mood: 0.0,
      moodHistory: [],
      lastEventType: ""
    };
  }

  // ============================================================================
  // 主游戏状态创建
  // ============================================================================

  /** 创建空游戏状态（不含 initNewGame 的初始化过程） */
  function createGameState() {
    return {
      phase: "idle",
      players: [],
      trains: [],
      boneyard: [],
      roundNumber: 1,
      currentPlayerIndex: 0,
      engineValue: null,
      pendingDoublePlayer: null,
      pendingDoubleTrainId: null,
      selectedTileIndex: null,
      selectedTrainId: null,
      eventLog: [],
      aiStates: [],
      gameOver: false,
      winner: null
    };
  }

  /** 初始化一局全新游戏 */
  function initNewGame() {
    if (!C) {
      throw new Error("DominoState.initNewGame: DominoConfig 未加载，请先引入 config.js");
    }

    // 1. 生成并洗牌
    var allTiles = C.generateTiles();
    var shuffled = shuffleTiles(allTiles);

    // 2. 创建玩家并发牌（每人 HAND_SIZE 张）
    var players = [];
    var aiStates = [];
    var playerCount = C.PLAYER_COUNT;
    var handSize = C.HAND_SIZE;

    for (var i = 0; i < playerCount; i++) {
      var cfg = C.PLAYERS[i];
      var player = createPlayer(cfg, i);
      // 从洗好的牌里取 handSize 张
      var hand = shuffled.splice(0, handSize);
      player.hand = hand;
      players.push(player);

      // 为 AI 玩家创建 AI 状态；人类玩家也占位但不会被使用
      aiStates.push(createAIState());
    }

    // 3. 剩余的牌就是 boneyard
    var boneyard = shuffled;

    // 4. 找到引擎双牌（场上最大的双牌）和持有者
    var engineValue = -1;
    var engineOwnerIndex = 0;

    for (var p = 0; p < players.length; p++) {
      var handArr = players[p].hand;
      for (var t = 0; t < handArr.length; t++) {
        var tile = handArr[t];
        if (isDouble(tile) && tile[0] > engineValue) {
          engineValue = tile[0];
          engineOwnerIndex = p;
        }
      }
    }

    if (engineValue === -1) {
      throw new Error("initNewGame: 未在任何玩家手中找到双牌，无法确定引擎值。");
    }

    // 5. 创建五条火车
    var personalIds = C.TRAIN_IDS.PERSONAL_TRAINS;
    var trains = [];
    for (var tr = 0; tr < personalIds.length; tr++) {
      var tid = personalIds[tr];
      var train = createTrain(tid, tr);
      train.openValue = engineValue;
      train.isPublic = false;
      trains.push(train);
    }
    // 墨西哥火车
    var mexicanTrain = createTrain(C.TRAIN_IDS.MEXICAN_TRAIN, null);
    mexicanTrain.openValue = engineValue;
    mexicanTrain.isPublic = true;
    trains.push(mexicanTrain);

    // 6. 构建游戏状态
    var state = createGameState();
    state.players = players;
    state.trains = trains;
    state.boneyard = boneyard;
    state.roundNumber = 1;
    state.currentPlayerIndex = engineOwnerIndex;
    state.engineValue = engineValue;
    state.aiStates = aiStates;
    state.phase = "waiting_human";

    // 如果引擎持有者是 AI，则 phase 应设为 ai_thinking
    if (players[engineOwnerIndex].type === "ai") {
      state.phase = "ai_thinking";
    }

    return state;
  }

  // ============================================================================
  // 公开 API
  // ============================================================================
  return {
    // 工具
    tileKey: tileKey,
    pips: pips,
    isDouble: isDouble,
    matches: matches,
    otherEnd: otherEnd,
    shuffleTiles: shuffleTiles,

    // 工厂
    createTrain: createTrain,
    createPlayer: createPlayer,
    createAIState: createAIState,
    createGameState: createGameState,

    // 初始化
    initNewGame: initNewGame
  };

})();
