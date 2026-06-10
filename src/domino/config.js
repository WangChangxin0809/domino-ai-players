// file: src/domino/config.js
// 墨西哥火车多米诺 — 全局配置与数据定义

const DominoConfig = (function() {
  "use strict";

  // ============================================================================
  // 常量
  // ============================================================================
  var TILE_RANGE = 9;
  var TOTAL_TILES = 55;
  var HAND_SIZE = 10;
  var PLAYER_COUNT = 4;
  var TARGET_SCORE = 100;
  var BONEYARD_START = 15;

  // ============================================================================
  // 骨牌生成
  // ============================================================================
  function generateTiles() {
    var tiles = [];
    for (var a = 0; a <= TILE_RANGE; a++) {
      for (var b = a; b <= TILE_RANGE; b++) {
        tiles.push([a, b]);
      }
    }
    return tiles;
  }

  // ============================================================================
  // 玩家配置
  // ============================================================================
  var PLAYERS = [
    { index: 0, name: "你", type: "human", personality: "human", emoji: "🧑", color: "#4fc3f7" },
    { index: 1, name: "老稳", type: "ai", personality: "conservative", emoji: "🐢", color: "#81c784" },
    { index: 2, name: "小冲", type: "ai", personality: "aggressive", emoji: "🔥", color: "#e57373" },
    { index: 3, name: "大悲大喜", type: "ai", personality: "emotional", emoji: "🎭", color: "#ffb74d" }
  ];

  // ============================================================================
  // 个性配置
  // ============================================================================

  // --- 保守型 ---
  var conservativeWeights = {
    d1_ownTrain: 0.40,
    d2_mexican: 0.10,
    d3_block: 0.05,
    d4_pipRisk: 0.25,
    d5_diversity: 0.10,
    d6_empty: 0.05,
    d7_double: 0.00,
    d8_selfBlock: 0.05
  };

  var conservativeMessages = {
    on_good_play: [
      "这一步，经过了深思熟虑。",
      "稳扎稳打，不急。",
      "这步棋还不错。",
      "按计划进行。",
      "从容应对。"
    ],
    on_draw: [
      "摸一张试试。",
      "伺机而动。",
      "不急，慢慢来。",
      "留得青山在。",
      "稳中求胜。"
    ],
    on_pass: [
      "过一手也好。",
      "宁可不过，不可躁进。",
      "以退为进。",
      "此时不必勉强。",
      "稳住就是胜利。"
    ],
    on_double: [
      "双牌在手，且行且珍惜。",
      "放一个双牌。",
      "这把稳了。",
      "双重出击。",
      "先拿下这个双牌。"
    ],
    on_block_other: [
      "封锁成功。",
      "料敌先机。",
      "截断你的路。",
      "他跑不了了。",
      "以守为攻。"
    ],
    on_blocked: [
      "意料之中的阻力。",
      "有备无患。",
      "不妨事。",
      "从容应对。",
      "换个方向便是。"
    ],
    on_win_round: [
      "胜败乃常事，不失本心。",
      "步步为营，水到渠成。",
      "这一局拿下了。",
      "稳中求胜。",
      "大功告成。"
    ],
    on_lose_round: [
      "下次再来。",
      "胜不骄败不馁。",
      "一时的失利而已。",
      "总结经验。",
      "来日方长。"
    ],
    on_near_victory: [
      "胜利就在前方。",
      "最后一搏。",
      "不要大意。",
      "守住优势。",
      "终点不远了。"
    ],
    on_draw_useful: [
      "正中下怀。",
      "这牌来得正好。",
      "如虎添翼。",
      "资源在手。",
      "不愁没法了。"
    ],
    on_draw_useless: [
      "暂时用不上。",
      "耐心等待机会。",
      "留着也是储备。",
      "且放一旁。",
      "终有用武之地。"
    ]
  };

  // --- 冒险型 ---
  var aggressiveWeights = {
    d1_ownTrain: 0.10,
    d2_mexican: 0.05,
    d3_block: 0.30,
    d4_pipRisk: 0.05,
    d5_diversity: 0.05,
    d6_empty: 0.30,
    d7_double: 0.15,
    d8_selfBlock: 0.00
  };

  var aggressiveMessages = {
    on_good_play: [
      "闪电出击！",
      "看你怎么办！",
      "就是这样！",
      "一鼓作气！",
      "根本没在怕的！"
    ],
    on_draw: [
      "再来一张！",
      "手气不能停！",
      "拼一把！",
      "赌博时间！",
      "给我来张好的！"
    ],
    on_pass: [
      "让你跑一回。",
      "侥幸而已。",
      "这不算什么。",
      "过吧过吧。",
      "下次没这么好运。"
    ],
    on_double: [
      "接招吧你！",
      "双倍奉还！",
      "火力全开！",
      "这个双牌必须出！",
      "压场了！"
    ],
    on_block_other: [
      "跑不掉了吧！",
      "封锁线已完成。",
      "断了你的路。",
      "哈哈，原地踏步吧你！",
      "束手就擒！"
    ],
    on_blocked: [
      "雕虫小技。",
      "不过如此。",
      "正面突破就是。",
      "挡不住我的。",
      "这点障碍算什么。"
    ],
    on_win_round: [
      "势不可挡！",
      "赢麻了！",
      "毫无悬念！",
      "轻松拿下！",
      "就这？"
    ],
    on_lose_round: [
      "失误而已，下把赢回来。",
      "不服再来！",
      "让你一局无妨。",
      "运气罢了。",
      "胜败常事，笑到最后的才是赢家。"
    ],
    on_near_victory: [
      "快了快了！",
      "准备庆祝！",
      "胜利触手可及！",
      "最后一击！",
      "冲啊！"
    ],
    on_draw_useful: [
      "天助我也！",
      "完美！",
      "正缺这个！",
      "好牌到位！",
      "来得好不如来得巧！"
    ],
    on_draw_useless: [
      "废牌一张！",
      "运气真背！",
      "罢了罢了。",
      "下张一定行。",
      "攒人品中。"
    ]
  };

  // --- 情绪型 ---
  var emotionalWeightsBase = {
    d1_ownTrain: 0.20,
    d2_mexican: 0.15,
    d3_block: 0.15,
    d4_pipRisk: 0.15,
    d5_diversity: 0.10,
    d6_empty: 0.15,
    d7_double: 0.05,
    d8_selfBlock: 0.05
  };

  var emotionalMoodSensitivities = {
    s1_ownTrain: 0.25,
    s2_mexican: 0.20,
    s3_block: -0.30,
    s4_pipRisk: 0.30,
    s5_diversity: 0.15,
    s6_empty: 0.20,
    s7_double: -0.25,
    s8_selfBlock: 0.30
  };

  var emotionalMessages = {
    on_good_play: {
      positive: [
        "这步走得漂亮！✨",
        "神来之笔！",
        "今天状态真好！✨",
        "感觉棒极了！",
        "意料之外的妙招！"
      ],
      negative: [
        "还行吧。",
        "也就那样。",
        "一般操作。",
        "凑合能用。",
        "勉勉强强。"
      ]
    },
    on_draw: {
      positive: [
        "摸一张试试手气！",
        "期待好运降临！",
        "好的开始！",
        "信手拈来！",
        "抽牌的感觉真好！"
      ],
      negative: [
        "烦死了...又要摸牌。",
        "这什么时候是个头。",
        "随便摸一张吧。",
        "麻了。",
        "不想摸了..."
      ]
    },
    on_pass: {
      positive: [
        "过一手让你一让~ 😊",
        "礼尚往来嘛！",
        "我这叫风度！",
        "让让更健康！",
        "给你放个水而已。"
      ],
      negative: [
        "居然过不了...😤",
        "这什么运气啊😤",
        "烦！",
        "我太难了！",
        "自闭了。"
      ]
    },
    on_double: {
      positive: [
        "双牌！大展神威！🎉",
        "双倍的力量！",
        "天赐良机！双牌！",
        "好耶！出双牌！",
        "双牌在手，天下我有！"
      ],
      negative: [
        "又是双牌...压力大。",
        "这双牌我可能搞不定。",
        "别给我双牌了😭",
        "好烦，又是双牌。",
        "能不能换一张。"
      ]
    },
    on_block_other: {
      positive: [
        "卡住你了！😁",
        "嘿嘿，别怪我哦~",
        "完美封锁！",
        "抱歉啦，自己的路要紧！",
        "不好意思，这一步我必须走！"
      ],
      negative: [
        "卡住你了又怎样。",
        "随便走一步。",
        "不是故意挡你的。",
        "别恨我...",
        "我也是没办法。"
      ]
    },
    on_blocked: {
      positive: [
        "没关系，换个思路~",
        "小意思，再来！",
        "还早呢，不慌！",
        "这点事不算啥。",
        "乐观一点，总有办法！"
      ],
      negative: [
        "太过分了😡",
        "为什么堵我...",
        "还能不能好了！",
        "气死我了！😤",
        "这还有公平可言吗？！"
      ]
    },
    on_win_round: {
      positive: [
        "赢啦！🏆",
        "太开心了！🎉",
        "我做到了！",
        "胜利的喜悦！",
        "今天是我的幸运日！🌟"
      ],
      negative: [
        "总算赢了...",
        "赢一局不容易。",
        "艰难取胜。",
        "来得太晚了些。",
        "无所谓了吧。"
      ]
    },
    on_lose_round: {
      positive: [
        "没事，下把赢回来！",
        "享受过程就好！",
        "重在参与！",
        "笑对失败！😊",
        "输赢乃兵家常事！"
      ],
      negative: [
        "又是一局白打...",
        "不玩了！！",
        "这也太悲催了吧😭",
        "难过死了...",
        "为什么输的总是我！"
      ]
    },
    on_near_victory: {
      positive: [
        "胜利在望！加油！🎉",
        "就差一点了！",
        "全力以赴！",
        "这一刻等了很久！",
        "冲啊！胜利！"
      ],
      negative: [
        "别高兴太早...",
        "万一又翻车呢。",
        "不敢相信。",
        "希望别出意外。",
        "紧张死了..."
      ]
    },
    on_draw_useful: {
      positive: [
        "运气爆棚！🎉",
        "正合我意！",
        "完美抽牌！",
        "老天爷在帮我！",
        "这就是缘分！✨"
      ],
      negative: [
        "还算凑合。",
        "勉强能用。",
        "聊胜于无。",
        "好吧，不挑。",
        "总比没有强。"
      ]
    },
    on_draw_useless: {
      positive: [
        "白费力气。",
        "手气不佳呢。",
        "风水轮流转。",
        "呃...再试试吧。",
        "下回合转运！"
      ],
      negative: [
        "怎么又是烂牌！😤",
        "这叫什么事！",
        "有毒吧这牌堆！",
        "气到裂开！",
        "绷不住了😭"
      ]
    }
  };

  var thinkDelays = {
    conservative: { min: 800, max: 1500 },
    aggressive: { min: 400, max: 800 },
    emotional: { min: 600, max: 1200 }
  };

  var PERSONALITIES = {
    conservative: {
      id: "conservative",
      name: "保守型",
      emoji: "🐢",
      thinkDelay: thinkDelays.conservative,
      weights: conservativeWeights,
      messagePools: conservativeMessages
    },
    aggressive: {
      id: "aggressive",
      name: "冒险型",
      emoji: "🔥",
      thinkDelay: thinkDelays.aggressive,
      weights: aggressiveWeights,
      messagePools: aggressiveMessages
    },
    emotional: {
      id: "emotional",
      name: "情绪型",
      emoji: "🎭",
      thinkDelay: thinkDelays.emotional,
      weightsBase: emotionalWeightsBase,
      moodSensitivities: emotionalMoodSensitivities,
      messagePools: emotionalMessages
    }
  };

  // ============================================================================
  // 情绪事件增量
  // ============================================================================
  var MOOD_DELTAS = {
    play_double: 0.15,
    satisfy_double: 0.10,
    open_other_train: 0.12,
    draw_useful: 0.08,
    draw_useless: -0.10,
    own_train_blocked: -0.15,
    others_play_on_mine: -0.20,
    other_player_wins_round: -0.25,
    ai_wins_round: 0.50,
    hand_below_3: 0.10
  };

  // ============================================================================
  // 情绪颜文字映射
  // ============================================================================
  var MOOD_EMOJI_MAP = [
    { threshold: 0.5, emoji: "😄" },
    { threshold: 0.2, emoji: "😊" },
    { threshold: -0.2, emoji: "😐" },
    { threshold: -0.5, emoji: "😤" }
  ];

  function getMoodEmoji(mood) {
    if (mood > 0.5)       return "😄";
    if (mood > 0.2)       return "😊";
    if (mood > -0.2)      return "😐";
    if (mood > -0.5)      return "😤";
    else                   return "😡";
  }

  // ============================================================================
  // 火车 ID 常量
  // ============================================================================
  var TRAIN_IDS = {
    PERSONAL_TRAINS: ["p0", "p1", "p2", "p3"],
    MEXICAN_TRAIN: "mexican",
    ALL_TRAINS: ["p0", "p1", "p2", "p3", "mexican"]
  };

  // ============================================================================
  // 公开 API
  // ============================================================================
  return {
    // 常量
    TILE_RANGE: TILE_RANGE,
    TOTAL_TILES: TOTAL_TILES,
    HAND_SIZE: HAND_SIZE,
    PLAYER_COUNT: PLAYER_COUNT,
    TARGET_SCORE: TARGET_SCORE,
    BONEYARD_START: BONEYARD_START,

    // 方法
    generateTiles: generateTiles,
    getMoodEmoji: getMoodEmoji,

    // 数据
    PLAYERS: PLAYERS,
    PERSONALITIES: PERSONALITIES,
    MOOD_DELTAS: MOOD_DELTAS,
    MOOD_EMOJI_MAP: MOOD_EMOJI_MAP,
    TRAIN_IDS: TRAIN_IDS
  };

})();
