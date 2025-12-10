<script lang="ts">
	import ScoreEntry from '$lib/components/ScoreEntry.svelte';
	import QuickEntry from '$lib/components/QuickEntry.svelte';
	import type { PlayerScorecard } from '$lib/types';

	// Demo data matching the scorecard image
	// Team 1: Jerry (HC 1), Frank (HC 7)
	// Team 2: Bob (HC 9), Johnny (HC 7)
	let scorecards: PlayerScorecard[] = $state([
		{
			playerId: '1',
			playerName: 'Jerry',
			handicap: 1,
			scores: Array.from({ length: 9 }, (_, i) => ({ hole: i + 1, strokes: null })),
			totalStrokes: 0,
			netScore: 0
		},
		{
			playerId: '2',
			playerName: 'Frank',
			handicap: 7,
			scores: Array.from({ length: 9 }, (_, i) => ({ hole: i + 1, strokes: null })),
			totalStrokes: 0,
			netScore: 0
		},
		{
			playerId: '3',
			playerName: 'Bob',
			handicap: 9,
			scores: Array.from({ length: 9 }, (_, i) => ({ hole: i + 1, strokes: null })),
			totalStrokes: 0,
			netScore: 0
		},
		{
			playerId: '4',
			playerName: 'Johnny',
			handicap: 7,
			scores: Array.from({ length: 9 }, (_, i) => ({ hole: i + 1, strokes: null })),
			totalStrokes: 0,
			netScore: 0
		}
	]);

	let isComplete = $state(false);
	let showQuickEntry = $state(false);

	function handleComplete(cards: PlayerScorecard[]) {
		showQuickEntry = false;
		isComplete = true;
		console.log('Scores submitted:', cards);
	}

	function resetScores() {
		scorecards = scorecards.map((card) => ({
			...card,
			scores: Array.from({ length: 9 }, (_, i) => ({ hole: i + 1, strokes: null })),
			totalStrokes: 0,
			netScore: 0
		}));
		isComplete = false;
	}
</script>

<!-- Quick Entry Overlay -->
{#if showQuickEntry}
	<QuickEntry
		bind:scorecards
		onComplete={handleComplete}
		onClose={() => (showQuickEntry = false)}
	/>
{/if}

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-green-700 text-white p-4 shadow-md">
		<div class="max-w-4xl mx-auto flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold">Golf League Scores</h1>
				<p class="text-green-200 text-sm">Week 9 - Wednesday Early Playoffs</p>
			</div>
			{#if !isComplete}
				<button
					onclick={() => (showQuickEntry = true)}
					class="bg-yellow-500 hover:bg-yellow-400 text-gray-900 p-3 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
					title="Quick Entry Mode"
				>
					<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
						<path d="M13 3L4 14h7v7l9-11h-7V3z" />
					</svg>
				</button>
			{/if}
		</div>
	</header>

	<main class="py-6">
		{#if isComplete}
			<!-- Success message -->
			<div class="max-w-4xl mx-auto px-4">
				<div class="bg-green-100 border border-green-400 rounded-lg p-6 text-center">
					<svg
						class="w-16 h-16 mx-auto text-green-500 mb-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					<h2 class="text-2xl font-bold text-green-800 mb-2">Scores Submitted!</h2>
					<p class="text-green-700 mb-4">All scores have been recorded successfully.</p>

					<!-- Summary -->
					<div class="bg-white rounded-lg p-4 mb-4 text-left">
						<h3 class="font-semibold mb-2 text-gray-700">Match Summary</h3>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<p class="text-sm text-gray-500">Team 1</p>
								{#each scorecards.slice(0, 2) as card}
									<p class="text-gray-800">
										{card.playerName}: {card.totalStrokes} (Net: {card.netScore})
									</p>
								{/each}
							</div>
							<div>
								<p class="text-sm text-gray-500">Team 2</p>
								{#each scorecards.slice(2, 4) as card}
									<p class="text-gray-800">
										{card.playerName}: {card.totalStrokes} (Net: {card.netScore})
									</p>
								{/each}
							</div>
						</div>
					</div>

					<button
						onclick={resetScores}
						class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
					>
						Enter Another Match
					</button>
				</div>
			</div>
		{:else}
			<ScoreEntry
				team1Name="Team 1"
				team2Name="Team 2"
				bind:scorecards
				onComplete={handleComplete}
			/>

			<!-- Submit button -->
			<div class="max-w-4xl mx-auto px-4 mt-6">
				<button
					onclick={() => handleComplete(scorecards)}
					class="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
					disabled={scorecards.some((card) => card.scores.some((s) => s.strokes === null))}
				>
					Submit Scores
				</button>
				<p class="text-center text-sm text-gray-500 mt-2">
					Fill in all scores to enable submission
				</p>
			</div>
		{/if}
	</main>
</div>
