import {z} from 'zod';
import {MAX_VOTE_OPTIONS} from "../constants/max-vote-options.js";

export const HelloReplySchema = z.object({
    nodeId: z.string(),
    port: z.number().positive(),
    ip: z.string(),
    activeVotings: z.array(z.object({
        votingId: z.string(),
        endTime: z.number().positive(),
        question: z.string(),
        voteOptions: z.array(z.string()).max(MAX_VOTE_OPTIONS)
    })).optional(),
});

export type HelloReply = z.infer<typeof HelloReplySchema>;
