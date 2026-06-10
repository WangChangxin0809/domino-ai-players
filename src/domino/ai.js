// file: src/domino/ai.js
// 墨西哥火车多米诺 — AI 决策引擎
// 为三种拟人性格（保守型、冒险型、情绪型）提供出牌策略、情绪系统与对话选择

var DominoAI = (function() {
  "use strict";

  // ============================================================================
  // 内部工具函数
  // ============================================================================

  /**
   * 从 trainId 中提取玩家索引。 "p0" -> 0, "p1" -> 1, "mexican" -> -1
   */
  function _trainOwnerIndex(trainId) {
    if (trainId === "mexican") return -1;
    if (trainId && trainId[0] === "p") {
      var idx = parseInt(trainId.substring(1), 10);
      return isNaN(idx) ? -1 : idx;
    }
    return -1;
  }

  /**
   * 限制值到 [min, max] 范围。
   */
  function _clamp(val, min, max) {
    if (val < min) return min;
    if (val > max) return max;
    return val;
  }

  /**
   * 获取火车当前开放端点值。若无牌则为 -1。
   */
  function _getTrainOpenValue(stateObj, trainId) {
    var trains = stateObj.trains || [];
    var train = null;
    for (var t = 0; t < trains.length; t++) {
      if (trains[t].id === trainId) { train = trains[t]; break; }
    }
    if (train) {
      return train.openValue;
    }
    // 后备：从 train 的 tiles 推导
    if (train && train.tiles && train.tiles.length > 0) {
      return train.tiles[train.tiles.length - 1];
    }
    return -1;
  }

  /**
   * 获取玩家当前 mood（情绪型专用）。不存在则初始化为 0。
   */
  function _getMood(stateObj, playerIndex) {
    if (!stateObj.aiStates) {
      stateObj.aiStates = [];
    }
    if (!stateObj.aiStates[playerIndex]) {
      stateObj.aiStates[playerIndex] = { mood: 0.0, moodHistory: [], lastEventType: null };
    }
    return stateObj.aiStates[playerIndex].mood;
  }

  /**
   * 获取玩家 aiStates 对象。不存在则初始化。
   */
  function _getAIState(stateObj, playerIndex) {
    if (!stateObj.aiStates) {
      stateObj.aiStates = [];
    }
    if (!stateObj.aiStates[playerIndex]) {
      stateObj.aiStates[playerIndex] = { mood: 0.0, moodHistory: [], lastEventType: null };
    }
    return stateObj.aiStates[playerIndex];
  }

  // ============================================================================
  // getEffectiveWeights
  // ============================================================================

  /**
   * 获取当前有效的权重对象。
   * - conservative / aggressive: 直接返回静态权重
   * - emotional: 用 mood 调制基础权重
   *
   * @param {string}  personalityId - "conservative" | "aggressive" | "emotional"
   * @param {number}  mood - 当前情绪值 [-1, 1]
   * @returns {object} { d1_ownTrain, d2_mexican, ..., d8_selfBlock }
   */
  function getEffectiveWeights(personalityId, mood) {
    var cfg = DominoConfig.PERSONALITIES[personalityId];
    if (!cfg) {
      // 默认退回保守型
      return DominoConfig.PERSONALITIES.conservative.weights;
    }

    // 非情绪型：静态权重
    if (personalityId !== "emotional") {
      return cfg.weights;
    }

    // 情绪型：根据 mood 调制
    var base = cfg.weightsBase;
    var sens = cfg.moodSensitivities;
    var clampedMood = _clamp(mood || 0, -1.0, 1.0);

    // 维度名 -> 敏感度键名映射
    var dimToSensKey = {
      d1_ownTrain:   "s1_ownTrain",
      d2_mexican:    "s2_mexican",
      d3_block:      "s3_block",
      d4_pipRisk:    "s4_pipRisk",
      d5_diversity:  "s5_diversity",
      d6_empty:      "s6_empty",
      d7_double:     "s7_double",
      d8_selfBlock:  "s8_selfBlock"
    };

    var effective = {};
    var dims = Object.keys(base);
    for (var i = 0; i < dims.length; i++) {
      var d = dims[i];
      var sensitivity = sens[dimToSensKey[d]] || 0;
      var w = base[d] * (1.0 + clampedMood * sensitivity);
      effective[d] = _clamp(w, 0.0, 1.0);
    }
    return effective;
  }

  // ============================================================================
  // scoreMove
  // ============================================================================

  /**
   * 为一个合法出牌打分（8 维度加权求和）。
   *
   * @param {object} stateObj   - 完整游戏状态
   * @param {number} playerIndex - AI 玩家索引
   * @param {object} move       - { tileIndex, tile, trainId }
   * @param {object} weights    - getEffectiveWeights 的返回值
   * @returns {number} 综合得分
   */
  function scoreMove(stateObj, playerIndex, move, weights) {
    var hand = stateObj.hands[playerIndex];
    var tile = move.tile;
    var trainId = move.trainId;
    var handSizeBefore = hand.length;

    // 此移动后的剩余手牌（排除当前 tile）
    var remainingHand = [];
    for (var i = 0; i < hand.length; i++) {
      if (i !== move.tileIndex) {
        remainingHand.push(hand[i]);
      }
    }
    var handSizeAfter = remainingHand.length;

    // ---- 获取火车当前开放值 ----
    var openValue = _getTrainOpenValue(stateObj, trainId);

    /**
     * 辅助：获取 tile 的 pip 端点值列表（不含匹配值）
     * 如需查找与 openValue 匹配并得到新开放值，使用 engine 侧的匹配逻辑。
     * 这里用 DominoState.otherEnd 计算匹配端对应的另一端。
     */
    var newOpenValue = openValue;
    if (openValue >= 0 && DominoState.matches(tile, openValue)) {
      newOpenValue = DominoState.otherEnd(tile, openValue);
    }

    // ---- d1_ownTrain: 目标自己的火车 +1.0, 墨西哥火车 0.0, 其他人火车 -0.5 ----
    var d1_ownTrain = 0.0;
    if (trainId === "p" + playerIndex) {
      d1_ownTrain = 1.0;
    } else if (trainId === "mexican") {
      d1_ownTrain = 0.0;
    } else {
      d1_ownTrain = -0.5;
    }

    // ---- d2_mexican: 放到墨西哥火车 +1.0 ----
    var d2_mexican = (trainId === "mexican") ? 1.0 : 0.0;

    // ---- d3_block: 卡其他玩家火车 ----
    var d3_block = 0.0;
    var ownerIdx = _trainOwnerIndex(trainId);
    if (ownerIdx >= 0 && ownerIdx !== playerIndex) {
      var otherHandSize = stateObj.hands[ownerIdx] ? stateObj.hands[ownerIdx].length : 10;
      d3_block = 0.5 + (otherHandSize <= 3 ? 0.5 : 0.0);
    }

    // ---- d4_pipRisk: 点数越高风险越大，优先清掉 ----
    var pipsVal = DominoState.pips(tile);
    var d4_pipRisk = pipsVal / 18.0;

    // ---- d5_diversity: 剩余手牌中唯一 pip 值种类 / 剩余手牌数 ----
    var d5_diversity = 0.0;
    if (handSizeAfter > 0) {
      var uniquePips = {};
      for (var j = 0; j < remainingHand.length; j++) {
        var t = remainingHand[j];
        uniquePips[t[0]] = true;
        uniquePips[t[1]] = true;
      }
      var uniqueCount = Object.keys(uniquePips).length;
      d5_diversity = uniqueCount / handSizeAfter;
    }

    // ---- d6_empty: 清空奖励 ----
    var d6_empty = 0.0;
    if (handSizeAfter === 0) {
      d6_empty = 2.0;
    } else if (handSizeAfter <= 2) {
      d6_empty = 0.5;
    }

    // ---- d7_double: 双牌加分 ----
    var d7_double = DominoState.isDouble(tile) ? 0.3 : 0.0;

    // ---- d8_selfBlock: 自堵惩罚 ----
    var d8_selfBlock = 0.0;
    if (newOpenValue >= 0 && handSizeAfter > 0) {
      var matchCount = 0;
      for (var k = 0; k < remainingHand.length; k++) {
        if (DominoState.matches(remainingHand[k], newOpenValue)) {
          matchCount++;
        }
      }
      if (matchCount === 0) {
        d8_selfBlock = -1.0;      // 剩余牌完全无法接上
      } else if (matchCount <= 2) {
        d8_selfBlock = -0.3;      // 勉强能接
      } else {
        d8_selfBlock = 0.0;       // 充裕
      }
    }

    // 加权求和
    var score =
      d1_ownTrain   * (weights.d1_ownTrain   || 0) +
      d2_mexican    * (weights.d2_mexican    || 0) +
      d3_block      * (weights.d3_block      || 0) +
      d4_pipRisk    * (weights.d4_pipRisk    || 0) +
      d5_diversity  * (weights.d5_diversity  || 0) +
      d6_empty      * (weights.d6_empty      || 0) +
      d7_double     * (weights.d7_double     || 0) +
      d8_selfBlock  * (weights.d8_selfBlock  || 0);

    return score;
  }

  // ============================================================================
  // selectMove
  // ============================================================================

  /**
   * AI 选择最佳出牌。
   *
   * @param {object} stateObj   - 完整游戏状态
   * @param {number} playerIndex - AI 玩家索引
   * @returns {object|null} { tileIndex, tile, trainId, score } 或 null（无合法出牌）
   */
  function selectMove(stateObj, playerIndex) {
    var legalMoves = DominoEngine.getLegalMoves(stateObj, playerIndex);

    if (!legalMoves || legalMoves.length === 0) {
      return null;
    }

    // 仅一个选择时直接返回
    if (legalMoves.length === 1) {
      var onlyMove = legalMoves[0];
      return {
        tileIndex: onlyMove.tileIndex,
        tile: onlyMove.tile,
        trainId: onlyMove.trainId,
        score: 1.0
      };
    }

    var playerCfg = stateObj.players[playerIndex];
    var personalityId = playerCfg.personality;
    var mood = _getMood(stateObj, playerIndex);
    var weights = getEffectiveWeights(personalityId, mood);

    // 为每个合法出牌打分
    var scored = [];
    for (var i = 0; i < legalMoves.length; i++) {
      var move = legalMoves[i];
      var baseScore = scoreMove(stateObj, playerIndex, move, weights);
      // 添加 ±5% 随机因子以产生变化
      var score = baseScore * (0.95 + Math.random() * 0.1);
      scored.push({
        tileIndex: move.tileIndex,
        tile: move.tile,
        trainId: move.trainId,
        score: score
      });
    }

    // 按得分降序排列
    scored.sort(function(a, b) {
      return b.score - a.score;
    });

    return scored[0];
  }

  // ============================================================================
  // selectMessage
  // ============================================================================

  /**
   * 根据情景与性格选取对话文本。
   *
   * @param {object} stateObj   - 完整游戏状态
   * @param {number} playerIndex - AI 玩家索引
   * @param {string} context    - 情景标签（on_good_play, on_draw 等）
   * @returns {string} 对话文本
   */
  function selectMessage(stateObj, playerIndex, context) {
    var playerCfg = stateObj.players[playerIndex];
    var personalityId = playerCfg.personality;
    var cfg = DominoConfig.PERSONALITIES[personalityId];

    if (!cfg || !cfg.messagePools) {
      return "...";
    }

    var pool = cfg.messagePools[context];
    if (!pool) {
      // 尝试回退到 on_good_play
      pool = cfg.messagePools["on_good_play"];
      if (!pool) return "...";
    }

    // 情绪型需要按 mood 选取正/负面子池
    if (personalityId === "emotional") {
      var mood = _getMood(stateObj, playerIndex);
      var subPool;
      if (mood > 0.3) {
        subPool = pool.positive;
      } else if (mood < -0.3) {
        subPool = pool.negative;
      } else {
        // 中性情绪：随机合并两个子池
        var combined = (pool.positive || []).concat(pool.negative || []);
        if (combined.length === 0) return "...";
        return combined[Math.floor(Math.random() * combined.length)];
      }
      if (!subPool || subPool.length === 0) return "...";
      return subPool[Math.floor(Math.random() * subPool.length)];
    }

    // 保守型 / 冒险型：pool 直接是字符串数组
    if (Array.isArray(pool) && pool.length > 0) {
      return pool[Math.floor(Math.random() * pool.length)];
    }

    return "...";
  }

  // ============================================================================
  // determineContext
  // ============================================================================

  /**
   * 根据刚发生的动作确定情景标签。
   *
   * @param {object} stateObj     - 完整游戏状态
   * @param {number} playerIndex  - AI 玩家索引
   * @param {object} actionResult - Engine 返回的动作结果
   *   { played, wasDouble, satisfiedDouble, drawn, passed, handEmpty, trainId }
   * @returns {string} 情景标签
   */
  function determineContext(stateObj, playerIndex, actionResult) {
    var hand = stateObj.hands[playerIndex];
    var handSize = hand ? hand.length : 0;

    // 赢得本局（手牌清空）
    if (actionResult.played && actionResult.handEmpty) {
      return "on_win_round";
    }

    // 打出双牌
    if (actionResult.wasDouble) {
      return "on_double";
    }

    // 满足双牌规则
    if (actionResult.satisfiedDouble) {
      return "on_good_play";
    }

    // 打出到其他玩家的火车（封锁）
    if (actionResult.played && actionResult.trainId) {
      var ownerIdx = _trainOwnerIndex(actionResult.trainId);
      if (ownerIdx >= 0 && ownerIdx !== playerIndex) {
        return "on_block_other";
      }
    }

    // 摸牌后打出了
    if (actionResult.drawn && actionResult.played) {
      return "on_draw_useful";
    }

    // 摸牌后没打出
    if (actionResult.drawn && !actionResult.played) {
      return "on_draw_useless";
    }

    // 仅摸牌
    if (actionResult.drawn && !actionResult.played && !actionResult.passed) {
      return "on_draw_useless";
    }

    // 有打出（通用 good play）
    if (actionResult.played) {
      return "on_good_play";
    }

    // 跳过
    if (actionResult.passed) {
      return "on_pass";
    }

    // 手牌接近胜利
    if (handSize > 0 && handSize <= 2) {
      return "on_near_victory";
    }

    // 摸牌（无其他信息时）
    if (actionResult.drawn) {
      return "on_draw";
    }

    return "on_good_play";
  }

  // ============================================================================
  // updateMood
  // ============================================================================

  /**
   * 更新情绪型 AI 的心情值。
   *
   * @param {object} stateObj    - 完整游戏状态
   * @param {number} playerIndex - AI 玩家索引
   * @param {string} eventType   - 事件类型标签
   *   play_double, satisfy_double, open_other_train, draw_useful,
   *   draw_useless, own_train_blocked, others_play_on_mine,
   *   other_player_wins_round, ai_wins_round, hand_below_3
   * @returns {number} 更新后的 mood 值
   */
  function updateMood(stateObj, playerIndex, eventType) {
    var aiState = _getAIState(stateObj, playerIndex);
    var mood = aiState.mood;

    var delta = DominoConfig.MOOD_DELTAS[eventType];
    if (delta === undefined) {
      delta = 0;
    }

    // 应用增量
    mood += delta;

    // 限制到 [-1.0, 1.0]
    mood = _clamp(mood, -1.0, 1.0);

    // 惯性衰减（向 0 漂移）
    mood *= 0.9;

    // 持久化
    aiState.mood = mood;

    // 记录历史（保留最近 20 条）
    if (!aiState.moodHistory) {
      aiState.moodHistory = [];
    }
    aiState.moodHistory.push(mood);
    if (aiState.moodHistory.length > 20) {
      aiState.moodHistory.shift();
    }

    // 设置最后事件类型
    aiState.lastEventType = eventType;

    return mood;
  }

  // ============================================================================
  // getMoodEmoji
  // ============================================================================

  /**
   * 根据情绪值返回对应颜文字。
   * 委托 DominoConfig.getMoodEmoji 以保持一致性。
   *
   * @param {object} stateObj    - 完整游戏状态
   * @param {number} playerIndex - AI 玩家索引
   * @returns {string} 颜文字
   */
  function getMoodEmoji(stateObj, playerIndex) {
    var mood = _getMood(stateObj, playerIndex);
    return DominoConfig.getMoodEmoji(mood);
  }

  // ============================================================================
  // getThinkingDelay
  // ============================================================================

  /**
   * 获取 AI"思考"延迟（毫秒），模拟真人思考时间。
   *
   * @param {object} stateObj    - 完整游戏状态
   * @param {number} playerIndex - AI 玩家索引
   * @returns {number} 延迟毫秒数
   */
  function getThinkingDelay(stateObj, playerIndex) {
    var playerCfg = stateObj.players[playerIndex];
    var personalityId = playerCfg.personality;
    var cfg = DominoConfig.PERSONALITIES[personalityId];

    if (!cfg || !cfg.thinkDelay) {
      return 600; // 默认
    }

    var min = cfg.thinkDelay.min;
    var max = cfg.thinkDelay.max;

    // 情绪型：根据心情调整延迟
    if (personalityId === "emotional") {
      var mood = _getMood(stateObj, playerIndex);
      if (mood > 0.3) {
        // 心情好，反应快
        min *= 0.8;
        max *= 0.8;
      } else if (mood < -0.3) {
        // 心情差，犹豫
        min *= 1.2;
        max *= 1.2;
      }
    }

    return min + Math.random() * (max - min);
  }

  // ============================================================================
  // 公开 API
  // ============================================================================
  return {
    selectMove: selectMove,
    scoreMove: scoreMove,
    getEffectiveWeights: getEffectiveWeights,
    selectMessage: selectMessage,
    determineContext: determineContext,
    updateMood: updateMood,
    getMoodEmoji: getMoodEmoji,
    getThinkingDelay: getThinkingDelay
  };

})();
