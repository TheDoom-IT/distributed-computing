import {z} from 'zod';

export const StartVotingSchema = z.object({
    hostNodeId: z.string(),
    datetime: z.number().positive(),
    voteOptions: z.array(z.string()),
    votes: z.array(z.object({
        voterId: z.string(),
        vote_option: z.number()
    }))
});
