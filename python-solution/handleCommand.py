from commons import thisNode, votings
from classes import voting
from sendHelloReply import sendHelloReply
import requests
import uuid
import json
from simple_term_menu import TerminalMenu
from datetime import datetime
import logging
import traceback


def addVoting():
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
	runtime = input("how many minutes should the vote last? ")
	while not runtime.isnumeric():
		runtime = input("how many minutes should the vote last? It must be a number ")
	runtime = int(runtime)
	currVoting = voting(votingId, thisNode.getId(), question, runtime, voteOptions)
	#here send info about created voting to all known nodes
	# global json
	# jsendtime = json.dumps(currVoting.end_time)
	js = {'nodeId':thisNode.getId(), 'votingId':currVoting.voting_id,'endTime':currVoting.end_time, 'question':question,'voteOptions':voteOptions}
	for node in thisNode.known_nodes:
		url = "http://"+str(thisNode.known_nodes[node].node_ip)+":"+str(thisNode.known_nodes[node].node_port)+"/start-voting"
		try:
			x = requests.post(url, json=js)
		except requests.exceptions.RequestException as e:
			logging.basicConfig(filename='logs/connectionError.log',level=logging.DEBUG)
			logging.debug(traceback.format_exc())
		# print(x)
		# print(x.content)
	votings.append(currVoting)
	thisNode.save()

def printVotings():
	print("\nexisting votings:")
	for i in range(len(votings)):
		print("[",i,"]",votings[i].question,"\nhost node:[",votings[i].host_node_id,"]\noptions: ",votings[i].vote_options,"\n")

def vote():
	timestamp = datetime.timestamp(datetime.now())
	options = [x.question for x in votings if x.end_time > timestamp]
	terminal_menu = TerminalMenu(options)
	print("\nIn which voting would You like to cast the vote?")
	chosen = terminal_menu.show()
	i = 0
	votId = -1
	for vote in range(len(votings)):
		if i == chosen:
			votId = vote
		if votings[vote].end_time > timestamp:
			i += 1
	vot = votings[votId]
	terminal_menu = TerminalMenu(vot.vote_options)
	print("\nFor which option would You like to vote?")
	option = terminal_menu.show()
	if vot.host_node_id == thisNode.node_id:
		vot.castVote(thisNode.node_id, option)
	else:
		node = thisNode.known_nodes[vot.host_node_id]
		js = {'nodeId':thisNode.node_id,'votingId':vot.voting_id ,'voteOptionIndex':option}
		url = "http://"+str(node.node_ip)+":"+str(node.node_port)+"/send-vote"
		try:
			x = requests.post(url, json=js)
		except requests.exceptions.RequestException as e:
			logging.basicConfig(filename='logs/connectionError.log',level=logging.DEBUG)
			logging.debug(traceback.format_exc())

		# print(x)
		# print(x.content)

def printVotingResults():
	options = [x.question for x in votings]
	print("\nresults of which voting would You like to see?")
	terminal_menu = TerminalMenu(options)
	vot = votings[terminal_menu.show()]
	if vot.host_node_id == thisNode.node_id:
		print("\nvoting results:")
		for i in range(len(vot.vote_options)):
			print(vot.vote_results[i]," for: [",vot.vote_options[i],"]")
		print("")
	else:
		print("voting hosted by another node")
		hostNode = thisNode.known_nodes[vot.host_node_id]
		url = "http://"+str(hostNode.node_ip)+":"+str(hostNode.node_port)+"/get-voting-results/"+str(vot.voting_id)
		try:
			x = requests.get(url)#, params={'votingId':vot.voting_id})
			obj = json.loads(x.content.decode("utf-8"))
			for i in range(len(obj)):
				print(obj[i]," for: [",vot.vote_options[i],"]")
		except requests.exceptions.RequestException as e:
			logging.basicConfig(filename='logs/connectionError.log',level=logging.DEBUG)
			logging.debug(traceback.format_exc())


def printNodes():
	print("avaliable nodes:\n")
	for node in thisNode.known_nodes:
		print(' node id: ', thisNode.known_nodes[node].node_id, end="")
	print("")

def addNode():
	node_id = input("what's the nodes id? ")
	node_ip = input("what's the nodes ip? ")
	node_port = input("what's the nodes port? ")
	thisNode.addNode(node_id,node_ip,node_port)
	sendHelloReply(node_ip, node_port)

def save():
	thisNode.save()







