from flask import Flask, jsonify, request, abort
from commons import thisNode, votings
from classes import voting


app = Flask(__name__)
# @app.route("/")
# def hello_world():
# 	return jsonify("<p>Hello</p>")

@app.route("/hello-reply", methods = ['POST'])
def helloReply():
	# print("got hello reply")
	nodeId = request.json["nodeId"]
	nodeIp = request.json["ip"]
	nodePort = request.json["port"]
	thisNode.addNode(nodeId, nodeIp, nodePort)
	for vot in request.json["activeVotings"]:
		# print("vot: [",vot,"]")
		votingId = vot["votingId"]
		endTime = vot["endTime"]
		question = vot["question"]
		voteOptions = vot["voteOptions"]
		votings.append(voting(votingId,nodeId,question,endTime,voteOptions,True))
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
	votings.append(voting(votingId, hostId, question, endTime, voteOptions, True))
	# print("voting created, question: [",question,"] host: ", hostId)
	return jsonify("startVoting")

@app.route("/send-vote", methods = ['POST'])
def sendVote():

	# print(jsonify(v))
	# print("got send vote")
	nodeId = request.json["nodeId"]
	votingId = request.json["votingId"]
	voteOption = request.json["voteOptionIndex"]
	for i in range(len(votings)):
		if votings[i].voting_id == votingId:
			votings[i].castVote(nodeId,voteOption)
	return jsonify([nodeId, voteOption])

@app.route("/get-voting-results/<votingId>", methods = ['GET'])
def getVotingResults(votingId):
	# print("got get voting results")
	# print("from queue: ", testQueue.get())
	# request.

	# votingId = request.args.get('votingId')
	
	# print("got get-voting-results votingId: ", votingId)
	votingNum = -1
	for i in range(len(votings)):
		if votings[i].voting_id == votingId:
			votingNum = i
	# print("votingNum: ",votingNum)
	if votingNum == -1:
		abort(404)
	obj = {'votingId':votings[votingNum].voting_id,'question': votings[votingNum].question, 'voteOptions': votings[votingNum].vote_options, 'results':votings[votingNum].vote_results}
	return jsonify(obj)#jsonify(votings[votingNum].vote_results)

def runServer(ip_addr, port):
	# with app.app_context():
	# 	print("flask server started")
	# 	from sendUDP import sendUDP
	# 	sendUDP()


	import logging
	logging.basicConfig(filename='logs/flask.log',level=logging.DEBUG)
	app.run(host=ip_addr, port = port)
# while True:

# a = input("testing input ")
# print("you input: [",a,"]")
# app.run()