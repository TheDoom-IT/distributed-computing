import {z} from 'zod';
import {MAX_VOTE_OPTIONS} from "../constants/max-vote-options.js";

export const StateSchema = z.object({
    votings: z.object({}).catchall(z.object({
        id: z.string(),
        question: z.string(),
        voteOptions: z.array(z.string()).max(MAX_VOTE_OPTIONS),
        endTime: z.number().positive(),
        votes: z.record(z.object({
            nodeId: z.string(),
            voteOptionIndex: z.number()
        }))
    }))
});

export type State = z.infer<typeof StateSchema>;
