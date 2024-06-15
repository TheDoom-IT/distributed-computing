import {z} from 'zod';
import {MAX_VOTE_OPTIONS} from "../constants/max-vote-options.js";

export const GetVoteSchema = z.object({
    nodeId: z.string(),
    votingId: z.string(),
    vote: z.number().nonnegative().nullable()
});

export type GetVote = z.infer<typeof GetVoteSchema>;
