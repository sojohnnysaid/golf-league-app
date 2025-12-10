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

	// Get current scorecard and score
	let currentCard = $derived(scorecards[currentPlayer]);
	let currentScore = $derived(currentCard?.scores[currentHole]?.strokes);

	// Calculate progress
	let totalScores = $derived(
		scorecards.reduce((sum, card) => sum + card.scores.filter((s) => s.strokes !== null).length, 0)
	);
	let progressPercent = $derived((totalScores / (PLAYERS_COUNT * HOLES)) * 100);

	function setScore(num: number) {
		scorecards[currentPlayer].scores[currentHole].strokes = num;
		updateTotals(currentPlayer);
		// Auto-advance after setting score
		setTimeout(() => advanceToNext(), 150);
	}

	function clearScore() {
		scorecards[currentPlayer].scores[currentHole].strokes = null;
		updateTotals(currentPlayer);
	}

	function updateTotals(playerIdx: number) {
		const card = scorecards[playerIdx];
		card.totalStrokes = card.scores.reduce((sum, s) => sum + (s.strokes ?? 0), 0);
		card.netScore = card.totalStrokes - card.handicap;
	}

	function advanceToNext() {
		let nextPlayer = currentPlayer + 1;
		let nextHole = currentHole;

		if (nextPlayer >= PLAYERS_COUNT) {
			nextPlayer = 0;
			nextHole = currentHole + 1;
		}

		if (nextHole >= HOLES) {
			// All done!
			checkComplete();
			return;
		}

		currentPlayer = nextPlayer;
		currentHole = nextHole;
	}

	function goToPrevious() {
		let prevPlayer = currentPlayer - 1;
		let prevHole = currentHole;

		if (prevPlayer < 0) {
			prevPlayer = PLAYERS_COUNT - 1;
			prevHole = currentHole - 1;
		}

		if (prevHole < 0) {
			return;
		}

		currentPlayer = prevPlayer;
		currentHole = prevHole;
	}

	function checkComplete() {
		const allFilled = scorecards.every((card) => card.scores.every((s) => s.strokes !== null));
		if (allFilled && onComplete) {
			onComplete(scorecards);
		}
	}

	function jumpTo(playerIdx: number, holeIdx: number) {
		currentPlayer = playerIdx;
		currentHole = holeIdx;
	}

	// Get team color for player
	function getPlayerColor(playerIdx: number): string {
		return playerIdx < 2 ? 'bg-green-600' : 'bg-blue-600';
	}

	function getPlayerTeam(playerIdx: number): string {
		return playerIdx < 2 ? 'Team 1' : 'Team 2';
	}
</script>

<div class="fixed inset-0 bg-gray-900 flex flex-col z-50">
	<!-- Header -->
	<div class="flex items-center justify-between p-4 bg-gray-800">
		<button onclick={onClose} class="text-white p-2">
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
		<div class="text-white text-center">
			<div class="text-sm opacity-75">Hole {currentHole + 1} of {HOLES}</div>
			<div class="font-bold">{totalScores} / {PLAYERS_COUNT * HOLES}</div>
		</div>
		<div class="w-10"></div>
	</div>

	<!-- Progress bar -->
	<div class="h-1 bg-gray-700">
		<div class="h-full bg-green-500 transition-all duration-300" style="width: {progressPercent}%"></div>
	</div>

	<!-- Main content area -->
	<div class="flex-1 flex flex-col items-center justify-center p-4">
		<!-- Team indicator -->
		<div class="text-gray-400 text-sm mb-1">{getPlayerTeam(currentPlayer)}</div>

		<!-- Player name -->
		<div class="text-white text-4xl font-bold mb-2">{currentCard?.playerName}</div>

		<!-- Handicap -->
		<div class="text-gray-400 text-sm mb-6">HC: {currentCard?.handicap}</div>

		<!-- Current hole indicator -->
		<div class="flex items-center gap-4 mb-6">
			<button
				onclick={goToPrevious}
				class="text-gray-400 hover:text-white p-2 disabled:opacity-30"
				disabled={currentPlayer === 0 && currentHole === 0}
			>
				<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
			</button>

			<div class="bg-gray-800 rounded-2xl px-8 py-4">
				<div class="text-gray-400 text-xs text-center mb-1">HOLE</div>
				<div class="text-white text-5xl font-bold text-center">{currentHole + 1}</div>
			</div>

			<button
				onclick={advanceToNext}
				class="text-gray-400 hover:text-white p-2 disabled:opacity-30"
				disabled={currentPlayer === PLAYERS_COUNT - 1 && currentHole === HOLES - 1}
			>
				<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>

		<!-- Current score display -->
		<div class="bg-gray-800 rounded-2xl w-32 h-32 flex items-center justify-center mb-6">
			{#if currentScore}
				<span class="text-green-400 text-6xl font-bold">{currentScore}</span>
			{:else}
				<span class="text-gray-600 text-6xl font-bold">-</span>
			{/if}
		</div>

		<!-- Mini scoreboard for current hole -->
		<div class="flex gap-2 mb-4">
			{#each scorecards as card, idx}
				<button
					onclick={() => jumpTo(idx, currentHole)}
					class="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold transition-all
						{idx === currentPlayer ? 'ring-2 ring-white scale-110' : 'opacity-60'}
						{idx < 2 ? 'bg-green-600' : 'bg-blue-600'}"
				>
					{card.scores[currentHole]?.strokes ?? '-'}
				</button>
			{/each}
		</div>
	</div>

	<!-- Custom Number Pad -->
	<div class="bg-gray-800 p-4 pb-8">
		<div class="grid grid-cols-5 gap-2 max-w-md mx-auto">
			{#each [1, 2, 3, 4, 5] as num}
				<button
					onclick={() => setScore(num)}
					class="aspect-square rounded-xl bg-gray-700 hover:bg-gray-600 active:bg-green-600
						   text-white text-2xl font-bold transition-all active:scale-95"
				>
					{num}
				</button>
			{/each}
			{#each [6, 7, 8, 9] as num}
				<button
					onclick={() => setScore(num)}
					class="aspect-square rounded-xl bg-gray-700 hover:bg-gray-600 active:bg-green-600
						   text-white text-2xl font-bold transition-all active:scale-95"
				>
					{num}
				</button>
			{/each}
			<!-- Clear button -->
			<button
				onclick={clearScore}
				class="aspect-square rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700
					   text-white text-lg font-bold transition-all active:scale-95 flex items-center justify-center"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
						  d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
				</svg>
			</button>
		</div>

		<!-- 10+ row -->
		<div class="grid grid-cols-5 gap-2 max-w-md mx-auto mt-2">
			{#each [10, 11, 12, 13, 14] as num}
				<button
					onclick={() => setScore(num)}
					class="h-10 rounded-xl bg-gray-700 hover:bg-gray-600 active:bg-green-600
						   text-white text-sm font-bold transition-all active:scale-95"
				>
					{num}
				</button>
			{/each}
		</div>
	</div>
</div>
