from flask import Flask, jsonify, request, abort
from commons import thisNode, votings, votes
from classes import voting
from datetime import datetime
from log import log


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
		if votingId in [x.voting_id for x in votings]:
			# print("got voting ",votingId, " again")
			pass
		else:
			endTime = vot["endTime"]
			question = vot["question"]
			voteOptions = vot["voteOptions"]

			# end_time is sent as milliseconds (JS compatibility), convert them to seconds
			endTimeAsSeconds = float(endTime / 1000)
			# print("got voting from helloReply: ", question)
			votings.append(voting(votingId,nodeId,question,endTimeAsSeconds,voteOptions))
	return jsonify("helloReply")

@app.route("/start-voting", methods = ['POST'])
def startVoting():
	print("got start voting")
	votingId = request.json["votingId"]
	if votingId in [x.voting_id for x in votings]:
		print("voting already known")
	else:
		hostId = request.json["nodeId"]
		endTime = request.json["endTime"]
		question = request.json["question"]
		voteOptions = []
		for voteOption in request.json["voteOptions"]:
			voteOptions.append(voteOption)

		# end_time is sent as milliseconds (JS compatibility), convert them to seconds
		endTimeAsSeconds = float(endTime / 1000)
		votings.append(voting(votingId, hostId, question, endTimeAsSeconds, voteOptions))
		# print("voting created, question: [",question,"] host: ", hostId)
	return jsonify("startVoting")

@app.route("/send-vote", methods = ['POST'])
def sendVote():

	# print(jsonify(v))
	# print("got send vote")
	timestamp = int(datetime.timestamp(datetime.now())*1000) #timestamp in nanoseconds
	nodeId = request.json["nodeId"]
	votingId = request.json["votingId"]
	voteOption = request.json["voteOptionIndex"]
	for i in range(len(votings)):
		if votings[i].voting_id == votingId:
			if votings[i].endTime < timestamp:
				log("got vote for ended voting", file="votingsLog")
				abort(400)
			else:
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

@app.route("/get-vote-for/<votingId>", methods = ['POST'])
def getVote(votingId):
	votingNum = -1
	for i in range(len(votings)):
		if votings[i].voting_id == votingId:
			votingNum = i
	if votingNum == -1:
		abort(404)

	if votings[i].voting_id in votes:
		vote = votes[votings[i].voting_id]
	else:
		vote = None

	obj = {'votingId':votings[i].voting_id, 'nodeId':thisNode.node_id, 'vote':vote}
	return jsonify(obj)

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
