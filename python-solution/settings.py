import netifaces

addresses = netifaces.ifaddresses('en0')[netifaces.AF_INET]
ip_addr = addresses[0]['addr']
mask = addresses[0]['netmask']
broadcast = addresses[0]['broadcast']
# ip_addr = '192.168.1.140'
# mask = '255.255.255.0'
# date_format = "yyyy-MM-dd HH:mm:ss"
