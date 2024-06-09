import socket
from settings import ip_addr, mask
from commons import thisNode, votings
from sendHelloReply import sendHelloReply
import traceback
import ipaddress
import json
import requests
import logging
import time

def check_port(port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    res = sock.connect_ex(('localhost', port))
    sock.close()
    return res == 0


def udpListner():
	while True:
		try:
			# UDP_IP = ip_addr
			host = ipaddress.IPv4Address(ip_addr)
			net = ipaddress.IPv4Network(ip_addr+'/'+mask, False)
			UDP_IP = str(net.broadcast_address)#ip_addr


			UDP_PORT = 10000#max 10004
			# print("UDP_PORT: ", UDP_PORT)
			# if check_port(UDP_PORT):
			# 	UDP_PORT += 1
			# print("UDP_PORT: ", UDP_PORT)

			sock = socket.socket(socket.AF_INET, # internet
								 socket.SOCK_DGRAM, #udp
								 socket.IPPROTO_UDP)
			sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
			sock.bind((UDP_IP,UDP_PORT))
			# print("listening for udp on port: ", UDP_PORT)
			while True:
				data, addr = sock.recvfrom(1024)
				print("received message: ", data.decode("utf-8"))
				obj = json.loads(data.decode("utf-8"))
				# print("nodeId: ",obj["nodeId"])
				node_id = obj["nodeId"]
				node_ip = obj["ip"]
				node_port = obj["port"]
				thisNode.addNode(node_id,node_ip,node_port)
				sendHelloReply(node_ip, node_port)
				print("sent hello reply to: ", node_ip, ":", node_port)
				# active_votings = []
				# for vot in votings:
				# 	# if len(active_votings) > 0:
				# 	# 	active_votings+=", "
				# 	active_votings.append({'votingId':vot.voting_id, 'question':vot.question,'endTime':vot.end_time,'voteOptions':vot.vote_options})

				# url = "http://"+node_ip+":"+str(node_port)+"/hello-reply"
				# js = {'ip':thisNode.getIp(),'nodeId':thisNode.getId(),'port':thisNode.getPort(),'activeVotings':active_votings}
				# # print("json: ",json)
				# x = requests.post(url, json = js)
				# # print(x)

		except Exception as e:
			logging.basicConfig(filename='logs/error.log',level=logging.DEBUG)
			logging.debug("udp listener exception:\n",traceback.format_exc())

if __name__ == '__main__':
	udpListner()
