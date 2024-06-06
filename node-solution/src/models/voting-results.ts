import {z} from 'zod';
import {MAX_VOTE_OPTIONS} from "../constants/max-vote-options.js";

export const VotingResultsSchema = z.object({
    votingId: z.string(),
    question: z.string(),
    voteOptions: z.array(z.string()).max(MAX_VOTE_OPTIONS),
    results: z.array(z.number())
});

export type VotingResults = z.infer<typeof VotingResultsSchema>;
