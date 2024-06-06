from concurrent.futures import ThreadPoolExecutor
from server import runServer
from commons import testQueue, thisNode
from handleCommand import handleCommand
import traceback
from settings import ip_addr, mask
from udpListner import udpListner
import socket



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
	thisNode.setId(node_id=node_id)

	port = input("On what port do I run? ")
	while not node_id.isnumeric():
		port = input("On what port do I run? must be numeric ")
	port = int(port)
	thisNode.setPort(port)


	TPE.submit(runServer, ip_addr, port)
	# TPE.submit(print,"\n\n\ntest test")
	time.sleep(2)
	sendUDP(node_id, port)
	TPE.submit(udpListner)

	UDP_IP = ip_addr
	UDP_PORT = 10000
	MESSAGE = b"hello"
	sock = socket.socket(socket.AF_INET,socket.SOCK_DGRAM)
	sock.sendto(MESSAGE, (UDP_IP,UDP_PORT))


	while True:
		try:
			a = input("type command:\n")
			print("input [",a,"]")
			handleCommand(a)
		except Exception as e:
			print(traceback.format_exc())