import {z} from 'zod';
import {MAX_VOTE_OPTIONS} from "../constants/max-vote-options.js";

export const StartVotingSchema = z.object({
    nodeId: z.string(),
    votingId: z.string(),
    endTime: z.number().positive(),
    question: z.string(),
    voteOptions: z.array(z.string()).max(MAX_VOTE_OPTIONS)
});

export type StartVoting = z.infer<typeof StartVotingSchema>;
