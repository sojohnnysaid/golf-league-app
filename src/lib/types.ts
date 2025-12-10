export interface Player {
	id: string;
	name: string;
	handicap: number;
}

export interface Team {
	id: string;
	name: string;
	players: [Player, Player]; // exactly 2 players per team
}

export interface Location {
	id: string;
	name: string;
	address?: string;
}

export interface League {
	id: string;
	name: string;
	locationId: string;
	teams: Team[];
}

export interface HoleScore {
	hole: number; // 1-9
	strokes: number | null;
}

export interface PlayerScorecard {
	playerId: string;
	playerName: string;
	handicap: number;
	scores: HoleScore[];
	totalStrokes: number;
	netScore: number;
}

export interface Match {
	id: string;
	leagueId: string;
	week: number;
	date: string;
	team1: Team;
	team2: Team;
	scorecards: PlayerScorecard[];
	isComplete: boolean;
}
