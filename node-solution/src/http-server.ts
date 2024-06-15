import express from "express";
import {HelloReplySchema} from "./models/hello-reply.js";
import * as http from "http";
import {AddressInfo} from "net";
import {Logger} from "winston";
import {VotingNode} from "./voting-node.js";
import {StartVotingSchema} from "./models/start-voting.js";
import {VotingResults} from "./models/voting-results.js";
import {SendVoteSchema} from "./models/send-vote.js";
import {GetVote} from "./models/get-vote.js";
import {
    ElectionMessageSchema,
    ElectionResultSchema
} from "./models/election.js";

export class HttpServer {
    private app: express.Express;
    private server: http.Server;
    private address: AddressInfo;

    constructor(private logger: Logger) {
        this.app = express();
        this.app.use(express.json());
        this.server = this.app.listen();


        this.address = this.server.address() as AddressInfo;
        this.logger.info(`Server listening on port ${this.address.port}`);
    }

    getServerPort(): number {
        return this.address.port;
    }

    startListening(node: VotingNode) {
        this.app.use((req, res, next) => {
            res.on('finish', () =>{
                this.logger.info(`${req.method} ${req.path} ${res.statusCode}`);
            })
            next();
        })

        this.app.post('/hello-reply', (req, res) => {
            const body = req.body;

            const result = HelloReplySchema.safeParse(body);

            if (!result.success) {
                this.logger.info("Invalid JSON: " + result.error.message);
                res.status(400).json({error: "Invalid JSON"});
                return;
            }

            node.handleHelloReply(result.data);
            res.status(200).json({success: true});
        });

        this.app.post('/start-voting', (req, res) => {
            const result = StartVotingSchema.safeParse(req.body);

            if (!result.success) {
                this.logger.info("Invalid JSON: " + result.error.message);
                res.status(400).json({error: "Invalid JSON"});
                return;
            }
            node.handleStartVoting(req.body)

            res.status(200).json({success: true});
        });

        this.app.post('/send-vote', (req, res) => {

            const result = SendVoteSchema.safeParse(req.body);

            if (!result.success) {
                this.logger.info("Invalid JSON: " + result.error.message);
                res.status(400).json({error: "Invalid JSON"});
                return;
            }

            const sendVoteData = result.data;

            const voting = node.getInternalVoting(sendVoteData.votingId)
            if (voting === null) {
                res.status(404).json({error: "Voting not found"});
                return;
            }

            if (voting.endTime < new Date().getTime()) {
                res.status(400).json({error: "Voting has ended"});
                return;
            }

            node.handleSendVote(voting, result.data);

            res.json({success: true});
        });

        this.app.get('/get-voting-results/:votingId', (req, res) => {
            const votingResults = node.getInternalVoting(req.params.votingId)
            if (!votingResults) {
                res.status(404).json({error: "Voting not found"});
                return;
            }

            const groupedResults: number[] = new Array(Object.keys(votingResults.voteOptions).length).fill(0);
            for (const vote of Object.values(votingResults.votes)) {
                groupedResults[vote.voteOptionIndex] += 1;
            }

            const responseBody: VotingResults = {
                votingId: votingResults.id,
                results: groupedResults,
                question: votingResults.question,
                voteOptions: votingResults.voteOptions,

            }

            res.status(200).json(responseBody);
        });

        this.app.post('/election', (req, res) => {
            const body = req.body;

            const result = ElectionMessageSchema.safeParse(body);
            if (!result.success) {
                this.logger.info("Invalid JSON: " + result.error.message);
                res.status(400).json({error: "Invalid JSON"});
                return;
            }

            const electionData = result.data;

            const responseMessage = node.handleElectionMessage(electionData);

            res.status(200).json(responseMessage);
        });

        this.app.post('/election-results', (req, res) => {
            const body = req.body;

            const result = ElectionResultSchema.safeParse(body);
            if (!result.success) {
                this.logger.info("Invalid JSON: " + result.error.message);
                res.status(400).json({error: "Invalid JSON"});
                return;
            }

            const electionResultData = result.data;

            const responseMessage = node.handleElectionResultMessage(electionResultData);

            res.status(200).json(responseMessage);
        });



        this.app.get('/get-vote-for/:votingId', (req, res) => {
            const votingId = req.params.votingId;

            const internal = node.getInternalVoting(votingId)
            const external = node.getExternalVotings()[votingId]

            if (!internal && !external) {
                res.status(404).json({error: "Voting not found"});
                return;
            }

            const sentVote = node.getSentVote(votingId);

            const responseBody: GetVote = {
                nodeId: node.getId(),
                votingId,
                vote: sentVote?.voteOptionIndex ?? null
            };

            res.status(200).json(responseBody);
        });
    }

    close() {
        this.server.close()
    }
}
