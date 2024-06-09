import socket
from settings import ip_addr, mask, broadcast
import ipaddress
import json


def sendUDP(nodeId,nodePort):
	# host = ipaddress.IPv4Address(ip_addr)
	# net = ipaddress.IPv4Network(ip_addr+'/'+mask, False)
	# print('broadcast: ', net.broadcast_address)

	# UDP_IP = str(net.broadcast_address)#ip_addr
	UDP_PORT = 10000
	data = json.dumps({"nodeId":nodeId,"ip":ip_addr,"port":nodePort})
	sock = socket.socket(socket.AF_INET,socket.SOCK_DGRAM)
	sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
	for i in range(0,4):
		sock.sendto(bytes(data,encoding="utf-8"), (broadcast,UDP_PORT+i))
	print("broadcast messages sent")
