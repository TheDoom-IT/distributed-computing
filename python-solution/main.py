from concurrent.futures import ThreadPoolExecutor
from server import runServer
from commons import thisNode, votings
from classes import voting
from handleCommand import handleCommand
import traceback
from settings import ip_addr, mask
from udpListner import udpListner
import socket
import os.path



#for sendUDP
# import socket
# from settings import ip_addr
import ipaddress
import json
import time

TPE = ThreadPoolExecutor(max_workers = 8)

def sendUDP(nodeId,nodePort):
	host = ipaddress.IPv4Address(ip_addr)
	net = ipaddress.IPv4Network(ip_addr+'/'+mask, False)
	# print('broadcast: ', net.broadcast_address)

	UDP_IP = str(net.broadcast_address)#ip_addr
	UDP_PORT = 10000
	data = json.dumps({"nodeId":nodeId,"ip":ip_addr,"port":nodePort})
	sock = socket.socket(socket.AF_INET,socket.SOCK_DGRAM)
	sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
	sock.sendto(bytes(data,encoding="utf-8"), (UDP_IP,UDP_PORT))
	print("broadcast sent")



if __name__ == '__main__':
	# server_thread = tr.Thread(target = app.run)
	# server_thread.start()
	thisNode.setIp(ip_addr)
	node_id = input("what's my id? ")
	while not node_id.isnumeric():
		node_id = input("what's my id? must be numeric ")
	loadInput = False

	if os.path.isfile("savefiles/"+node_id+".txt"):
		print("savefile exists")
		rec = input("recover from file? (Y/n)")
		rec = rec.lower()
		while rec[0] != 'y' and rec[0] != 'n':
			rec = input("recover from file? (Y/n)")
			rec = rec.lower()
		if rec[0] == 'y':
			loadInput = True

	if not loadInput:
		thisNode.setId(node_id=node_id)

		node_port = input("On what port do I run? ")
		while not node_id.isnumeric():
			node_port = input("On what port do I run? must be numeric ")
		node_port = int(node_port)
		thisNode.setPort(node_port)
		thisNode.save()
	else:
		f = open("savefiles/"+node_id+".txt")

		obj = json.loads(f.read())
		print(obj)
		node_id = obj['node_id']
		node_ip = obj['node_ip']
		node_port = int(obj['node_port'])
		thisNode.setId(node_id=node_id)
		thisNode.setPort(node_port)
		for vot in obj['votings']: #vot is a dict
			votingObj = voting(vot['voting_id'],thisNode.getId(),vot['question'],vot['end_time'],vot['vote_options'])
			votingObj.addVotes(vot['votes'])
			votings.append(votingObj)



	TPE.submit(runServer, ip_addr, node_port)
	# TPE.submit(print,"\n\n\ntest test")
	time.sleep(2)
	sendUDP(node_id, node_port)
	TPE.submit(udpListner)

	# UDP_IP = ip_addr
	# UDP_PORT = 10000
	# MESSAGE = b"hello"
	# sock = socket.socket(socket.AF_INET,socket.SOCK_DGRAM)
	# sock.sendto(MESSAGE, (UDP_IP,UDP_PORT))


	while True:
		try:
			a = input("type command:\n")
			print("input [",a,"]")
			handleCommand(a)
		except Exception as e:
			print(traceback.format_exc())