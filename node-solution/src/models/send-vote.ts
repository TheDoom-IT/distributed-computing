import {z} from 'zod';

export const SendVoteSchema = z.object({
    nodeId: z.string(),
    votingId: z.string(),
    voteOptionIndex: z.number().nonnegative()
});

export type SendVote = z.infer<typeof SendVoteSchema>;
