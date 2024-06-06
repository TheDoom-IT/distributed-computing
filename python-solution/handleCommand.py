from commons import thisNode, votings
from classes import voting
from sendHelloReply import sendHelloReply
import requests
import uuid
import json

def printVotings():
	print("printing votings")
	for i in range(len(votings)):
		print("voting: [",i,"]")
		print(votings[i].question)

def handleCommand(line):

	line = line.split()
	line[0] = line[0].lower()
	if line[0] == "setid":
		if(len(line) < 2):
			print("not enough arguments!")
		else:
			thisNode.setId(line[1])

	elif line[0] == "addvoting":
		votingId = uuid.uuid1().hex
		question = input("what's the voting about? ")
		answerCount = input("how many possible answers? ")
		while not answerCount.isnumeric():
			answerCount = input("how many possible answers? It must be a number ")
		answerCount = int(answerCount)
		# print("answercount: ", answerCount)
		voteOptions = []
		for i in range(answerCount):
			voteOptions.append(input("answer: "))
		print(voteOptions)
		runtime = input("how many minutes should the vote be? ")
		while not runtime.isnumeric():
			runtime = input("how many minutes should the vote be? It must be a number ")
		runtime = int(runtime)
		currVoting = voting(votingId, thisNode.getId(), question, runtime, voteOptions)
		#here send info about created voting to all known nodes
		# global json
		# jsendtime = json.dumps(currVoting.end_time)
		js = {'nodeId':thisNode.getId(), 'votingId':currVoting.voting_id,'endTime':currVoting.end_time, 'question':question,'voteOptions':voteOptions}
		for node in thisNode.known_nodes:
			url = "http://"+str(thisNode.known_nodes[node].node_ip)+":"+str(thisNode.known_nodes[node].node_port)+"/start-voting"
			x = requests.post(url, json=js)
			print(x)
			print(x.content)
		votings.append(currVoting)
		thisNode.save()

	elif line[0] == "printvotings":
		printVotings()

	elif line[0] == "vote":
		printVotings()
		votingNum = input("which voting?")
		while not votingNum.isnumeric() or int(votingNum) >= len(votings):
			votingNum = input("which voting? must be numeric and one of the existing votings")
		vot = votings[int(votingNum)]
		print("voting options: ")
		print(vot.vote_options)
		option = input("which option?")
		while not option.isnumeric() or int(option) >= len(vot.vote_options):
			option = input("which option? must be numeric and one of the existing votings")
		option = int(option)
		if vot.host_node_id == thisNode.node_id:
			vot.castVote(thisNode.node_id, option)
		else:
			node = thisNode.known_nodes[vot.host_node_id]
			js = {'node_id':thisNode.node_id,'voting_id':vot.voting_id ,'vote_option':option}
			url = "http://"+str(node.node_ip)+":"+str(node.node_port)+"/send-vote"
			x = requests.post(url, json=js)
			print(x)
			print(x.content)


	elif line[0] == "printvotingresults":
		printVotings()
		votingNum = input("which voting?")
		while not votingNum.isnumeric() or int(votingNum) >= len(votings):
			votingNum = input("which voting? must be numeric and one of the existing votings")
		vot = votings[int(votingNum)]
		if vot.host_node_id == thisNode.node_id:
			print(vot.vote_options)
			print(vot.vote_results)
		else:
			print("voting hosted by another node")
			hostNode = thisNode.known_nodes[vot.host_node_id]
			url = "http://"+str(hostNode.node_ip)+":"+str(hostNode.node_port)+"/get-voting-results"
			x = requests.get(url, params={'votingId':vot.voting_id})
			print(x.content)

		# votingId = voting["votingid"]
		# endTime = voting["endTime"]
		# question = voting["question"]
		# voteOptions = voting["voteOptions"]

	elif line[0] == "addnode":
		node_id = input("what's the nodes id? ")
		node_ip = input("what's the nodes ip? ")
		# print("node_ip: [",node_ip,"]: ", len(node_ip))
		# if len(node_ip) < 2:
		# 	node_ip = thisNode.node_ip
		# print("node_ip: [",node_ip,"]: ", len(node_ip))
		node_port = input("what's the nodes port? ")
		thisNode.addNode(node_id,node_ip,node_port)
		sendHelloReply(node_ip, node_port)

	elif line[0] == "save":
		thisNode.save()

	else:
		print("unknown command")






