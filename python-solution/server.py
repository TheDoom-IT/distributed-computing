from flask import Flask, jsonify, request
from commons import testQueue, thisNode, votings
from classes import voting


app = Flask(__name__)
# @app.route("/")
# def hello_world():
# 	return jsonify("<p>Hello</p>")

@app.route("/hello-reply", methods = ['POST'])
def helloReply():
	print("got hello reply")
	nodeId = request.json["nodeId"]
	nodeIp = request.json["ip"]
	nodePort = request.json["port"]
	thisNode.addNode(nodeId, nodeIp, nodePort)
	# for vot in request.json["activeVotings"]:
	# 	print("vot: [",vot,"]")
	# 	votingId = vot["votingid"]
	# 	endTime = vot["endTime"]
	# 	question = vot["question"]
	# 	voteOptions = vot["voteOptions"]
	# 	votings.append(voting(votingId,nodeId,question,endTime,voteOptions))
	return jsonify("helloReply")

@app.route("/start-voting", methods = ['POST'])
def startVoting():
	# print("got start voting")
	hostId = request.json["nodeId"]
	votingId = request.json["votingId"]	
	endTime = request.json["endTime"]
	question = request.json["question"]
	voteOptions = []
	for voteOption in request.json["voteOptions"]:
		voteOptions.append(voteOption)
	votings.append(voting(votingId, hostId, question, endTime, voteOptions))
	print("voting created, question: [",question,"] host: ", hostId)
	return jsonify("startVoting")

@app.route("/send-vote", methods = ['POST'])
def sendVote():

	# print(jsonify(v))
	# print("got send vote")
	nodeId = request.json["node_id"]
	votingId = request.json["voting_id"]
	voteOption = request.json["vote_option"]
	for i in range(len(votings)):
		if votings[i].voting_id == votingId:
			votings[i].castVote(nodeId,voteOption)
	return jsonify([nodeId, voteOption])

@app.route("/get-voting-results", methods = ['GET'])
def getVotingResults():
	# print("got get voting results")
	# print("from queue: ", testQueue.get())
	# request.
	return jsonify("getVotingResults")

def runServer(ip_addr, port):

    import logging
    logging.basicConfig(filename='logs/flask.log',level=logging.DEBUG)
    app.run(host=ip_addr, port = port)
    print("\n\n\n\naaaaaaa")
# while True:

# a = input("testing input ")
# print("you input: [",a,"]")
# app.run()