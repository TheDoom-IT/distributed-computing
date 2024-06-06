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

export class Database {
    private readonly votings: Record<string, InternalVoting>;

    constructor(private readonly nodeId: string, private readonly logger: Logger) {
        this.votings = {};

        this.readPreviousState();
    }

    getVoting(votingId: string): InternalVoting | null {
        return this.votings[votingId];
    }

    getAllVotings() {
        return this.votings;
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
        const state: State = { votings: this.votings };
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
        for (const votingId in previousState.data.votings) {
            this.votings[votingId] = previousState.data.votings[votingId];
        }
    }
}
