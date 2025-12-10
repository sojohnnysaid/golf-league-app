<script lang="ts">
	import type { PlayerScorecard } from '$lib/types';

	interface Props {
		team1Name: string;
		team2Name: string;
		scorecards: PlayerScorecard[];
		onComplete?: (scorecards: PlayerScorecard[]) => void;
	}

	let { team1Name, team2Name, scorecards = $bindable(), onComplete }: Props = $props();

	const HOLES = 9;
	const PLAYERS_COUNT = 4;

	// Track current position: [playerIndex, holeIndex]
	let currentPlayer = $state(0);
	let currentHole = $state(0);

	// Reference to all input elements for navigation
	let inputs: HTMLInputElement[][] = $state([]);

	// Initialize input refs array
	$effect(() => {
		if (inputs.length === 0) {
			inputs = Array.from({ length: PLAYERS_COUNT }, () => Array(HOLES).fill(null));
		}
	});

	function getInputRef(playerIdx: number, holeIdx: number): HTMLInputElement | null {
		return inputs[playerIdx]?.[holeIdx] ?? null;
	}

	function setInputRef(playerIdx: number, holeIdx: number, el: HTMLInputElement | null) {
		if (!inputs[playerIdx]) {
			inputs[playerIdx] = Array(HOLES).fill(null);
		}
		inputs[playerIdx][holeIdx] = el;
	}

	function focusCell(playerIdx: number, holeIdx: number) {
		const input = getInputRef(playerIdx, holeIdx);
		if (input) {
			input.focus();
			input.select();
			currentPlayer = playerIdx;
			currentHole = holeIdx;
		}
	}

	function advanceToNext() {
		// Move to next player on same hole
		let nextPlayer = currentPlayer + 1;
		let nextHole = currentHole;

		// If we've done all players, move to next hole
		if (nextPlayer >= PLAYERS_COUNT) {
			nextPlayer = 0;
			nextHole = currentHole + 1;
		}

		// If we've done all holes, stay at last position
		if (nextHole >= HOLES) {
			checkComplete();
			return;
		}

		focusCell(nextPlayer, nextHole);
	}

	function goToPrevious() {
		let prevPlayer = currentPlayer - 1;
		let prevHole = currentHole;

		if (prevPlayer < 0) {
			prevPlayer = PLAYERS_COUNT - 1;
			prevHole = currentHole - 1;
		}

		if (prevHole < 0) {
			return; // Already at the beginning
		}

		focusCell(prevPlayer, prevHole);
	}

	function handleKeyDown(event: KeyboardEvent, playerIdx: number, holeIdx: number) {
		const key = event.key;

		// Handle numeric input - auto advance
		if (/^[1-9]$/.test(key)) {
			event.preventDefault();
			const score = parseInt(key);
			scorecards[playerIdx].scores[holeIdx].strokes = score;
			updateTotals(playerIdx);

			// Small delay to show the number before advancing
			setTimeout(() => advanceToNext(), 50);
			return;
		}

		// Handle 0 or 10+ (allow typing but don't auto-advance)
		if (key === '0') {
			// Allow 0 to be typed for scores like 10
			return;
		}

		// Navigation keys
		switch (key) {
			case 'Tab':
				event.preventDefault();
				if (event.shiftKey) {
					goToPrevious();
				} else {
					advanceToNext();
				}
				break;
			case 'Enter':
				event.preventDefault();
				advanceToNext();
				break;
			case 'Backspace':
				if (scorecards[playerIdx].scores[holeIdx].strokes === null) {
					event.preventDefault();
					goToPrevious();
				}
				break;
			case 'ArrowRight':
				event.preventDefault();
				if (holeIdx < HOLES - 1) focusCell(playerIdx, holeIdx + 1);
				break;
			case 'ArrowLeft':
				event.preventDefault();
				if (holeIdx > 0) focusCell(playerIdx, holeIdx - 1);
				break;
			case 'ArrowDown':
				event.preventDefault();
				if (playerIdx < PLAYERS_COUNT - 1) focusCell(playerIdx + 1, holeIdx);
				break;
			case 'ArrowUp':
				event.preventDefault();
				if (playerIdx > 0) focusCell(playerIdx - 1, holeIdx);
				break;
		}
	}

	function handleInput(event: Event, playerIdx: number, holeIdx: number) {
		const input = event.target as HTMLInputElement;
		const value = input.value;

		if (value === '') {
			scorecards[playerIdx].scores[holeIdx].strokes = null;
		} else {
			const num = parseInt(value);
			if (!isNaN(num) && num > 0 && num <= 20) {
				scorecards[playerIdx].scores[holeIdx].strokes = num;
			}
		}
		updateTotals(playerIdx);
	}

	function updateTotals(playerIdx: number) {
		const card = scorecards[playerIdx];
		card.totalStrokes = card.scores.reduce((sum, s) => sum + (s.strokes ?? 0), 0);
		card.netScore = card.totalStrokes - card.handicap;
	}

	function checkComplete() {
		const allFilled = scorecards.every((card) => card.scores.every((s) => s.strokes !== null));
		if (allFilled && onComplete) {
			onComplete(scorecards);
		}
	}

	function handleFocus(playerIdx: number, holeIdx: number) {
		currentPlayer = playerIdx;
		currentHole = holeIdx;
	}

	// Calculate if a cell is the current active one
	function isActive(playerIdx: number, holeIdx: number): boolean {
		return currentPlayer === playerIdx && currentHole === holeIdx;
	}

	// Start entry when component mounts
	$effect(() => {
		// Focus first cell after a short delay to ensure DOM is ready
		setTimeout(() => focusCell(0, 0), 100);
	});
</script>

<div class="w-full max-w-4xl mx-auto p-4">
	<!-- Header showing current position -->
	<div class="mb-4 text-center">
		<div class="text-sm text-gray-500">
			Hole {currentHole + 1} of {HOLES} - {scorecards[currentPlayer]?.playerName ?? 'Player'}
		</div>
		<div class="text-xs text-gray-400 mt-1">
			Type 1-9 to auto-advance | Arrow keys to navigate | Tab/Enter to move forward
		</div>
	</div>

	<!-- Score Grid -->
	<div class="overflow-x-auto">
		<table class="w-full border-collapse">
			<!-- Header row with hole numbers -->
			<thead>
				<tr class="bg-gray-100">
					<th class="p-2 border border-gray-300 text-left min-w-[120px]">Player</th>
					<th class="p-1 border border-gray-300 text-center w-8 text-xs text-gray-500">HC</th>
					{#each Array(HOLES) as _, i}
						<th
							class="p-2 border border-gray-300 text-center w-10 {currentHole === i
								? 'bg-blue-100'
								: ''}"
						>
							{i + 1}
						</th>
					{/each}
					<th class="p-2 border border-gray-300 text-center w-12 bg-gray-200">Tot</th>
					<th class="p-2 border border-gray-300 text-center w-12 bg-gray-200">Net</th>
				</tr>
			</thead>

			<tbody>
				<!-- Team 1 -->
				<tr>
					<td
						colspan={HOLES + 4}
						class="p-1 bg-green-600 text-white text-sm font-semibold border border-gray-300"
					>
						{team1Name}
					</td>
				</tr>
				{#each scorecards.slice(0, 2) as card, playerIdx}
					<tr class="{currentPlayer === playerIdx ? 'bg-blue-50' : 'bg-white'}">
						<td class="p-2 border border-gray-300 font-medium truncate">
							{card.playerName}
						</td>
						<td class="p-1 border border-gray-300 text-center text-xs text-gray-500">
							{card.handicap}
						</td>
						{#each card.scores as score, holeIdx}
							<td
								class="p-0 border border-gray-300 {isActive(playerIdx, holeIdx)
									? 'ring-2 ring-blue-500 ring-inset'
									: ''}"
							>
								<input
									type="text"
									inputmode="numeric"
									class="w-full h-10 text-center text-lg font-mono focus:outline-none focus:bg-yellow-100 {score.strokes
										? 'bg-green-50'
										: ''}"
									value={score.strokes ?? ''}
									onkeydown={(e) => handleKeyDown(e, playerIdx, holeIdx)}
									oninput={(e) => handleInput(e, playerIdx, holeIdx)}
									onfocus={() => handleFocus(playerIdx, holeIdx)}
									bind:this={inputs[playerIdx][holeIdx]}
								/>
							</td>
						{/each}
						<td class="p-2 border border-gray-300 text-center font-bold bg-gray-50">
							{card.totalStrokes || '-'}
						</td>
						<td class="p-2 border border-gray-300 text-center font-bold bg-gray-100">
							{card.totalStrokes ? card.netScore : '-'}
						</td>
					</tr>
				{/each}

				<!-- Team 2 -->
				<tr>
					<td
						colspan={HOLES + 4}
						class="p-1 bg-blue-600 text-white text-sm font-semibold border border-gray-300"
					>
						{team2Name}
					</td>
				</tr>
				{#each scorecards.slice(2, 4) as card, idx}
					{@const playerIdx = idx + 2}
					<tr class="{currentPlayer === playerIdx ? 'bg-blue-50' : 'bg-white'}">
						<td class="p-2 border border-gray-300 font-medium truncate">
							{card.playerName}
						</td>
						<td class="p-1 border border-gray-300 text-center text-xs text-gray-500">
							{card.handicap}
						</td>
						{#each card.scores as score, holeIdx}
							<td
								class="p-0 border border-gray-300 {isActive(playerIdx, holeIdx)
									? 'ring-2 ring-blue-500 ring-inset'
									: ''}"
							>
								<input
									type="text"
									inputmode="numeric"
									class="w-full h-10 text-center text-lg font-mono focus:outline-none focus:bg-yellow-100 {score.strokes
										? 'bg-green-50'
										: ''}"
									value={score.strokes ?? ''}
									onkeydown={(e) => handleKeyDown(e, playerIdx, holeIdx)}
									oninput={(e) => handleInput(e, playerIdx, holeIdx)}
									onfocus={() => handleFocus(playerIdx, holeIdx)}
									bind:this={inputs[playerIdx][holeIdx]}
								/>
							</td>
						{/each}
						<td class="p-2 border border-gray-300 text-center font-bold bg-gray-50">
							{card.totalStrokes || '-'}
						</td>
						<td class="p-2 border border-gray-300 text-center font-bold bg-gray-100">
							{card.totalStrokes ? card.netScore : '-'}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Progress indicator -->
	<div class="mt-4">
		<div class="flex justify-between text-sm text-gray-500 mb-1">
			<span>Progress</span>
			<span>
				{scorecards.reduce((sum, card) => sum + card.scores.filter((s) => s.strokes !== null).length, 0)}
				/ {PLAYERS_COUNT * HOLES} scores entered
			</span>
		</div>
		<div class="w-full bg-gray-200 rounded-full h-2">
			<div
				class="bg-green-500 h-2 rounded-full transition-all duration-200"
				style="width: {(scorecards.reduce(
					(sum, card) => sum + card.scores.filter((s) => s.strokes !== null).length,
					0
				) /
					(PLAYERS_COUNT * HOLES)) *
					100}%"
			></div>
		</div>
	</div>
</div>
