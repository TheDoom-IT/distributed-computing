import netifaces


#thinkpad : wlp3s0
#vivobook: wlp1s0
interfaces = netifaces.interfaces()
print("interfaces: ", interfaces)
i = 0
# address = netifaces.ifaddresses(interfaces[i])[netifaces.AF_INET]
# print("address: ", address)
# ip_addr = address[i]['addr']
# print("checking address: ",address[i]['addr'])
# while (ip_addr.startswith('127')):
# 	i+=1
# 	address = netifaces.ifaddresses(interfaces[i])[netifaces.AF_INET]
# 	print("address: ", address)
# 	ip_addr = address['addr']
# 	print("checking address: ",address['addr'])
# 	# print("checking address: ",addresses[0]['addr'])
print("checking interface: ", interfaces[i])
while not interfaces[i].startswith("w"): #wifi interfaces appear to always start with wl
	i += 1
	print("checking interface: ", interfaces[i])
address = netifaces.ifaddresses(interfaces[i])[netifaces.AF_INET]
print("address: ", address)

ip_addr = address[0]['addr']
print("ip address: ", ip_addr)
mask = address[0]['netmask']
broadcast = address[0]['broadcast']
# ip_addr = '192.168.1.140'
# mask = '255.255.255.0'
# date_format = "yyyy-MM-dd HH:mm:ss"
