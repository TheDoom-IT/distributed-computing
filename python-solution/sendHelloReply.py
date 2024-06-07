from commons import votings, thisNode
import requests
import logging
import traceback



def sendHelloReply(node_ip, node_port:int):
	active_votings = []
	for vot in votings:
		if vot.host_node_id == thisNode.node_id:
			active_votings.append({'votingId':vot.voting_id, 'question':vot.question,'endTime':vot.end_time,'voteOptions':vot.vote_options})

	url = "http://"+node_ip+":"+str(node_port)+"/hello-reply"
	json = {'ip':thisNode.getIp(),'nodeId':thisNode.getId(),'port':thisNode.getPort(),'activeVotings':active_votings}
	# print("json: ",json)
	try:
		x = requests.post(url, json = json)
	except requests.exceptions.RequestException as e:
		logging.basicConfig(filename='logs/connectionError.log',level=logging.DEBUG)
		logging.debug(traceback.format_exc())
	# print(x)