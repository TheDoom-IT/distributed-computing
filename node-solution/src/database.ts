import * as fs from "node:fs";
import {State, StateSchema} from "./models/state.js";
import {tryJsonParse} from "./utils/try-json-parse.js";
import {Logger} from "winston";

interface Vote {
    nodeId: string;
    voteOptionIndex: number;
}

export interface InternalVoting {
    id: string;
    question: string;
    voteOptions: string[];
    endTime: number;
    votes: Record<string, Vote>;
}

export interface SentVote {
    votingId: string;
    voteOptionIndex: number;
}

export class Database {
    private votings: Record<string, InternalVoting>;
    private sentVotes: Record<string, SentVote>;

    constructor(private readonly nodeId: string, private readonly logger: Logger) {
        this.votings = {};
        this.sentVotes = {};

        this.readPreviousState();
    }

    getVoting(votingId: string): InternalVoting | null {
        return this.votings[votingId] ?? null;
    }

    getAllVotings() {
        return this.votings;
    }

    removeAllVotings() {
        this.votings = {};
        this.saveState();
    }

    removeVoting(votingId: string) {
        if (this.votings[votingId]) {
            delete this.votings[votingId];
            this.saveState();
        }
    }

    getSentVote(votingId: string): SentVote | null {
        return this.sentVotes[votingId] ?? null;
    }

    addSentVote(vote: SentVote) {
        this.sentVotes[vote.votingId] = vote;
        this.saveState();
    }

    addVote(votingId: string, vote: { voteOptionIndex: number; nodeId: string }) {
        this.votings[votingId].votes[vote.nodeId] = vote;
        this.saveState();
    }

    addNewVoting(voting: InternalVoting) {
        this.votings[voting.id] = voting;
        this.saveState();
    }

    private saveState() {
        const state: State = { votings: this.votings, sentVotes: this.sentVotes };
        fs.writeFileSync(`./${this.nodeId}.json`, JSON.stringify(state));
    }

    private readPreviousState() {
        const exists = fs.existsSync(`./${this.nodeId}.json`)
        if (!exists) {
            return;
        }

        const data = fs.readFileSync(`./${this.nodeId}.json`, 'utf-8')
        const state = tryJsonParse(data)
        if (!state) {
            return;
        }

        const previousState = StateSchema.safeParse(state)
        if (!previousState.success) {
            return;
        }

        this.logger.info(`Restoring previous state for node ${this.nodeId}`);
        this.votings = previousState.data.votings;
        this.sentVotes = previousState.data.sentVotes;
    }
}
