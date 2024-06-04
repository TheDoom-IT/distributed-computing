import express from "express";

export class Server {
    constructor(logger) {
        this.app = express();
        this.server = this.app.listen();
        this.logger = logger;

        this.serverPort = this.server.address().port;
        logger.info(`Server listening on port ${this.serverPort}`);
    }

    startListening(node) {
        this.app.get('/nodes', (req, res) => {
            res.json(node.knownNodes);
        });

        this.app.post('/hello-reply', (req, res) => {
            res.json({success: true});
        });

        this.app.post('/start-voting', (req, res) => {
            res.json({success: true});
        });

        this.app.post('/send-vote', (req, res) => {
            res.json({success: true});
        });

        this.app.post('/get-voting-results/:votingId', (req, res) => {
            console.log(req.params.votingId);
            res.json({
                id: req.params.votingId,
                success: true
            });
        });
    }

    close() {
        this.server.close()
    }
}
