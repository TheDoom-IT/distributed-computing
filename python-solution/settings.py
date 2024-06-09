import netifaces

def get_address():
	interfaces = netifaces.interfaces()

	# Linux wifi interfaces appear to always start with wl
	first_wl = next(filter(lambda x: x.startswith("wl"), interfaces), None)
	if first_wl is not None:
		return netifaces.ifaddresses(first_wl)[netifaces.AF_INET]

	# if no wl* interface is found then find any with broadcast
	ifaddresses = map(lambda x: netifaces.ifaddresses(x), interfaces)
	ipv4 = filter(lambda x: netifaces.AF_INET in x, ifaddresses)

	with_broadcast = next(filter(lambda x: "broadcast" in x.get(netifaces.AF_INET)[0], ipv4))
	if with_broadcast is not None:
		return with_broadcast[netifaces.AF_INET]

	raise Exception("No suitable interface found")


address = get_address()
ip_addr = address[0]['addr']
mask = address[0]['netmask']
broadcast = address[0]['broadcast']
