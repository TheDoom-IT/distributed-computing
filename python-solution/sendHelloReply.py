from commons import votings, thisNode
import requests
import logging
import traceback



def sendHelloReply(node_ip, node_port:int):
	active_votings = []
	for vot in votings:
		if vot.host_node_id == thisNode.node_id:
			# JavaScript uses milliseconds as timestamp, while python uses seconds
			# converts timestamp to milliseconds so it is compatible with JS solution
			end_time_as_nano = int(vot.end_time * 1000)
			active_votings.append({'votingId':vot.voting_id, 'question':vot.question,'endTime':end_time_as_nano,'voteOptions':vot.vote_options})

	url = "http://"+node_ip+":"+str(node_port)+"/hello-reply"
	json = {'ip':thisNode.getIp(),'nodeId':thisNode.getId(),'port':thisNode.getPort(),'activeVotings':active_votings}
	# print("json: ",json)
	try:
		x = requests.post(url, json = json)
	except requests.exceptions.RequestException as e:
		logging.basicConfig(filename='logs/connectionError.log',level=logging.DEBUG)
		logging.debug(traceback.format_exc())
	# print(x)
