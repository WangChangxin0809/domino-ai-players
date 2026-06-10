// file: src/domino/engine.js
// Mexican Train Domino — Game Engine Module
// Depends on: DominoConfig, DominoState (already loaded)

const DominoEngine = (function() {

  // ─── Tile Generation ───────────────────────────────────────────

  /** Generate all 55 tiles for a double-9 domino set. */
  function _generateAllTiles() {
    const tiles = [];
    for (let i = 0; i <= 9; i++) {
      for (let j = i; j <= 9; j++) {
        tiles.push([i, j]);
      }
    }
    return tiles;
  }

  // ─── initRound ─────────────────────────────────────────────────

  /**
   * Reset state for a new round. Modifies the existing stateObj in place.
   * - Shuffles and deals tiles to all players.
   * - Finds the highest double across all hands as the engine.
   * - Places the engine on the Mexican train.
   * - Initializes train open values and flags.
   */
  function initRound(stateObj) {
    const allTiles = DominoState.shuffleTiles(_generateAllTiles());
    const { players, trains } = stateObj;

    // Deal HAND_SIZE tiles to each player
    const handSize = DominoConfig.HAND_SIZE;
    for (let i = 0; i < players.length; i++) {
      players[i].hand = allTiles.splice(0, handSize);
    }

    // Remaining tiles become the boneyard
    stateObj.boneyard = allTiles.slice();

    // Find the engine — the highest-value double across all hands
    let bestDouble = null;
    let bestValue = -1;
    let enginePlayerIndex = -1;

    for (let i = 0; i < players.length; i++) {
      const hand = players[i].hand;
      for (let tileIdx = 0; tileIdx < hand.length; tileIdx++) {
        const tile = hand[tileIdx];
        if (DominoState.isDouble(tile)) {
          const val = tile[0];
          if (val > bestValue) {
            bestValue = val;
            bestDouble = tile;
            enginePlayerIndex = i;
          }
        }
      }
    }

    // Remove engine tile from its owner's hand
    if (enginePlayerIndex >= 0 && bestDouble) {
      const engineHand = players[enginePlayerIndex].hand;
      const engIdx = engineHand.findIndex(
        t => t[0] === bestDouble[0] && t[1] === bestDouble[1]
      );
      if (engIdx >= 0) {
        engineHand.splice(engIdx, 1);
      }
    }

    stateObj.engineValue = bestValue;
    stateObj.currentPlayerIndex = enginePlayerIndex;
    stateObj.pendingDoublePlayer = null;
    stateObj.pendingDoubleTrainId = null;

    // Place the engine tile on the Mexican train
    const mexicanTrain = trains.find(t => t.id === "mexican");
    if (mexicanTrain && bestDouble) {
      mexicanTrain.tiles = [bestDouble];
    }

    // Initialize all trains
    for (const train of trains) {
      train.openValue = bestValue;
      train.hasUnsatisfiedDouble = false;
      train.unsatisfiedDoubleValue = null;
      if (train.id === "mexican") {
        train.isPublic = true;
        if (!train.tiles || train.tiles.length === 0) {
          train.tiles = bestDouble ? [bestDouble] : [];
        }
      } else {
        train.isPublic = false;
        train.tiles = [];
      }
    }

    // Set initial phase
    stateObj.phase = _phaseForPlayer(players[enginePlayerIndex]);
  }

  // ─── getLegalMoves ─────────────────────────────────────────────

  /**
   * Returns all legal moves for a player as {tileIndex, tile, trainId, train}.
   * Handles pending-double logic: the player who played the double MUST attempt
   * to satisfy it on their extra turn; other players try to satisfy first,
   * falling back to normal play if they cannot.
   */
  function getLegalMoves(stateObj, playerIndex) {
    const { players, trains, pendingDoublePlayer, pendingDoubleTrainId } = stateObj;
    const player = players[playerIndex];
    const hand = player.hand;

    // First pass: collect all valid (tile, train) pairs ignoring double restrictions
    const rawMoves = [];

    for (let tileIndex = 0; tileIndex < hand.length; tileIndex++) {
      const tile = hand[tileIndex];

      for (const train of trains) {
        // Accessibility check
        if (train.ownerIndex !== playerIndex && train.id !== "mexican" && !train.isPublic) {
          continue;
        }

        // Blocked by the train's own unsatisfied double?
        if (train.hasUnsatisfiedDouble && !DominoState.matches(tile, train.unsatisfiedDoubleValue)) {
          continue;
        }

        // Must match the train's open value
        if (!DominoState.matches(tile, train.openValue)) {
          continue;
        }

        rawMoves.push({ tileIndex, tile, trainId: train.id, train });
      }
    }

    // Apply pending-double restrictions
    if (pendingDoublePlayer !== null && pendingDoubleTrainId !== null) {
      const pendingTrain = trains.find(t => t.id === pendingDoubleTrainId);
      const doubleValue = pendingTrain ? pendingTrain.unsatisfiedDoubleValue : null;

      if (playerIndex === pendingDoublePlayer) {
        // This player MUST satisfy their own double — only those moves permitted
        return rawMoves.filter(
          m => m.trainId === pendingDoubleTrainId && DominoState.matches(m.tile, doubleValue)
        );
      } else {
        // Other players: try to satisfy the double first
        const satisfyingMoves = rawMoves.filter(
          m => m.trainId === pendingDoubleTrainId && DominoState.matches(m.tile, doubleValue)
        );
        if (satisfyingMoves.length > 0) {
          return satisfyingMoves; // Must satisfy — only return these
        }
        // Cannot satisfy — return all moves (may be empty)
      }
    }

    return rawMoves;
  }

  // ─── executePlay ───────────────────────────────────────────────

  /**
   * Execute a play action from a player's hand onto a train.
   * Returns {tile, wasDouble, satisfiedDouble, handEmpty}.
   */
  function executePlay(stateObj, playerIndex, tileIndex, trainId) {
    const { players, trains } = stateObj;
    const player = players[playerIndex];
    const train = trains.find(t => t.id === trainId);

    // Remove tile from hand
    const tile = player.hand.splice(tileIndex, 1)[0];

    // Determine new open value
    const newOpenValue = DominoState.otherEnd(tile, train.openValue);

    // Record that we are satisfying a previously unsatisfied double
    const wasSatisfying = train.hasUnsatisfiedDouble;

    // Place tile on train
    train.tiles.push(tile);
    train.openValue = newOpenValue;

    // Double logic
    if (DominoState.isDouble(tile)) {
      train.hasUnsatisfiedDouble = true;
      train.unsatisfiedDoubleValue = tile[0];
      stateObj.pendingDoublePlayer = playerIndex;
      stateObj.pendingDoubleTrainId = trainId;
      return {
        tile: tile,
        wasDouble: true,
        satisfiedDouble: false,
        handEmpty: player.hand.length === 0
      };
    }

    // Satisfying a previous double (tile itself is not a double)
    if (wasSatisfying) {
      train.hasUnsatisfiedDouble = false;
      train.unsatisfiedDoubleValue = null;
      stateObj.pendingDoublePlayer = null;
      stateObj.pendingDoubleTrainId = null;
      return {
        tile: tile,
        wasDouble: false,
        satisfiedDouble: true,
        handEmpty: player.hand.length === 0
      };
    }

    // Normal non-double play
    return {
      tile: tile,
      wasDouble: false,
      satisfiedDouble: false,
      handEmpty: player.hand.length === 0
    };
  }

  // ─── executeDraw ───────────────────────────────────────────────

  /**
   * Player draws from the boneyard. If the drawn tile can be legally played,
   * it is automatically played. Otherwise it is added to the player's hand and
   * the player's personal train is marked public.
   * Returns {tile, played, ...playResult} or null if boneyard is empty.
   */
  function executeDraw(stateObj, playerIndex) {
    const { players, trains } = stateObj;

    if (stateObj.boneyard.length === 0) {
      return null;
    }

    const tile = stateObj.boneyard.pop();
    const player = players[playerIndex];

    // Temporarily add tile to hand so getLegalMoves can find it
    player.hand.push(tile);
    const legalMoves = getLegalMoves(stateObj, playerIndex);
    const tileMoves = legalMoves.filter(m => {
      const t = m.tile;
      return t[0] === tile[0] && t[1] === tile[1];
    });

    if (tileMoves.length > 0) {
      // Remove the just-added tile so executePlay's splice uses the right index
      player.hand.pop();
      const tempIdx = player.hand.length; // append, then play from that index
      player.hand.push(tile);
      const playResult = executePlay(stateObj, playerIndex, tempIdx, tileMoves[0].trainId);
      return {
        tile: tile,
        played: true,
        wasDouble: playResult.wasDouble,
        satisfiedDouble: playResult.satisfiedDouble,
        trainId: tileMoves[0].trainId
      };
    }

    // Cannot play — tile stays in hand, personal train becomes public
    // (tile was already pushed, so leave it there)
    const personalTrain = trains.find(t => t.ownerIndex === playerIndex && t.id !== "mexican");
    if (personalTrain) {
      personalTrain.isPublic = true;
    }
    return {
      tile: tile,
      played: false
    };
  }

  // ─── executePass ───────────────────────────────────────────────

  /**
   * Player passes their turn. Their personal train is marked public (open
   * for others to play on). Returns true.
   */
  function executePass(stateObj, playerIndex) {
    const { trains } = stateObj;
    const personalTrain = trains.find(t => t.ownerIndex === playerIndex && t.id !== "mexican");
    if (personalTrain) {
      personalTrain.isPublic = true;
    }
    return true;
  }

  // ─── advanceTurn ───────────────────────────────────────────────

  /**
   * Advance to the next player after the current turn.
   * - If a double was just played (pendingDoublePlayer === currentPlayerIndex),
   *   the same player gets an extra turn to satisfy it.
   * - Otherwise, rotate to the next player.
   */
  function advanceTurn(stateObj) {
    const { players, pendingDoublePlayer } = stateObj;

    if (pendingDoublePlayer !== null && pendingDoublePlayer === stateObj.currentPlayerIndex) {
      // Same player gets an extra turn — phase stays the same
      return;
    }

    // Advance to next player
    const nextIndex = (stateObj.currentPlayerIndex + 1) % players.length;
    stateObj.currentPlayerIndex = nextIndex;
    stateObj.phase = _phaseForPlayer(players[nextIndex]);
  }

  // ─── isRoundOver ───────────────────────────────────────────────

  /**
   * A round ends when any player runs out of tiles, OR when the boneyard is
   * empty and no player has a legal move (stalemate).
   */
  function isRoundOver(stateObj) {
    const { players } = stateObj;

    // Any player with empty hand ends the round
    for (const player of players) {
      if (player.hand.length === 0) {
        return true;
      }
    }

    // Boneyard empty and no player can move
    if (stateObj.boneyard.length === 0) {
      for (let i = 0; i < players.length; i++) {
        if (getLegalMoves(stateObj, i).length > 0) {
          return false;
        }
      }
      return true;
    }

    return false;
  }

  // ─── scoreRound ────────────────────────────────────────────────

  /**
   * Calculate and record round scores. Each player's score is the sum of
   * pips on tiles remaining in their hand (0 for the player who emptied
   * their hand). Pushes scores to each player's scoreHistory and totalScore.
   * Returns an array of round scores keyed by player index.
   */
  function scoreRound(stateObj) {
    const { players } = stateObj;
    const roundScores = [];

    for (let i = 0; i < players.length; i++) {
      const hand = players[i].hand;
      let score = 0;
      for (const tile of hand) {
        score += DominoState.pips(tile);
      }
      // Player with empty hand scores 0 (already handled — loop gives 0)
      players[i].scoreHistory.push(score);
      players[i].totalScore += score;
      roundScores.push(score);
    }

    return roundScores;
  }

  // ─── isGameOver ────────────────────────────────────────────────

  /**
   * The game ends when any player's total score reaches or exceeds the
   * target score (TARGET_SCORE from DominoConfig). Sets stateObj.gameOver
   * and stateObj.winner (player with lowest total score).
   */
  function isGameOver(stateObj) {
    const target = DominoConfig.TARGET_SCORE;
    const { players } = stateObj;

    for (const player of players) {
      if (player.totalScore >= target) {
        stateObj.gameOver = true;
        // Winner is the player with the lowest total score
        let bestPlayer = players[0];
        for (let i = 1; i < players.length; i++) {
          if (players[i].totalScore < bestPlayer.totalScore) {
            bestPlayer = players[i];
          }
        }
        stateObj.winner = bestPlayer;
        return true;
      }
    }

    return false;
  }

  // ─── getWinner ─────────────────────────────────────────────────

  /**
   * Returns the player with the lowest total score, or null if scores
   * are not yet available.
   */
  function getWinner(stateObj) {
    const { players } = stateObj;
    if (!players || players.length === 0) return null;

    let best = players[0];
    for (let i = 1; i < players.length; i++) {
      if (players[i].totalScore < best.totalScore) {
        best = players[i];
      }
    }
    return best;
  }

  // ─── Internal Helpers ──────────────────────────────────────────

  /**
   * Determine the correct phase string for a player based on their type.
   */
  function _phaseForPlayer(player) {
    if (!player) return "waiting_human";
    if (player.type === "human") return "waiting_human";
    return "ai_thinking";
  }

  // ─── Public API ────────────────────────────────────────────────

  return {
    initRound: initRound,
    getLegalMoves: getLegalMoves,
    executePlay: executePlay,
    executeDraw: executeDraw,
    executePass: executePass,
    advanceTurn: advanceTurn,
    isRoundOver: isRoundOver,
    scoreRound: scoreRound,
    isGameOver: isGameOver,
    getWinner: getWinner
  };

})();
