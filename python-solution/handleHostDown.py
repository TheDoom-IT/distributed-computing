from commons import thisNode, elections, votings
from getTimestamp import getTimestamp
import requests
import json
from log import log
import traceback



def handleHostDown(hostId):
	elections[hostId] = getTimestamp()
	print("voting host down: ", hostId)
	print("gathering /election results")
	electionWon = True
	for node_id in thisNode.known_nodes:
		if node_id != hostId:
			node = thisNode.known_nodes[node_id]
			js = {'nodeId':thisNode.node_id,'oldHostId':hostId ,'timestamp':elections[hostId]}
			url = "http://"+str(node.node_ip)+":"+str(node.node_port)+"/election"
			try:
				x = requests.post(url, json=js)
				obj = json.loads(x.content.decode("utf-8"))
				if(obj['response'] == "OK"):
					pass
				else:
					electionWon = False
			except requests.exceptions.RequestException as e:
				print("exception: ", e)
				log("error sending election to node: ",node.node_id,"\n", traceback.format_exc())


	if electionWon:
		print("election won")
		for i in range(len(votings)):
			if votings[i].host_node_id == hostId:
				votings[i].host_node_id = thisNode.node_id
		for nodeId in thisNode.known_nodes:
			if nodeId != hostId:
				node = thisNode.known_nodes[nodeId]
				js = {'nodeId':thisNode.node_id,'oldHostId':hostId}
				url = "http://"+str(node.node_ip)+":"+str(node.node_port)+"/election-results"
				try:
					x = requests.post(url, json=js)
					print("request response: ", x)
					obj = json.loads(x.content.decode("utf-8"))
					#TODO write this stuff here
					votes = obj["votes"]
					for vote in votes:
						print("recovered vote: ", vote)
						votingId = vote[0]
						voteOption = vote[1]
						print("vote votingId: ", votingId, " vote option: ", voteOption)
						if voteOption != None:
							for i in range(len(votings)):
								if votings[i].voting_id == votingId:
									votings[i].castVote(nodeId, voteOption)

					
				except requests.exceptions.RequestException as e:
					print("exception: ", e)
					log("error sending election results: ",node.nodeId,"\n", traceback.format_exc())

	else:
		print("election lost")