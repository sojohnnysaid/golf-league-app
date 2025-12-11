<script lang="ts">
	import type { PlayerScorecard } from '$lib/types';

	interface Props {
		scorecards: PlayerScorecard[];
		onComplete?: (scorecards: PlayerScorecard[]) => void;
		onClose?: () => void;
	}

	let { scorecards = $bindable(), onComplete, onClose }: Props = $props();

	const HOLES = 9;
	const PLAYERS_COUNT = 4;

	// Track current position
	let currentPlayer = $state(0);
	let currentHole = $state(0);

	// Pending input for double-digit scores (when user presses 1 first)
	let pendingTens = $state(false);

	// Get current scorecard and score
	let currentCard = $derived(scorecards[currentPlayer]);
	let currentScore = $derived(currentCard?.scores[currentHole]?.strokes);

	// Display value (shows "1_" when pending)
	let displayValue = $derived(pendingTens ? '1_' : (currentScore ?? '-'));

	// Calculate progress
	let totalScores = $derived(
		scorecards.reduce((sum, card) => sum + card.scores.filter((s) => s.strokes !== null).length, 0)
	);
	let progressPercent = $derived((totalScores / (PLAYERS_COUNT * HOLES)) * 100);

	function setScore(num: number) {
		pendingTens = false;
		scorecards[currentPlayer].scores[currentHole].strokes = num;
		updateTotals(currentPlayer);
		// Auto-advance after setting score
		setTimeout(() => advanceToNext(), 150);
	}

	function handleNumberPress(num: number) {
		if (pendingTens) {
			// Complete the double-digit number: 10-19
			setScore(10 + num);
		} else if (num === 1) {
			// Start pending for potential 10-19
			pendingTens = true;
		} else {
			// Direct single digit 2-9
			setScore(num);
		}
	}

	function handleAce() {
		// Ace = 1 stroke (hole in one)
		pendingTens = false;
		setScore(1);
	}

	function clearScore() {
		pendingTens = false;
		scorecards[currentPlayer].scores[currentHole].strokes = null;
		updateTotals(currentPlayer);
	}

	function updateTotals(playerIdx: number) {
		const card = scorecards[playerIdx];
		card.totalStrokes = card.scores.reduce((sum, s) => sum + (s.strokes ?? 0), 0);
		card.netScore = card.totalStrokes - card.handicap;
	}

	function advanceToNext() {
		pendingTens = false;
		// Go through all holes for current player, then move to next player
		let nextHole = currentHole + 1;
		let nextPlayer = currentPlayer;

		if (nextHole >= HOLES) {
			// Done with this player, move to next player
			nextHole = 0;
			nextPlayer = currentPlayer + 1;
		}

		if (nextPlayer >= PLAYERS_COUNT) {
			// All done!
			checkComplete();
			return;
		}

		currentPlayer = nextPlayer;
		currentHole = nextHole;
	}

	function goToPrevious() {
		pendingTens = false;
		// Go back through holes for current player, then previous player
		let prevHole = currentHole - 1;
		let prevPlayer = currentPlayer;

		if (prevHole < 0) {
			// Go to previous player's last hole
			prevHole = HOLES - 1;
			prevPlayer = currentPlayer - 1;
		}

		if (prevPlayer < 0) {
			return; // Already at the beginning
		}

		currentPlayer = prevPlayer;
		currentHole = prevHole;
	}

	function checkComplete() {
		// We've gone through all players - return to scorecard view
		if (onClose) {
			onClose();
		}
	}

	function jumpTo(playerIdx: number, holeIdx: number) {
		pendingTens = false;
		currentPlayer = playerIdx;
		currentHole = holeIdx;
	}

	function getPlayerTeam(playerIdx: number): string {
		return playerIdx < 2 ? 'Team 1' : 'Team 2';
	}
</script>

<div class="fixed inset-0 bg-gray-900 flex flex-col z-50 overflow-hidden touch-manipulation select-none">
	<!-- Header - compact -->
	<div class="flex items-center justify-between px-3 py-2 bg-gray-800">
		<button onclick={onClose} class="text-white p-1" aria-label="Close">
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
		<div class="text-white text-center">
			<div class="text-xs opacity-75">Player {currentPlayer + 1} of {PLAYERS_COUNT}</div>
			<div class="text-sm font-bold">{totalScores} / {PLAYERS_COUNT * HOLES}</div>
		</div>
		<div class="w-8"></div>
	</div>

	<!-- Progress bar -->
	<div class="h-1 bg-gray-700">
		<div class="h-full bg-green-500 transition-all duration-300" style="width: {progressPercent}%"></div>
	</div>

	<!-- Main content area - compact -->
	<div class="flex-1 flex flex-col items-center justify-center p-2 min-h-0">
		<!-- Player info row -->
		<div class="text-gray-400 text-xs">{getPlayerTeam(currentPlayer)}</div>
		<div class="text-white text-2xl font-bold">{currentCard?.playerName}</div>
		<div class="text-gray-400 text-xs mb-2">HC: {currentCard?.handicap}</div>

		<!-- Hole nav + score display row -->
		<div class="flex items-center gap-3 mb-2">
			<button
				onclick={goToPrevious}
				class="text-gray-400 hover:text-white p-1 disabled:opacity-30"
				disabled={currentPlayer === 0 && currentHole === 0}
				aria-label="Previous"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
			</button>

			<div class="bg-gray-800 rounded-xl px-4 py-2 text-center">
				<div class="text-gray-400 text-[10px]">HOLE</div>
				<div class="text-white text-3xl font-bold">{currentHole + 1}</div>
			</div>

			<!-- Score display -->
			<div class="bg-gray-800 rounded-xl w-20 h-16 flex items-center justify-center">
				{#if pendingTens}
					<span class="text-yellow-400 text-3xl font-bold">1_</span>
				{:else if currentScore}
					<span class="text-green-400 text-3xl font-bold">{currentScore}</span>
				{:else}
					<span class="text-gray-600 text-3xl font-bold">-</span>
				{/if}
			</div>

			<button
				onclick={advanceToNext}
				class="text-gray-400 hover:text-white p-1 disabled:opacity-30"
				disabled={currentPlayer === PLAYERS_COUNT - 1 && currentHole === HOLES - 1}
				aria-label="Next"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>

		<!-- Mini scoreboard showing all 9 holes for current player -->
		<div class="flex gap-1 mb-2">
			{#each currentCard?.scores ?? [] as score, holeIdx}
				<button
					onclick={() => jumpTo(currentPlayer, holeIdx)}
					class="w-8 h-8 rounded-md flex items-center justify-center text-white text-xs font-bold transition-all
						{holeIdx === currentHole ? 'ring-2 ring-white scale-105 bg-green-500' : 'opacity-70 bg-gray-700'}
						{score.strokes ? 'bg-green-600' : ''}"
				>
					{score.strokes ?? (holeIdx + 1)}
				</button>
			{/each}
		</div>
	</div>

	<!-- Custom Number Pad - compact -->
	<div class="bg-gray-800 p-2 pb-4 touch-manipulation">
		<!-- Main number grid: Ace, 2-9, Clear -->
		<div class="grid grid-cols-5 gap-1.5 max-w-sm mx-auto">
			<!-- Ace button (hole in one) -->
			<button
				onclick={handleAce}
				class="h-14 rounded-xl bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-700
					   text-white text-sm font-bold transition-all active:scale-95"
			>
				ACE
			</button>
			{#each [2, 3, 4, 5] as num}
				<button
					onclick={() => handleNumberPress(num)}
					class="h-14 rounded-xl bg-gray-700 hover:bg-gray-600 active:bg-green-600
						   text-white text-2xl font-bold transition-all active:scale-95"
				>
					{num}
				</button>
			{/each}
			{#each [6, 7, 8, 9] as num}
				<button
					onclick={() => handleNumberPress(num)}
					class="h-14 rounded-xl bg-gray-700 hover:bg-gray-600 active:bg-green-600
						   text-white text-2xl font-bold transition-all active:scale-95"
				>
					{num}
				</button>
			{/each}
			<!-- Clear button -->
			<button
				onclick={clearScore}
				class="h-14 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700
					   text-white text-xs font-bold transition-all active:scale-95 flex items-center justify-center"
				aria-label="Clear"
			>
				CLR
			</button>
		</div>

		<!-- 1X row for double digits -->
		<div class="grid grid-cols-5 gap-1.5 max-w-sm mx-auto mt-1.5">
			<button
				onclick={() => handleNumberPress(1)}
				class="h-11 rounded-xl {pendingTens ? 'bg-yellow-600' : 'bg-gray-600'} hover:bg-gray-500 active:bg-yellow-600
					   text-white text-lg font-bold transition-all active:scale-95"
			>
				1X
			</button>
			{#each [0, 1, 2, 3] as num}
				<button
					onclick={() => pendingTens ? setScore(10 + num) : null}
					class="h-11 rounded-xl {pendingTens ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 opacity-40'}
						   text-white text-sm font-bold transition-all active:scale-95"
					disabled={!pendingTens}
				>
					{10 + num}
				</button>
			{/each}
		</div>
	</div>
</div>
