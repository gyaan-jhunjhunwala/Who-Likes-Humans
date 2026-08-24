import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:4000';

async function runTest() {
  console.log('🧪 Starting End-to-End CAH Multiplayer Simulation Test...\n');

  // Create 3 player sockets
  const socketHost = io(SERVER_URL, { transports: ['websocket'] });
  const socketPlayer2 = io(SERVER_URL, { transports: ['websocket'] });
  const socketPlayer3 = io(SERVER_URL, { transports: ['websocket'] });

  let hostRoomCode = '';
  let currentCzarId = '';
  let blackCardPick = 1;
  let player2Hand = [];
  let player3Hand = [];

  // Wait for connections
  await new Promise((resolve) => setTimeout(resolve, 800));

  // 1. Host creates room
  console.log('1️⃣ Host creating room...');
  socketHost.emit('room:create', {
    playerName: 'Alice (Host)',
    settings: { scoreLimit: 3, selectionTimeout: 10, judgingTimeout: 10, deckIds: ['base', 'geek'] },
  });

  await new Promise((resolve) => {
    socketHost.on('room:state_sync', (state) => {
      if (!hostRoomCode && state.roomCode) {
        hostRoomCode = state.roomCode;
        console.log(`✅ Room created successfully with Code: ${hostRoomCode}`);
        resolve();
      }
    });
  });

  // 2. Players 2 & 3 join room
  console.log('\n2️⃣ Bob and Charlie joining room...');
  socketPlayer2.emit('room:join', { roomCode: hostRoomCode, playerName: 'Bob' });
  socketPlayer3.emit('room:join', { roomCode: hostRoomCode, playerName: 'Charlie' });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 3. Host starts game
  console.log('\n3️⃣ Host starting match...');
  socketPlayer2.on('game:hand_sync', ({ cards }) => {
    player2Hand = cards;
  });
  socketPlayer3.on('game:hand_sync', ({ cards }) => {
    player3Hand = cards;
  });

  socketHost.emit('game:start', { roomCode: hostRoomCode });

  // Wait for game round started
  let submissionsReceived = null;
  await new Promise((resolve) => {
    socketHost.on('room:state_sync', (state) => {
      if (state.status === 'SELECTING' && state.blackCard) {
        currentCzarId = state.czarId;
        blackCardPick = state.blackCard.pick;
        console.log(`✅ Round ${state.roundNumber} started! Black card: "${state.blackCard.text}" (Pick ${blackCardPick})`);
        console.log(`👑 Assigned Card Czar ID: ${currentCzarId}`);
        resolve();
      }
    });
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 4. Non-Czar players submit cards
  console.log('\n4️⃣ Submitting cards from non-Czar players...');
  if (player2Hand.length > 0) {
    const cardIds = player2Hand.slice(0, blackCardPick).map((c) => c.id);
    socketPlayer2.emit('card:submit', { roomCode: hostRoomCode, cardIds });
    console.log(`📨 Bob submitted ${cardIds.length} card(s).`);
  }
  if (player3Hand.length > 0) {
    const cardIds = player3Hand.slice(0, blackCardPick).map((c) => c.id);
    socketPlayer3.emit('card:submit', { roomCode: hostRoomCode, cardIds });
    console.log(`📨 Charlie submitted ${cardIds.length} card(s).`);
  }

  // 5. Wait for Judging Phase
  await new Promise((resolve) => {
    socketHost.on('room:state_sync', (state) => {
      if (state.status === 'JUDGING') {
        submissionsReceived = state.anonymousSubmissions;
        console.log(`\n5️⃣ ✅ Judging phase initiated! Czar received ${submissionsReceived.length} anonymous submission(s).`);
        resolve();
      }
    });
  });

  // 6. Czar reveals and selects winner
  if (submissionsReceived && submissionsReceived.length > 0) {
    console.log('6️⃣ Czar revealing submission and picking winner...');
    socketHost.emit('card:reveal', { roomCode: hostRoomCode, submissionIndex: 0 });
    await new Promise((resolve) => setTimeout(resolve, 500));

    const winningSubId = submissionsReceived[0].submissionId;
    socketHost.emit('card:select_winner', { roomCode: hostRoomCode, submissionId: winningSubId });
  }

  // 7. Wait for Round Ended & Score Update
  await new Promise((resolve) => {
    socketHost.on('game:round_ended', (data) => {
      console.log(`\n7️⃣ 🏆 Round Winner Declared: ${data.playerName}`);
      console.log(`   Winning Card(s): ${data.winningCards.map((c) => c.text).join(', ')}`);
      console.log(`   Updated Scores:`, data.scores);
      resolve();
    });
  });

  console.log('\n🎉 ALL MULTIPLAYER TESTS PASSED PERFECTLY!\n');
  socketHost.disconnect();
  socketPlayer2.disconnect();
  socketPlayer3.disconnect();
  process.exit(0);
}

runTest().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
