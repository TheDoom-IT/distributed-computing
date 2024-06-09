import netifaces



interfaces = netifaces.interfaces()
i = 0
addresses = netifaces.ifaddresses(interfaces[i])[netifaces.AF_INET]
ip_addr = addresses[0]['addr']
print("checking address: ",addresses[0]['addr'])
while (ip_addr.startswith('127')):
	i+=1
	addresses = netifaces.ifaddresses(interfaces[i])[netifaces.AF_INET]
	ip_addr = addresses[0]['addr']
	# print("checking address: ",addresses[0]['addr'])

mask = addresses[0]['netmask']
broadcast = addresses[0]['broadcast']
# ip_addr = '192.168.1.140'
# mask = '255.255.255.0'
# date_format = "yyyy-MM-dd HH:mm:ss"